using FluentValidation;
using PcPrizePick.Domain.Users;

namespace PcPrizePick.Application.Users.Register;

/// <summary>
/// Boundary validation for registration, run by the ValidationDecorator
/// before the handler executes. The cellphone rule reuses
/// <see cref="User.NormaliseCellPhone"/> + <see cref="User.IsValidCellPhone"/>
/// so the API accepts exactly the shapes the domain accepts (spaces, dashes,
/// parens, local 0XX and +27XX). The domain's <see cref="User.Create"/>
/// remains the source of truth and re-checks these invariants.
/// </summary>
internal sealed class RegisterUserCommandValidator : AbstractValidator<RegisterUserCommand>
{
    public RegisterUserCommandValidator()
    {
        RuleFor(c => c.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Enter a valid email address.")
            .MaximumLength(255).WithMessage("Email must be 255 characters or fewer.")
            .WithErrorCode("Users.Email");

        RuleFor(c => c.DisplayName)
            .NotEmpty().WithMessage("Display name is required.")
            .MinimumLength(2).WithMessage("Display name must be 2 to 120 characters.")
            .MaximumLength(120).WithMessage("Display name must be 2 to 120 characters.")
            .WithErrorCode("Users.DisplayName");

        RuleFor(c => c.CellPhone)
            .NotEmpty().WithMessage("Cell phone is required.")
            .Must(BeAValidSaMobile).WithMessage("Enter a valid SA mobile number (0XX… or +27XX…).")
            .WithErrorCode("Users.CellPhone");

        RuleFor(c => c.Password)
            .NotEmpty().WithMessage("Password is required.")
            .MinimumLength(6).WithMessage("Password must be at least 6 characters.")
            .MaximumLength(100).WithMessage("Password must be 100 characters or fewer.")
            .WithErrorCode("Users.Password");

        RuleFor(c => c.AcceptedTermsOfUse)
            .Equal(true).WithMessage("You must accept the Terms of Use.")
            .WithErrorCode("Users.AcceptedTermsOfUse");

        RuleFor(c => c.AcceptedPrivacyPolicy)
            .Equal(true).WithMessage("You must accept the Privacy Policy.")
            .WithErrorCode("Users.AcceptedPrivacyPolicy");
    }

    private static bool BeAValidSaMobile(string cellPhone) =>
        User.IsValidCellPhone(User.NormaliseCellPhone(cellPhone));
}
