using FluentValidation;
using SicConnect.Api.Application.Dtos;

namespace SicConnect.Api.Application.Validators;

public class UpdateProfileDtoValidator : AbstractValidator<UpdateProfileDto>
{
    public UpdateProfileDtoValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Cohort).MaximumLength(50);
        RuleFor(x => x.Location).MaximumLength(120);
        RuleFor(x => x.Industry).MaximumLength(120);
        RuleFor(x => x.Bio).MaximumLength(2000);
        RuleFor(x => x.Headline).MaximumLength(200);
        RuleForEach(x => x.Skills).ChildRules(s =>
            s.RuleFor(y => y.Name).NotEmpty().MaximumLength(100));
        RuleForEach(x => x.Certifications).ChildRules(c =>
            c.RuleFor(y => y.Name).NotEmpty().MaximumLength(150));
    }
}

public class CreateOpportunityDtoValidator : AbstractValidator<CreateOpportunityDto>
{
    public CreateOpportunityDtoValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Organisation).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).MaximumLength(4000);
        RuleFor(x => x.Type).IsInEnum();
    }
}

public class CreateEventDtoValidator : AbstractValidator<CreateEventDto>
{
    public CreateEventDtoValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).MaximumLength(4000);
        RuleFor(x => x.Venue).MaximumLength(250);
        RuleFor(x => x.Capacity).GreaterThan(0).When(x => x.Capacity.HasValue);
        RuleFor(x => x.EndsAt)
            .GreaterThanOrEqualTo(x => x.StartsAt)
            .When(x => x.EndsAt.HasValue)
            .WithMessage("Event end time cannot be before the start time.");
    }
}

public class CreateProjectDtoValidator : AbstractValidator<CreateProjectDto>
{
    public CreateProjectDtoValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Summary).MaximumLength(1000);
        RuleFor(x => x.TechStack).MaximumLength(300);
    }
}

public class CreateAnnouncementDtoValidator : AbstractValidator<CreateAnnouncementDto>
{
    public CreateAnnouncementDtoValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Body).NotEmpty().MaximumLength(8000);
        RuleFor(x => x.Audience).MaximumLength(40);
    }
}

public class CreateConnectionDtoValidator : AbstractValidator<CreateConnectionDto>
{
    public CreateConnectionDtoValidator()
    {
        RuleFor(x => x.AddresseeUserId).GreaterThan(0);
        RuleFor(x => x.Type).IsInEnum();
        RuleFor(x => x.Message).MaximumLength(500);
    }
}

public class CreateApplicationDtoValidator : AbstractValidator<CreateApplicationDto>
{
    public CreateApplicationDtoValidator()
    {
        RuleFor(x => x.CoverNote).MaximumLength(2000);
    }
}

public class SendMessageDtoValidator : AbstractValidator<SendMessageDto>
{
    public SendMessageDtoValidator()
    {
        RuleFor(x => x.Body).NotEmpty().MaximumLength(4000);
    }
}
