using FluentValidation.Results;
using PcPrizePick.Application.Users.Register;

namespace PcPrizePick.Tests.Users;

public class RegisterUserCommandValidatorTests
{
    private static readonly RegisterUserCommandValidator Validator = new();

    private static ValidationResult Validate(RegisterUserCommand command) =>
        Validator.Validate(command);

    private static RegisterUserCommand WellFormed() => new(
        Email: "ada@example.com",
        DisplayName: "Ada",
        CellPhone: "+27821234567",
        Password: "secret-1",
        AcceptedTermsOfUse: true,
        AcceptedPrivacyPolicy: true);

    [Fact]
    public void AcceptsWellFormedCommand()
    {
        Assert.True(Validate(WellFormed()).IsValid);
    }

    [Theory]
    [InlineData("0821234567")]
    [InlineData("+27721234567")]
    [InlineData("+27621234567")]
    [InlineData("082 123 4567")]    // spaces — common SA copy-paste format
    [InlineData("082-123-4567")]    // dashes
    [InlineData("(082) 123 4567")]  // parens + spaces
    [InlineData("  +27 82 123 4567  ")]
    public void AcceptsBothLocalAndInternationalSaMobile(string phone)
    {
        var command = WellFormed() with { CellPhone = phone };
        Assert.True(Validate(command).IsValid);
    }

    [Theory]
    [InlineData("not-an-email")]
    [InlineData("ada@")]
    public void RejectsMalformedEmail(string email)
    {
        var command = WellFormed() with { Email = email };
        Assert.Contains(
            Validate(command).Errors,
            e => e.PropertyName == nameof(RegisterUserCommand.Email));
    }

    [Fact]
    public void RejectsLandlineCellphone()
    {
        var command = WellFormed() with { CellPhone = "+27121234567" };
        Assert.Contains(
            Validate(command).Errors,
            e => e.PropertyName == nameof(RegisterUserCommand.CellPhone));
    }

    [Fact]
    public void RejectsShortPassword()
    {
        var command = WellFormed() with { Password = "abc" };
        Assert.Contains(
            Validate(command).Errors,
            e => e.PropertyName == nameof(RegisterUserCommand.Password));
    }

    [Fact]
    public void RejectsShortDisplayName()
    {
        var command = WellFormed() with { DisplayName = "A" };
        Assert.Contains(
            Validate(command).Errors,
            e => e.PropertyName == nameof(RegisterUserCommand.DisplayName));
    }

    [Fact]
    public void RejectsWhenTermsNotAccepted()
    {
        var command = WellFormed() with { AcceptedTermsOfUse = false };
        Assert.Contains(
            Validate(command).Errors,
            e => e.PropertyName == nameof(RegisterUserCommand.AcceptedTermsOfUse));
    }

    [Fact]
    public void RejectsWhenPrivacyNotAccepted()
    {
        var command = WellFormed() with { AcceptedPrivacyPolicy = false };
        Assert.Contains(
            Validate(command).Errors,
            e => e.PropertyName == nameof(RegisterUserCommand.AcceptedPrivacyPolicy));
    }
}
