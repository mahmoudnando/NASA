using AstronautHealthMonitoring.Models.Enums;

namespace AstronautHealthMonitoring.DTOs.Recommendations;

public class RecommendationDto
{
    public int Id { get; set; }
    public int AstronautId { get; set; }
    public string AstronautFullName { get; set; } = string.Empty;

    public DateTime GeneratedAt { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;

    public RecommendationCategory Category { get; set; }
    public RecommendationPriority Priority { get; set; }
    public RecommendationStatus Status { get; set; }

    public DateTime? ActionDueDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
