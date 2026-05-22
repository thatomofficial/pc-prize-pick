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
    [RegularExpression(
        @"^(?:\+27|0)[6-8]\d{8}$",
        ErrorMessage = "Enter a valid SA mobile number (0XX… or +27XX…).")]
    public required string CellPhone { get; init; }

    [Required(ErrorMessage = "Password is required.")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "Password must be at least 6 characters.")]
    public required string Password { get; init; }
}
