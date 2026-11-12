using AstronautHealthMonitoring.Data;
using AstronautHealthMonitoring.DTOs.Alerts;
using AstronautHealthMonitoring.DTOs.SymptomGuidance;
using AstronautHealthMonitoring.Models.Enums;
using AstronautHealthMonitoring.Services.Interfaces;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AstronautHealthMonitoring.Services.Implementations;

public class SymptomGuidanceService : ISymptomGuidanceService
{
    private readonly AppDbContext _dbContext;
    private readonly IHealthAlertService _healthAlertService;
    private readonly IMapper _mapper;
    private readonly ILogger<SymptomGuidanceService> _logger;

    public SymptomGuidanceService(
        AppDbContext dbContext,
        IHealthAlertService healthAlertService,
        IMapper mapper,
        ILogger<SymptomGuidanceService> logger)
    {
        _dbContext = dbContext;
        _healthAlertService = healthAlertService;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<IReadOnlyList<SymptomDto>> GetAllSymptomsAsync(CancellationToken cancellationToken = default)
    {
        var symptoms = await _dbContext.Symptoms
            .AsNoTracking()
            .OrderBy(s => s.BodyArea)
            .ThenBy(s => s.Name)
            .ToListAsync(cancellationToken);

        return _mapper.Map<List<SymptomDto>>(symptoms);
    }

    public async Task<IReadOnlyList<SpaceConditionDto>> GetAllConditionsAsync(string? search = null, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.SpaceConditions
            .AsNoTracking()
            .Include(c => c.ConditionSymptoms)
                .ThenInclude(cs => cs.Symptom)
            .Include(c => c.ConditionVitalSigns)
                .ThenInclude(cv => cv.VitalSignType)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToUpperInvariant();
            query = query.Where(c => c.Name.ToUpper().Contains(term) ||
                                     c.Code.ToUpper().Contains(term) ||
                                     c.Description.ToUpper().Contains(term));
        }

        var conditions = await query
            .OrderBy(c => c.Name)
            .ToListAsync(cancellationToken);

        return _mapper.Map<List<SpaceConditionDto>>(conditions);
    }

    public async Task<SymptomAssessmentResponseDto> EvaluateSymptomsAsync(EvaluateSymptomsRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var astronaut = await _dbContext.Astronauts.FirstOrDefaultAsync(a => a.Id == request.AstronautId, cancellationToken);
        if (astronaut == null)
        {
            throw new KeyNotFoundException($"Astronaut with ID {request.AstronautId} not found.");
        }

        if (!astronaut.IsActive)
        {
            throw new InvalidOperationException($"Astronaut '{astronaut.AstronautCode}' is deactivated and cannot undergo new symptom assessment.");
        }

        var response = new SymptomAssessmentResponseDto();

        if (request.SymptomCodes == null || request.SymptomCodes.Count == 0)
        {
            return response;
        }

        var normalizedCodes = request.SymptomCodes
            .Where(c => !string.IsNullOrWhiteSpace(c))
            .Select(c => c.Trim().ToUpperInvariant())
            .Distinct()
            .ToList();

        if (normalizedCodes.Count == 0)
        {
            return response;
        }

        var symptoms = await _dbContext.Symptoms
            .AsNoTracking()
            .Where(s => normalizedCodes.Contains(s.Code.ToUpper()))
            .ToListAsync(cancellationToken);

        var redFlags = symptoms.Where(s => s.IsRedFlag).ToList();

        var conditions = await _dbContext.SpaceConditions
            .AsNoTracking()
            .Where(c => c.IsMatchable)
            .Include(c => c.ConditionSymptoms)
                .ThenInclude(cs => cs.Symptom)
            .ToListAsync(cancellationToken);

        var matches = new List<ConditionMatchResultDto>();

        foreach (var condition in conditions)
        {
            var matchedConditionSymptoms = condition.ConditionSymptoms
                .Where(cs => cs.Symptom != null && normalizedCodes.Contains(cs.Symptom.Code.ToUpper()))
                .ToList();

            if (matchedConditionSymptoms.Count > 0)
            {
                var matchedNames = matchedConditionSymptoms
                    .Select(cs => cs.Symptom!.Name)
                    .Distinct()
                    .ToList();

                var hasConditionRedFlag = matchedConditionSymptoms.Any(cs => cs.Symptom != null && cs.Symptom.IsRedFlag);

                matches.Add(new ConditionMatchResultDto
                {
                    ConditionCode = condition.Code,
                    ConditionName = condition.Name,
                    Description = condition.Description,
                    SelfCareGuidance = condition.SelfCareGuidance,
                    WhenToContactMonitor = condition.WhenToContactMonitor,
                    SourceReference = condition.SourceReference,
                    MatchedSymptoms = matchedNames,
                    HasRedFlag = hasConditionRedFlag
                });
            }
        }

        response.Matches = matches
            .OrderByDescending(m => m.MatchedSymptoms.Count)
            .ThenByDescending(m => m.HasRedFlag)
            .ThenBy(m => m.ConditionName)
            .ToList();

        if (redFlags.Count > 0)
        {
            response.ShouldEscalate = true;
            response.EscalationReason = $"Red flag symptom(s) reported: {string.Join(", ", redFlags.Select(rf => rf.Name))}. Immediate medical evaluation required.";

            try
            {
                var alert = await _healthAlertService.TriggerManualAlertAsync(new TriggerManualAlertRequest
                {
                    AstronautId = astronaut.Id,
                    Severity = AlertSeverity.Emergency,
                    Title = "Red-Flag Symptom Escalation",
                    Message = $"Astronaut '{astronaut.AstronautCode}' reported red-flag symptom(s): {string.Join(", ", redFlags.Select(rf => rf.Name))}.",
                    Reason = "Automated escalation triggered by symptom guidance assessment detecting red-flag clinical signs.",
                    ActionRequired = "Immediate crew check and flight surgeon evaluation required."
                }, cancellationToken);

                response.TriggeredAlertId = alert.Id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to automatically trigger health alert during symptom assessment for astronaut {AstronautId}", astronaut.Id);
            }
        }

        return response;
    }
}

