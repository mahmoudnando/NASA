using FluentValidation;
using AstronautHealthMonitoring.DTOs.Recommendations;

namespace AstronautHealthMonitoring.Validators.Recommendations;

public class CreateRecommendationRequestValidator : AbstractValidator<CreateRecommendationRequest>
{
    public CreateRecommendationRequestValidator()
    {
        RuleFor(x => x.AstronautId)
            .GreaterThan(0).WithMessage("AstronautId must be greater than 0.");

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(200);

        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("Content is required.")
            .MaximumLength(2000);

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Reason is required.")
            .MaximumLength(1000);

        RuleFor(x => x.Category)
            .IsInEnum().WithMessage("Valid RecommendationCategory is required.");

        RuleFor(x => x.Priority)
            .IsInEnum().WithMessage("Valid RecommendationPriority is required.");
    }
}

public class UpdateRecommendationStatusRequestValidator : AbstractValidator<UpdateRecommendationStatusRequest>
{
    public UpdateRecommendationStatusRequestValidator()
    {
        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Valid RecommendationStatus is required.");
    }
}

