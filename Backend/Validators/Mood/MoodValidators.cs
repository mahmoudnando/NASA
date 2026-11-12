using FluentValidation;
using Microsoft.Extensions.Configuration;
using AstronautHealthMonitoring.DTOs.Mood;

namespace AstronautHealthMonitoring.Validators.Mood;

public class CreateMoodEntryRequestValidator : AbstractValidator<CreateMoodEntryRequest>
{
    public CreateMoodEntryRequestValidator(IConfiguration? configuration = null, TimeProvider? timeProvider = null)
    {
        var provider = timeProvider ?? TimeProvider.System;
        // PLACEHOLDER: 5-minute future tolerance for offline client clock skew; requires operational review
        var toleranceMinutes = configuration?["Sync:FutureToleranceMinutes"] is string val && double.TryParse(val, out var m) ? m : 5.0;

        RuleFor(x => x.ClientGeneratedId)
            .NotEmpty().WithMessage("ClientGeneratedId is required and cannot be empty.");

        RuleFor(x => x.MoodScore)
            .InclusiveBetween(1, 10).WithMessage("MoodScore must be between 1 and 10.");

        RuleFor(x => x.StressLevel)
            .InclusiveBetween(1, 10).WithMessage("StressLevel must be between 1 and 10.");

        RuleFor(x => x.DominantEmotion)
            .NotEmpty().WithMessage("DominantEmotion is required.")
            .MaximumLength(50);

        RuleFor(x => x.Notes)
            .MaximumLength(1000);

        RuleFor(x => x.RecordedAt)
            .NotEmpty().WithMessage("RecordedAt timestamp is required.")
            .Must(t => t <= provider.GetUtcNow().UtcDateTime.AddMinutes(toleranceMinutes))
            .WithMessage("RecordedAt cannot be in the future beyond tolerance.");
    }
}
