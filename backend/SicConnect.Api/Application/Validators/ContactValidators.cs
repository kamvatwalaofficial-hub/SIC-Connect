using FluentValidation;
using SicConnect.Api.Application.Dtos;

namespace SicConnect.Api.Application.Validators;

public class ContactMessageDtoValidator : AbstractValidator<ContactMessageDto>
{
    public ContactMessageDtoValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(200);
        RuleFor(x => x.Subject).MaximumLength(150);
        RuleFor(x => x.Message).NotEmpty().MaximumLength(2000);
    }
}
