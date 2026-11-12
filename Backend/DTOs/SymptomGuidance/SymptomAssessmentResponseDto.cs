namespace AstronautHealthMonitoring.DTOs.SymptomGuidance;

/// <summary>
/// Result of symptom assessment, including non-diagnostic educational guidance and emergency escalation flags.
/// </summary>
public class SymptomAssessmentResponseDto
{
    /// <summary>
    /// Explicit non-diagnostic disclaimer required for astronaut clinical safety.
    /// </summary>
    public string Disclaimer { get; set; } = "Guidance only, not a clinical diagnosis. Consult medical officer or flight surgeon.";

    /// <summary>
    /// Whether the reported signs warrant immediate flight monitor escalation.
    /// </summary>
    public bool ShouldEscalate { get; set; }

    /// <summary>
    /// Reason explaining why escalation was triggered.
    /// </summary>
    public string? EscalationReason { get; set; }

    /// <summary>
    /// Identifier of the automatically created health alert if emergency escalation was triggered.
    /// </summary>
    public int? TriggeredAlertId { get; set; }

    /// <summary>
    /// Ranked list of potential matching space health conditions based on reported symptoms.
    /// </summary>
    public List<ConditionMatchResultDto> Matches { get; set; } = new();
}

