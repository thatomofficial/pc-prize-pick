using PcPrizePick.Domain.Users;

namespace PcPrizePick.Tests.Users;

public class UserTests
{
    [Theory]
    [InlineData("0821234567", "+27821234567")]
    [InlineData("0721234567", "+27721234567")]
    [InlineData("+27821234567", "+27821234567")]
    [InlineData("  082 123 4567  ", "+27821234567")]
    [InlineData("082-123-4567", "+27821234567")]
    public void NormaliseCellPhone_ConvertsSaLocalAndStripsSeparators(string raw, string expected)
    {
        Assert.Equal(expected, User.NormaliseCellPhone(raw));
    }

    [Theory]
    [InlineData("ada@example.com")]
    [InlineData("Ada+Loops@Example.Co.za")]
    public void IsValidEmail_AcceptsSimpleAddresses(string email)
    {
        Assert.True(User.IsValidEmail(User.NormaliseEmail(email)));
    }

    [Theory]
    [InlineData("not-an-email")]
    [InlineData("missing@tld")]
    [InlineData("")]
    public void IsValidEmail_RejectsMalformed(string email)
    {
        Assert.False(User.IsValidEmail(User.NormaliseEmail(email)));
    }

    [Theory]
    [InlineData("+27821234567")]
    [InlineData("+27721234567")]
    [InlineData("+27621234567")]
    public void IsValidCellPhone_AcceptsSaMobile(string normalised)
    {
        Assert.True(User.IsValidCellPhone(normalised));
    }

    [Theory]
    [InlineData("+27121234567")]  // landline prefix, not mobile
    [InlineData("+2782123456")]   // too short
    [InlineData("0821234567")]    // not normalised
    [InlineData("")]
    public void IsValidCellPhone_RejectsBadInput(string raw)
    {
        Assert.False(User.IsValidCellPhone(raw));
    }

    [Fact]
    public void Create_ReturnsUserWithNormalisedFields()
    {
        var user = User.Create(
            email: "  Ada@Example.COM ",
            displayName: "  Ada  ",
            cellPhone: "082 123 4567");

        Assert.Equal("ada@example.com", user.Email);
        Assert.Equal("Ada", user.DisplayName);
        Assert.Equal("+27821234567", user.CellPhone);
        Assert.NotEqual(Guid.Empty, user.Id);
    }

    [Fact]
    public void Create_ThrowsOnInvalidEmail()
    {
        var ex = Assert.Throws<ArgumentException>(() => User.Create(
            email: "nope",
            displayName: "Ada",
            cellPhone: "0821234567"));
        Assert.Equal("email", ex.ParamName);
    }

    [Fact]
    public void Create_ThrowsOnShortDisplayName()
    {
        var ex = Assert.Throws<ArgumentException>(() => User.Create(
            email: "ada@example.com",
            displayName: "A",
            cellPhone: "0821234567"));
        Assert.Equal("displayName", ex.ParamName);
    }

    [Fact]
    public void Create_ThrowsOnInvalidCellPhone()
    {
        var ex = Assert.Throws<ArgumentException>(() => User.Create(
            email: "ada@example.com",
            displayName: "Ada",
            cellPhone: "+12025550100"));
        Assert.Equal("cellPhone", ex.ParamName);
    }
}
