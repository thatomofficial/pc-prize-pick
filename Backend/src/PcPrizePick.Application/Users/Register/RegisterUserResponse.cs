namespace PcPrizePick.Application.Users.Register;

public sealed record RegisterUserResponse(Guid UserId, string Email, string DisplayName);
