using System.ComponentModel.DataAnnotations;
using PcPrizePick.Domain.Users;

namespace PcPrizePick.Application.Users;

/// <summary>
/// Validates a property holds a South African mobile number — accepting
/// the same shapes the domain accepts. The Frontend placeholder and our
/// own normaliser tolerate spaces, dashes and parentheses, so a strict
/// regex on the raw value would reject inputs the domain happily takes;
/// reusing <see cref="User.NormaliseCellPhone"/> + <see cref="User.IsValidCellPhone"/>
/// keeps the API boundary and the domain in agreement.
/// </summary>
[AttributeUsage(AttributeTargets.Property, AllowMultiple = false, Inherited = true)]
public sealed class SaCellPhoneAttribute : ValidationAttribute
{
    public SaCellPhoneAttribute()
        : base("Enter a valid SA mobile number (0XX… or +27XX…).")
    {
    }

    public override bool IsValid(object? value)
    {
        if (value is null) return true; // [Required] handles the null case.
        if (value is not string raw) return false;
        if (string.IsNullOrWhiteSpace(raw)) return false;
        var normalised = User.NormaliseCellPhone(raw);
        return User.IsValidCellPhone(normalised);
    }
}
