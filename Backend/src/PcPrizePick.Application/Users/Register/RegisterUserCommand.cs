using PcPrizePick.Application.Abstractions.Messaging;

namespace PcPrizePick.Application.Users.Register;

public sealed record RegisterUserCommand(
    string Email,
    string DisplayName,
    string CellPhone,
    string Password,
    bool AcceptedTermsOfUse,
    bool AcceptedPrivacyPolicy) : ICommand<RegisterUserResponse>;
