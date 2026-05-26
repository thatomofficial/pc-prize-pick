using System.Reflection;
using PcPrizePick.Api;
using PcPrizePick.Application.Abstractions.Messaging;
using PcPrizePick.Domain.Users;
using PcPrizePick.Infrastructure.Persistence;
using PcPrizePick.SharedKernel;

namespace PcPrizePick.ArchitectureTests;

public abstract class BaseTest
{
    protected static readonly Assembly DomainAssembly = typeof(User).Assembly;
    protected static readonly Assembly ApplicationAssembly = typeof(ICommand).Assembly;
    protected static readonly Assembly InfrastructureAssembly = typeof(AppDbContext).Assembly;
    protected static readonly Assembly PresentationAssembly = typeof(Program).Assembly;
    protected static readonly Assembly SharedKernelAssembly = typeof(Result).Assembly;
}
