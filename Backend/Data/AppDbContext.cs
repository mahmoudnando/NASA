using AstronautHealthMonitoring.Data.Seed;
using AstronautHealthMonitoring.Models.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace AstronautHealthMonitoring.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Astronaut> Astronauts => Set<Astronaut>();
    public DbSet<Mission> Missions => Set<Mission>();
    public DbSet<VitalSignType> VitalSignTypes => Set<VitalSignType>();
    public DbSet<VitalSignReading> VitalSignReadings => Set<VitalSignReading>();
    public DbSet<ReferenceRange> ReferenceRanges => Set<ReferenceRange>();
    public DbSet<HealthMetricGuide> HealthMetricGuides => Set<HealthMetricGuide>();
    public DbSet<HealthAlert> HealthAlerts => Set<HealthAlert>();
    public DbSet<SleepRecord> SleepRecords => Set<SleepRecord>();
    public DbSet<MoodEntry> MoodEntries => Set<MoodEntry>();
    public DbSet<Recommendation> Recommendations => Set<Recommendation>();
    public DbSet<EmergencyProcedure> EmergencyProcedures => Set<EmergencyProcedure>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<Symptom> Symptoms => Set<Symptom>();
    public DbSet<SpaceCondition> SpaceConditions => Set<SpaceCondition>();
    public DbSet<ConditionSymptom> ConditionSymptoms => Set<ConditionSymptom>();
    public DbSet<ConditionVitalSign> ConditionVitalSigns => Set<ConditionVitalSign>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply all 12 entity configurations from this assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // Seed static catalogs, guides, baseline ranges, and emergency procedures
        modelBuilder.Seed();
    }
}

