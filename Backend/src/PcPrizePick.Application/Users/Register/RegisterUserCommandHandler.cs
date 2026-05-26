using PcPrizePick.Application.Abstractions.Messaging;
using PcPrizePick.Domain.Users;
using PcPrizePick.SharedKernel;

namespace PcPrizePick.Application.Users.Register;

internal sealed class RegisterUserCommandHandler(IUsersRepository repository)
    : ICommandHandler<RegisterUserCommand, RegisterUserResponse>
{
    public async Task<Result<RegisterUserResponse>> HandleAsync(
        RegisterUserCommand command,
        CancellationToken cancellationToken)
    {
        string email = User.NormaliseEmail(command.Email);

        User? existing = await repository.GetByEmailAsync(email, cancellationToken);
        if (existing is not null)
        {
            return Result.Failure<RegisterUserResponse>(UserErrors.EmailAlreadyRegistered(email));
        }

        // The validator already enforced these invariants; User.Create is the
        // domain's source of truth and re-checks them. Password hashing arrives
        // with the real auth story (F2.x) — for now we persist no credential.
        User user = User.Create(
            command.Email,
            command.DisplayName,
            command.CellPhone,
            command.AcceptedTermsOfUse,
            command.AcceptedPrivacyPolicy,
            passwordHash: null);

        await repository.AddAsync(user, cancellationToken);

        return new RegisterUserResponse(user.Id, user.Email, user.DisplayName);
    }
}
