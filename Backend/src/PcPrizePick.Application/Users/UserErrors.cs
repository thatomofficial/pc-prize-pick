using PcPrizePick.SharedKernel;

namespace PcPrizePick.Application.Users;

public static class UserErrors
{
    public static Error EmailAlreadyRegistered(string email) => Error.Conflict(
        "Users.EmailAlreadyRegistered",
        $"An account already exists for '{email}'.");
}
