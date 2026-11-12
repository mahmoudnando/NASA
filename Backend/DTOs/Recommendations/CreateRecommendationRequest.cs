using AstronautHealthMonitoring.Models.Enums;

namespace AstronautHealthMonitoring.DTOs.Recommendations;

public class CreateRecommendationRequest
{
    public int AstronautId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public RecommendationCategory Category { get; set; } = RecommendationCategory.Medical;
    public RecommendationPriority Priority { get; set; } = RecommendationPriority.Medium;
    public DateTime? ActionDueDate { get; set; }
}

