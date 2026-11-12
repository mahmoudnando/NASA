namespace AstronautHealthMonitoring.DTOs.Mood;

public class CreateMoodEntryRequest
{
    public Guid ClientGeneratedId { get; set; }
    public DateTime RecordedAt { get; set; }
    public int MoodScore { get; set; }
    public int StressLevel { get; set; }
    public string DominantEmotion { get; set; } = string.Empty;
    public string? Notes { get; set; }
}
