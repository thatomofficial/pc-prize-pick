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

    [Fact]
    public void AcceptsWellFormedRequest()
    {
        var request = new RegisterUserRequest
        {
            Email = "ada@example.com",
            DisplayName = "Ada",
            CellPhone = "+27821234567",
            Password = "secret-1",
        };

        Assert.Empty(Validate(request));
    }

    [Theory]
    [InlineData("0821234567")]
    [InlineData("+27721234567")]
    [InlineData("+27621234567")]
    public void AcceptsBothLocalAndInternationalSaMobile(string phone)
    {
        var request = new RegisterUserRequest
        {
            Email = "ada@example.com",
            DisplayName = "Ada",
            CellPhone = phone,
            Password = "secret-1",
        };

        Assert.Empty(Validate(request));
    }

    [Theory]
    [InlineData("not-an-email", nameof(RegisterUserRequest.Email))]
    [InlineData("ada@", nameof(RegisterUserRequest.Email))]
    public void RejectsMalformedEmail(string email, string member)
    {
        var request = new RegisterUserRequest
        {
            Email = email,
            DisplayName = "Ada",
            CellPhone = "0821234567",
            Password = "secret-1",
        };

        Assert.Contains(Validate(request), r => r.MemberNames.Contains(member));
    }

    [Fact]
    public void RejectsLandlineCellphone()
    {
        var request = new RegisterUserRequest
        {
            Email = "ada@example.com",
            DisplayName = "Ada",
            CellPhone = "+27121234567",
            Password = "secret-1",
        };

        Assert.Contains(
            Validate(request),
            r => r.MemberNames.Contains(nameof(RegisterUserRequest.CellPhone)));
    }

    [Fact]
    public void RejectsShortPassword()
    {
        var request = new RegisterUserRequest
        {
            Email = "ada@example.com",
            DisplayName = "Ada",
            CellPhone = "0821234567",
            Password = "abc",
        };

        Assert.Contains(
            Validate(request),
            r => r.MemberNames.Contains(nameof(RegisterUserRequest.Password)));
    }

    [Fact]
    public void RejectsShortDisplayName()
    {
        var request = new RegisterUserRequest
        {
            Email = "ada@example.com",
            DisplayName = "A",
            CellPhone = "0821234567",
            Password = "secret-1",
        };

        Assert.Contains(
            Validate(request),
            r => r.MemberNames.Contains(nameof(RegisterUserRequest.DisplayName)));
    }
}
