using System.ComponentModel.DataAnnotations;

namespace PcPrizePick.Application.Users;

/// <summary>
/// Boundary contract for new-user registration. DataAnnotations give the API
/// layer a one-call surface (<see cref="Validator.TryValidateObject"/>) before
/// any domain logic runs; the matching invariants are duplicated on
/// <c>User.Create()</c> so the domain stays the source of truth.
/// </summary>
public sealed record RegisterUserRequest
{
    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Enter a valid email address.")]
    [StringLength(255, ErrorMessage = "Email must be 255 characters or fewer.")]
    public required string Email { get; init; }

    [Required(ErrorMessage = "Display name is required.")]
    [StringLength(120, MinimumLength = 2, ErrorMessage = "Display name must be 2 to 120 characters.")]
    public required string DisplayName { get; init; }

    [Required(ErrorMessage = "Cell phone is required.")]
    [SaCellPhone]
    public required string CellPhone { get; init; }

    [Required(ErrorMessage = "Password is required.")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "Password must be at least 6 characters.")]
    public required string Password { get; init; }

    /// <summary>True iff the user ticked the Terms of Use box. POPIA / CPA
    /// require explicit consent — `[Range(true,true)]` fails validation when
    /// the box is unticked, so the caller doesn't need a custom rule.</summary>
    [Range(typeof(bool), "true", "true", ErrorMessage = "You must accept the Terms of Use.")]
    public required bool AcceptedTermsOfUse { get; init; }

    /// <summary>True iff the user ticked the Privacy Policy box.</summary>
    [Range(typeof(bool), "true", "true", ErrorMessage = "You must accept the Privacy Policy.")]
    public required bool AcceptedPrivacyPolicy { get; init; }
}
