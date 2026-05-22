using System.Text.RegularExpressions;

namespace PcPrizePick.Domain.Users;

public class User
{
    // SA mobile numbers: leading 0 followed by 6, 7 or 8, then 8 more digits.
    // International form swaps the leading 0 for +27.
    private static readonly Regex CellPhoneRegex =
        new(@"^\+27[6-8]\d{8}$", RegexOptions.Compiled);

    private static readonly Regex EmailRegex =
        new(@"^[^\s@]+@[^\s@]+\.[^\s@]+$", RegexOptions.Compiled);

    public Guid Id { get; private set; }
    public required string Email { get; set; }
    public required string DisplayName { get; set; }
    public required string CellPhone { get; set; }
    public string? PasswordHash { get; set; }
    public bool IsEmailVerified { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? LastSignInAt { get; set; }

    public User()
    {
        Id = Guid.CreateVersion7();
    }

    /// <summary>
    /// Domain entry point for creating a new <see cref="User"/>. Validates and
    /// normalises every required field so persistence never sees invalid state.
    /// Throws <see cref="ArgumentException"/> on any invariant violation —
    /// callers (the Application layer) are expected to surface this as a
    /// validation failure response, not swallow it.
    /// </summary>
    public static User Create(
        string email,
        string displayName,
        string cellPhone,
        string? passwordHash = null)
    {
        var normalisedEmail = NormaliseEmail(email);
        var normalisedDisplay = (displayName ?? string.Empty).Trim();
        var normalisedPhone = NormaliseCellPhone(cellPhone);

        if (!IsValidEmail(normalisedEmail))
        {
            throw new ArgumentException("Email is not a valid address.", nameof(email));
        }

        if (normalisedDisplay.Length < 2 || normalisedDisplay.Length > 120)
        {
            throw new ArgumentException(
                "Display name must be 2 to 120 characters.",
                nameof(displayName));
        }

        if (!IsValidCellPhone(normalisedPhone))
        {
            throw new ArgumentException(
                "Cell phone must be a South African mobile number (0XX… or +27XX…).",
                nameof(cellPhone));
        }

        return new User
        {
            Email = normalisedEmail,
            DisplayName = normalisedDisplay,
            CellPhone = normalisedPhone,
            PasswordHash = passwordHash,
        };
    }

    public static string NormaliseEmail(string email) =>
        (email ?? string.Empty).Trim().ToLowerInvariant();

    /// <summary>
    /// Strips whitespace, hyphens and parens, then converts SA local
    /// (leading 0) to E.164-style +27. Returns the input unchanged when the
    /// shape can't be normalised — validation will then reject it.
    /// </summary>
    public static string NormaliseCellPhone(string cellPhone)
    {
        if (string.IsNullOrWhiteSpace(cellPhone)) return string.Empty;
        var clean = new string(cellPhone.Where(c => !char.IsWhiteSpace(c) && c != '-' && c != '(' && c != ')').ToArray());
        if (clean.StartsWith('0') && clean.Length == 10)
        {
            return "+27" + clean[1..];
        }
        return clean;
    }

    public static bool IsValidEmail(string email) =>
        !string.IsNullOrWhiteSpace(email) && EmailRegex.IsMatch(email);

    public static bool IsValidCellPhone(string normalisedCellPhone) =>
        !string.IsNullOrWhiteSpace(normalisedCellPhone)
        && CellPhoneRegex.IsMatch(normalisedCellPhone);
}
