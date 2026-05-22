using System.ComponentModel.DataAnnotations;
using PcPrizePick.Application.Users;

namespace PcPrizePick.Tests.Users;

public class RegisterUserRequestTests
{
    private static IReadOnlyList<ValidationResult> Validate(RegisterUserRequest request)
    {
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(
            request,
            new ValidationContext(request),
            results,
            validateAllProperties: true);
        return results;
    }

    private static RegisterUserRequest WellFormed() => new()
    {
        Email = "ada@example.com",
        DisplayName = "Ada",
        CellPhone = "+27821234567",
        Password = "secret-1",
        AcceptedTermsOfUse = true,
        AcceptedPrivacyPolicy = true,
    };

    [Fact]
    public void AcceptsWellFormedRequest()
    {
        Assert.Empty(Validate(WellFormed()));
    }

    [Theory]
    [InlineData("0821234567")]
    [InlineData("+27721234567")]
    [InlineData("+27621234567")]
    public void AcceptsBothLocalAndInternationalSaMobile(string phone)
    {
        var request = WellFormed() with { CellPhone = phone };
        Assert.Empty(Validate(request));
    }

    [Theory]
    [InlineData("not-an-email", nameof(RegisterUserRequest.Email))]
    [InlineData("ada@", nameof(RegisterUserRequest.Email))]
    public void RejectsMalformedEmail(string email, string member)
    {
        var request = WellFormed() with { Email = email };
        Assert.Contains(Validate(request), r => r.MemberNames.Contains(member));
    }

    [Fact]
    public void RejectsLandlineCellphone()
    {
        var request = WellFormed() with { CellPhone = "+27121234567" };
        Assert.Contains(
            Validate(request),
            r => r.MemberNames.Contains(nameof(RegisterUserRequest.CellPhone)));
    }

    [Fact]
    public void RejectsShortPassword()
    {
        var request = WellFormed() with { Password = "abc" };
        Assert.Contains(
            Validate(request),
            r => r.MemberNames.Contains(nameof(RegisterUserRequest.Password)));
    }

    [Fact]
    public void RejectsShortDisplayName()
    {
        var request = WellFormed() with { DisplayName = "A" };
        Assert.Contains(
            Validate(request),
            r => r.MemberNames.Contains(nameof(RegisterUserRequest.DisplayName)));
    }

    [Fact]
    public void RejectsWhenTermsNotAccepted()
    {
        var request = WellFormed() with { AcceptedTermsOfUse = false };
        Assert.Contains(
            Validate(request),
            r => r.MemberNames.Contains(nameof(RegisterUserRequest.AcceptedTermsOfUse)));
    }

    [Fact]
    public void RejectsWhenPrivacyNotAccepted()
    {
        var request = WellFormed() with { AcceptedPrivacyPolicy = false };
        Assert.Contains(
            Validate(request),
            r => r.MemberNames.Contains(nameof(RegisterUserRequest.AcceptedPrivacyPolicy)));
    }
}
