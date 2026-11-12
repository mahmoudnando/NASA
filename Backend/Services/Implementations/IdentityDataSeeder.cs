using AstronautHealthMonitoring.Data;
using AstronautHealthMonitoring.DTOs.Auth;
using AstronautHealthMonitoring.Models.Entities;
using AstronautHealthMonitoring.Models.Enums;
using AstronautHealthMonitoring.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AstronautHealthMonitoring.Services.Implementations;

public class IdentityDataSeeder : IIdentityDataSeeder
{
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly AppDbContext _dbContext;
    private readonly IConfiguration _configuration;
    private readonly ILogger<IdentityDataSeeder> _logger;

    public IdentityDataSeeder(
        RoleManager<IdentityRole> roleManager,
        UserManager<ApplicationUser> userManager,
        AppDbContext dbContext,
        IConfiguration configuration,
        ILogger<IdentityDataSeeder> logger)
    {
        _roleManager = roleManager;
        _userManager = userManager;
        _dbContext = dbContext;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        // Fail-fast validation of required secrets before proceeding
        ValidateRequiredSecrets();

        // 1. Ensure Roles exist (Only Astronaut and Monitor)
        await EnsureRoleExistsAsync(UserRoles.Astronaut);
        await EnsureRoleExistsAsync(UserRoles.Monitor);

        // 2. Ensure 1 Mission exists
        var mission = await EnsureMissionExistsAsync(cancellationToken);

        // 3. Seed 3 Demo Astronauts assigned to the Mission
        await SeedDemoAstronautsAsync(mission, cancellationToken);

        // 4. Seed 1 Demo Monitor
        await SeedDemoMonitorAsync();

        // 5. Seed Initial Clinical Telemetry (Vitals, Sleep, Mood, Recommendations, Alerts, Chat) if empty
        await SeedInitialTelemetryAsync(cancellationToken);
    }

    private void ValidateRequiredSecrets()
    {
        var missingKeys = new List<string>();

        if (string.IsNullOrWhiteSpace(_configuration["Jwt:Key"]))
        {
            missingKeys.Add("Jwt:Key");
        }

        var fallbackAstroPassword = _configuration["SeedUsers:Astronaut:Password"];
        for (var i = 0; i < 3; i++)
        {
            var key = $"SeedUsers:Astronauts:{i}:Password";
            if (string.IsNullOrWhiteSpace(_configuration[key]) && string.IsNullOrWhiteSpace(fallbackAstroPassword))
            {
                missingKeys.Add(key);
            }
        }

        if (string.IsNullOrWhiteSpace(_configuration["SeedUsers:Monitor:Password"]))
        {
            missingKeys.Add("SeedUsers:Monitor:Password");
        }

        if (missingKeys.Count > 0)
        {
            var message = $"Startup failed: Seeding is enabled, but the following required configuration/user-secrets keys are missing: {string.Join(", ", missingKeys)}. Set them via 'dotnet user-secrets set \"<Key>\" \"<Value>\"'.";
            _logger.LogError(message);
            throw new InvalidOperationException(message);
        }
    }

    private async Task EnsureRoleExistsAsync(string roleName)
    {
        if (!await _roleManager.RoleExistsAsync(roleName))
        {
            var result = await _roleManager.CreateAsync(new IdentityRole(roleName));
            if (result.Succeeded)
            {
                _logger.LogInformation("Role '{RoleName}' created successfully.", roleName);
            }
            else
            {
                _logger.LogError("Failed to create role '{RoleName}': {Errors}",
                    roleName, string.Join(", ", result.Errors.Select(e => e.Description)));
            }
        }
    }

    private async Task<Mission> EnsureMissionExistsAsync(CancellationToken cancellationToken)
    {
        var mission = await _dbContext.Missions
            .FirstOrDefaultAsync(m => m.Code == "ARES-III", cancellationToken);

        if (mission == null)
        {
            mission = new Mission
            {
                Code = "ARES-III",
                Name = "Ares III Expedition",
                Destination = "Mars - Acidalia Planitia",
                StartDate = new DateTime(2026, 1, 15, 0, 0, 0, DateTimeKind.Utc),
                EndDate = new DateTime(2026, 12, 15, 0, 0, 0, DateTimeKind.Utc),
                Status = MissionStatus.Active,
                CreatedAt = DateTime.UtcNow
            };

            _dbContext.Missions.Add(mission);
            await _dbContext.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Seeded demo Mission '{Code} - {Name}'.", mission.Code, mission.Name);
        }

        return mission;
    }

    private async Task SeedDemoAstronautsAsync(Mission mission, CancellationToken cancellationToken)
    {
        var defaultAstronauts = new[]
        {
            new
            {
                Index = 0,
                DefaultUsername = "astro.vance",
                DefaultEmail = "morgan.vance@mission.space",
                DefaultFullName = "Morgan Vance",
                AstronautCode = "AST-001",
                DateOfBirth = new DateTime(1988, 5, 12, 0, 0, 0, DateTimeKind.Utc),
                Gender = "Non-binary",
                BloodType = "O+",
                HeightCm = 175.0,
                WeightKg = 70.0
            },
            new
            {
                Index = 1,
                DefaultUsername = "astro.lee",
                DefaultEmail = "jordan.lee@mission.space",
                DefaultFullName = "Jordan Lee",
                AstronautCode = "AST-002",
                DateOfBirth = new DateTime(1991, 8, 24, 0, 0, 0, DateTimeKind.Utc),
                Gender = "Female",
                BloodType = "A+",
                HeightCm = 168.0,
                WeightKg = 62.0
            },
            new
            {
                Index = 2,
                DefaultUsername = "astro.quinn",
                DefaultEmail = "taylor.quinn@mission.space",
                DefaultFullName = "Taylor Quinn",
                AstronautCode = "AST-003",
                DateOfBirth = new DateTime(1985, 11, 3, 0, 0, 0, DateTimeKind.Utc),
                Gender = "Male",
                BloodType = "B+",
                HeightCm = 182.0,
                WeightKg = 78.0
            }
        };

        foreach (var def in defaultAstronauts)
        {
            var username = _configuration[$"SeedUsers:Astronauts:{def.Index}:Username"]
                ?? _configuration["SeedUsers:Astronaut:Username"]
                ?? def.DefaultUsername;

            var email = _configuration[$"SeedUsers:Astronauts:{def.Index}:Email"]
                ?? _configuration["SeedUsers:Astronaut:Email"]
                ?? def.DefaultEmail;

            var fullName = _configuration[$"SeedUsers:Astronauts:{def.Index}:FullName"]
                ?? _configuration["SeedUsers:Astronaut:FullName"]
                ?? def.DefaultFullName;

            var code = _configuration[$"SeedUsers:Astronauts:{def.Index}:AstronautCode"]
                ?? def.AstronautCode;

            var password = _configuration[$"SeedUsers:Astronauts:{def.Index}:Password"]
                ?? _configuration["SeedUsers:Astronaut:Password"];

            if (string.IsNullOrWhiteSpace(password))
            {
                continue;
            }

            var user = await _userManager.FindByNameAsync(username);
            if (user == null)
            {
                user = new ApplicationUser
                {
                    UserName = username,
                    Email = email,
                    FullName = fullName,
                    EmailConfirmed = true,
                    CreatedAt = DateTime.UtcNow
                };

                var createResult = await _userManager.CreateAsync(user, password);
                if (!createResult.Succeeded)
                {
                    _logger.LogError("Failed to create demo astronaut user '{Username}': {Errors}",
                        username, string.Join(", ", createResult.Errors.Select(e => e.Description)));
                    continue;
                }

                await _userManager.AddToRoleAsync(user, UserRoles.Astronaut);
                _logger.LogInformation("Demo astronaut user '{Username}' created and assigned role '{Role}'.", username, UserRoles.Astronaut);
            }

            // Link to domain Astronaut record assigned to mission
            var astronaut = await _dbContext.Astronauts
                .FirstOrDefaultAsync(a => a.AstronautCode == code, cancellationToken);

            var names = fullName.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
            var firstName = names.Length > 0 ? names[0] : fullName;
            var lastName = names.Length > 1 ? names[1] : string.Empty;

            if (astronaut == null)
            {
                astronaut = new Astronaut
                {
                    AstronautCode = code,
                    FirstName = firstName,
                    LastName = lastName,
                    FullName = fullName,
                    DateOfBirth = def.DateOfBirth,
                    Gender = def.Gender,
                    BloodType = def.BloodType,
                    HeightCm = def.HeightCm,
                    WeightKg = def.WeightKg,
                    UserId = user.Id,
                    MissionId = mission.Id,
                    CreatedAt = DateTime.UtcNow
                };
                _dbContext.Astronauts.Add(astronaut);
                await _dbContext.SaveChangesAsync(cancellationToken);
                _logger.LogInformation("Created new Astronaut profile '{Code}' assigned to Mission '{MissionCode}' and linked to user '{UserId}'.",
                    code, mission.Code, user.Id);
            }
            else
            {
                var modified = false;
                if (astronaut.UserId != user.Id)
                {
                    astronaut.UserId = user.Id;
                    modified = true;
                }
                if (astronaut.MissionId != mission.Id)
                {
                    astronaut.MissionId = mission.Id;
                    modified = true;
                }
                if (modified)
                {
                    await _dbContext.SaveChangesAsync(cancellationToken);
                    _logger.LogInformation("Updated Astronaut profile '{Code}' assignment to Mission '{MissionCode}' and link to user '{UserId}'.",
                        code, mission.Code, user.Id);
                }
            }
        }
    }

    private async Task SeedDemoMonitorAsync()
    {
        var username = _configuration["SeedUsers:Monitor:Username"] ?? "monitor.rivera";
        var email = _configuration["SeedUsers:Monitor:Email"] ?? "casey.rivera@missioncontrol.space";
        var fullName = _configuration["SeedUsers:Monitor:FullName"] ?? "Casey Rivera";
        var password = _configuration["SeedUsers:Monitor:Password"];

        if (string.IsNullOrWhiteSpace(password))
        {
            return;
        }

        var user = await _userManager.FindByNameAsync(username);
        if (user == null)
        {
            user = new ApplicationUser
            {
                UserName = username,
                Email = email,
                FullName = fullName,
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            };

            var createResult = await _userManager.CreateAsync(user, password);
            if (!createResult.Succeeded)
            {
                _logger.LogError("Failed to create demo monitor user '{Username}': {Errors}",
                    username, string.Join(", ", createResult.Errors.Select(e => e.Description)));
                return;
            }

            await _userManager.AddToRoleAsync(user, UserRoles.Monitor);
            _logger.LogInformation("Demo monitor user '{Username}' created and assigned role '{Role}'.", username, UserRoles.Monitor);
        }
    }

    private async Task SeedInitialTelemetryAsync(CancellationToken cancellationToken)
    {
        if (await _dbContext.VitalSignReadings.AnyAsync(cancellationToken))
        {
            return;
        }

        var ast1 = await _dbContext.Astronauts.FirstOrDefaultAsync(a => a.AstronautCode == "AST-001", cancellationToken);
        var ast2 = await _dbContext.Astronauts.FirstOrDefaultAsync(a => a.AstronautCode == "AST-002", cancellationToken);
        var ast3 = await _dbContext.Astronauts.FirstOrDefaultAsync(a => a.AstronautCode == "AST-003", cancellationToken);

        if (ast1 == null) return;

        var now = DateTime.UtcNow;

        // 1. Seed Vital Sign Readings for AST-001 (Morgan Vance)
        var vitals = new List<VitalSignReading>
        {
            new()
            {
                ClientGeneratedId = Guid.NewGuid(),
                AstronautId = ast1.Id,
                VitalSignTypeId = 1, // HR
                Value = 72,
                Status = VitalSignStatus.Routine,
                MeasurementMethod = "Optical PPG + ECG",
                SensorLocation = "Thoracic Biometric Vest",
                BodyPosition = BodyPosition.MicrogravityFloating,
                ActivityContext = ActivityContext.Resting,
                DataQuality = DataQuality.Valid,
                RecordedAt = now.AddMinutes(-15),
                CreatedAt = now.AddMinutes(-15),
                Notes = "Nominal orbital resting heart rate."
            },
            new()
            {
                ClientGeneratedId = Guid.NewGuid(),
                AstronautId = ast1.Id,
                VitalSignTypeId = 2, // BP
                Value = 118,
                SecondaryValue = 76,
                Status = VitalSignStatus.Routine,
                MeasurementMethod = "Oscillometric Cuff",
                SensorLocation = "Left Brachial Artery",
                BodyPosition = BodyPosition.MicrogravityFloating,
                ActivityContext = ActivityContext.Resting,
                DataQuality = DataQuality.Valid,
                RecordedAt = now.AddMinutes(-14),
                CreatedAt = now.AddMinutes(-14),
                Notes = "Cephalad fluid shift stabilized."
            },
            new()
            {
                ClientGeneratedId = Guid.NewGuid(),
                AstronautId = ast1.Id,
                VitalSignTypeId = 3, // SPO2
                Value = 98,
                Status = VitalSignStatus.Routine,
                MeasurementMethod = "Dual-Wavelength Pulse Oximetry",
                SensorLocation = "Distal Phalanx",
                BodyPosition = BodyPosition.MicrogravityFloating,
                ActivityContext = ActivityContext.Resting,
                DataQuality = DataQuality.Valid,
                RecordedAt = now.AddMinutes(-13),
                CreatedAt = now.AddMinutes(-13),
                Notes = "Cabin O2 partial pressure optimal."
            },
            new()
            {
                ClientGeneratedId = Guid.NewGuid(),
                AstronautId = ast1.Id,
                VitalSignTypeId = 4, // TEMP
                Value = 36.6,
                Status = VitalSignStatus.Routine,
                MeasurementMethod = "Infrared Tympanic Sensor",
                SensorLocation = "Tympanic / Temporal",
                BodyPosition = BodyPosition.MicrogravityFloating,
                ActivityContext = ActivityContext.Resting,
                DataQuality = DataQuality.Valid,
                RecordedAt = now.AddMinutes(-12),
                CreatedAt = now.AddMinutes(-12),
                Notes = "Core thermal homeostasis nominal."
            },
            new()
            {
                ClientGeneratedId = Guid.NewGuid(),
                AstronautId = ast1.Id,
                VitalSignTypeId = 5, // GLUCOSE
                Value = 88,
                Status = VitalSignStatus.Routine,
                MeasurementMethod = "Interstitial Continuous Biosensor",
                SensorLocation = "Subcutaneous Deltoid Patch",
                BodyPosition = BodyPosition.MicrogravityFloating,
                ActivityContext = ActivityContext.Resting,
                MealContext = MealContext.Fasting,
                DataQuality = DataQuality.Valid,
                RecordedAt = now.AddMinutes(-10),
                CreatedAt = now.AddMinutes(-10),
                Notes = "Fasting metabolic baseline optimal."
            }
        };

        if (ast2 != null)
        {
            vitals.Add(new VitalSignReading
            {
                ClientGeneratedId = Guid.NewGuid(),
                AstronautId = ast2.Id,
                VitalSignTypeId = 1,
                Value = 68,
                Status = VitalSignStatus.Routine,
                MeasurementMethod = "Optical PPG + ECG",
                SensorLocation = "Thoracic Biometric Vest",
                BodyPosition = BodyPosition.MicrogravityFloating,
                ActivityContext = ActivityContext.Resting,
                DataQuality = DataQuality.Valid,
                RecordedAt = now.AddMinutes(-20),
                CreatedAt = now.AddMinutes(-20)
            });
        }

        if (ast3 != null)
        {
            vitals.Add(new VitalSignReading
            {
                ClientGeneratedId = Guid.NewGuid(),
                AstronautId = ast3.Id,
                VitalSignTypeId = 1,
                Value = 104,
                Status = VitalSignStatus.MedicalAttention,
                MeasurementMethod = "Optical PPG + ECG",
                SensorLocation = "Thoracic Biometric Vest",
                BodyPosition = BodyPosition.MicrogravityFloating,
                ActivityContext = ActivityContext.PostExercise,
                DataQuality = DataQuality.Valid,
                RecordedAt = now.AddMinutes(-18),
                CreatedAt = now.AddMinutes(-18),
                Notes = "Elevated HR post-ARED resistance cycle."
            });
        }

        _dbContext.VitalSignReadings.AddRange(vitals);

        // 2. Seed Sleep Record for AST-001
        _dbContext.SleepRecords.Add(new SleepRecord
        {
            ClientGeneratedId = Guid.NewGuid(),
            AstronautId = ast1.Id,
            StartTime = now.AddHours(-10),
            EndTime = now.AddHours(-2.25),
            DurationHours = 7.75,
            Quality = SleepQuality.Excellent,
            DeepSleepMinutes = 115,
            RemSleepMinutes = 105,
            LightSleepMinutes = 225,
            AwakeMinutes = 20,
            SleepEfficiencyPercentage = 95.7,
            RecordedAt = now.AddHours(-2),
            CreatedAt = now.AddHours(-2),
            Notes = "Restorative circadian cycle in acoustic sleep station."
        });

        // 3. Seed Mood Entry for AST-001
        _dbContext.MoodEntries.Add(new MoodEntry
        {
            ClientGeneratedId = Guid.NewGuid(),
            AstronautId = ast1.Id,
            MoodScore = 9,
            StressLevel = 2,
            DominantEmotion = "Focused & Optimistic",
            RecordedAt = now.AddHours(-1),
            CreatedAt = now.AddHours(-1),
            Notes = "High mental clarity and strong crew cohesion."
        });

        // 4. Seed Flight Surgeon Recommendations for AST-001
        _dbContext.Recommendations.AddRange(
            new Recommendation
            {
                AstronautId = ast1.Id,
                Title = "ARED High-Resistance Countermeasure Protocol (45 min)",
                Content = "Complete 4 sets of squats and deadlifts on ARED with isotonic hydration.",
                Reason = "Mitigate bone mineral density loss and cephalad fluid shift in microgravity.",
                Category = RecommendationCategory.Physical,
                Priority = RecommendationPriority.High,
                Status = RecommendationStatus.Pending,
                GeneratedAt = now.AddHours(-3),
                CreatedAt = now.AddHours(-3)
            },
            new Recommendation
            {
                AstronautId = ast1.Id,
                Title = "Blue-Enriched LED Circadian Shift (460nm Reduction)",
                Content = "Switch habitat lighting to warm spectrum 90 minutes prior to sleep window.",
                Reason = "Preserve endogenous melatonin secretion against 16 orbital sunrises/day.",
                Category = RecommendationCategory.Sleep,
                Priority = RecommendationPriority.Medium,
                Status = RecommendationStatus.Acknowledged,
                GeneratedAt = now.AddHours(-6),
                CreatedAt = now.AddHours(-6)
            }
        );

        // 5. Seed Chat Messages between AST-001 and Monitor
        var monitorUser = await _userManager.FindByNameAsync("monitor.rivera");
        if (monitorUser != null)
        {
            _dbContext.ChatMessages.AddRange(
                new ChatMessage
                {
                    ClientGeneratedId = Guid.NewGuid(),
                    AstronautId = ast1.Id,
                    SenderUserId = monitorUser.Id,
                    SenderRole = UserRoles.Monitor,
                    Content = "Houston Flight Surgeon here. Morning telemetry packet received — HR 72 bpm and SpO2 98% look rock solid.",
                    RecordedAt = now.AddMinutes(-30),
                    SentAt = now.AddMinutes(-30),
                    CreatedAt = now.AddMinutes(-30)
                },
                new ChatMessage
                {
                    ClientGeneratedId = Guid.NewGuid(),
                    AstronautId = ast1.Id,
                    SenderUserId = ast1.UserId ?? monitorUser.Id,
                    SenderRole = UserRoles.Astronaut,
                    Content = "Copy Houston. Feeling great after 7.75h sleep cycle. Starting ARED resistance protocol shortly.",
                    RecordedAt = now.AddMinutes(-25),
                    SentAt = now.AddMinutes(-25),
                    CreatedAt = now.AddMinutes(-25)
                }
            );
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Seeded initial clinical telemetry (Vitals, Sleep, Mood, Recommendations, Chat) for demo crew.");
    }
}
