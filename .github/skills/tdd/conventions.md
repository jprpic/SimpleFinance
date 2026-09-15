# Conventions

## Fixture

A **fixture** is a `sealed` test class that inherits from `SqliteTestBase`. The base class manages an in-memory SQLite connection and provides `CreateContext()` for the EF Core context.

```csharp
public sealed class MyServiceTests : SqliteTestBase
{
    [Fact]
    public async Task ExecuteAsync_WhenCondition_ExpectedBehavior()
    {
        var ct = TestContext.Current.CancellationToken;
        using var context = CreateContext();

        var service = new MyService(context, new SuccessClient(), NullLogger<MyService>.Instance);

        var result = await service.ExecuteAsync(CreateRequest(), ct);

        result.Status.ShouldBe(ExpectedStatus);
    }
}
```

Always use a **fresh context for assertions** — never the same instance used in arrange — so EF's change tracker doesn't mask what was truly persisted. See [backend-tests.md](backend-tests.md) for the leaky-context bad example.

## Persistence setup

Use the highest representative path capable of proving the claim, in this order:

1. Use the authenticated HTTP or feature interface for application behavior.
2. Use EF Core `DbSet` operations and `SaveChangesAsync` for persistence behavior that is not economically observable through the feature interface. Construct entities through their existing supported factory or feature workflow, and assert the resulting `DbUpdateException` when the database rejects the write.
3. Use raw SQL only when the claim specifically concerns malformed data or database schema behavior that the higher paths cannot represent, such as inserting a `NULL` into a non-nullable property, inspecting provider metadata, or exercising provider-specific DDL. Keep that exception local and state the schema behavior in the test name.

Do not drop to a lower path merely to shorten setup or make an exception easier to assert. `internal` visibility is not a reason to use raw SQL or make a feature-local type public; the test assembly already has intentional access through `InternalsVisibleTo`.

## Quick Reference

| Concern      | Rule                                                                                          |
| ------------ | --------------------------------------------------------------------------------------------- |
| Cancellation | `TestContext.Current.CancellationToken` — never `default`                                     |
| Naming       | `Method_WhenCondition_ExpectedBehavior`                                                       |
| Assertions   | Shouldly: `.ShouldBe()`, `.ShouldNotBeNull()`, `.ShouldBeNull()`, `.ShouldNotBeNullOrEmpty()` |
| Logger       | `NullLogger<T>.Instance` for all `ILogger<T>` constructor parameters                          |
| Fakes        | Inner `sealed class`, named for state. See [fakes.md](fakes.md)                               |
