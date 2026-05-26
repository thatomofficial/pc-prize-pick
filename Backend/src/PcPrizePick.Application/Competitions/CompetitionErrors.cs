using PcPrizePick.SharedKernel;

namespace PcPrizePick.Application.Competitions;

public static class CompetitionErrors
{
    public static Error NotFound(string slug) => Error.NotFound(
        "Competitions.NotFound",
        $"No competition was found with slug '{slug}'.");
}
