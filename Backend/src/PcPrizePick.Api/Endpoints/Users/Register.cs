using PcPrizePick.Api.Extensions;
using PcPrizePick.Api.Infrastructure;
using PcPrizePick.Application.Abstractions.Messaging;
using PcPrizePick.Application.Users.Register;
using PcPrizePick.SharedKernel;

namespace PcPrizePick.Api.Endpoints.Users;

internal sealed class Register : IEndpoint
{
    public sealed record Request(
        string Email,
        string DisplayName,
        string CellPhone,
        string Password,
        bool AcceptedTermsOfUse,
        bool AcceptedPrivacyPolicy);

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("api/users", async (
            Request request,
            ICommandHandler<RegisterUserCommand, RegisterUserResponse> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new RegisterUserCommand(
                request.Email,
                request.DisplayName,
                request.CellPhone,
                request.Password,
                request.AcceptedTermsOfUse,
                request.AcceptedPrivacyPolicy);

            Result<RegisterUserResponse> result = await handler.HandleAsync(command, cancellationToken);

            return result.Match(
                response => Results.Created($"/api/users/{response.UserId}", response),
                CustomResults.Problem);
        })
        .WithName("RegisterUser")
        .WithTags(Tags.Users);
    }
}
