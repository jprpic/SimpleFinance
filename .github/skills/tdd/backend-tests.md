# Good and Bad Tests

## Good Tests

**Behavior-focused**: Test through public interfaces, not implementation details.

```csharp
// GOOD: Tests observable behavior
[Fact]
public async Task ExecuteAsync_WhenMiddlewareSucceeds_ReturnsSentStatus()
{
    var ct = TestContext.Current.CancellationToken;
    using var context = CreateContext();
    var service = new SendCodSettlementService(
        context,
        new SuccessMiddlewareClient(),
        NullLogger<SendCodSettlementService>.Instance
    );

    var response = await service.ExecuteAsync(CreateRequest(), ct);

    response.Status.ShouldBe(OutboxMessageStatuses.Sent);
}
```

Characteristics:

- Tests behavior callers care about
- Uses public API only
- Survives internal refactors
- Describes WHAT, not HOW
- One logical assertion per test

## Bad Tests

### Implementation-detail tests

Coupled to internal structure — the test breaks when you refactor without changing behavior.

```csharp
// BAD: Verifies a call was made instead of testing observable outcome
[Fact]
public async Task ExecuteAsync_WhenCalled_CallsMiddleware()
{
    var mock = new Mock<ICodSettlementMiddlewareClient>();
    mock.Setup(x => x.SendAsync(It.IsAny<CodSettlementPayload>(), It.IsAny<CancellationToken>()))
        .ReturnsAsync(new CodSettlementResult(true));
    var service = new SendCodSettlementService(context, mock.Object, NullLogger<SendCodSettlementService>.Instance);

    await service.ExecuteAsync(CreateRequest(), ct);

    // Tests HOW, not WHAT — breaks if the implementation changes internally
    mock.Verify(x => x.SendAsync(It.IsAny<CodSettlementPayload>(), It.IsAny<CancellationToken>()), Times.Once());
}
```

Red flags:

- Verifying calls on any collaborator (mocking frameworks)
- Testing private methods
- Asserting on call counts/order
- Test breaks when refactoring without behavior change
- Test name describes HOW not WHAT

### Leaky context assertions

Using the same EF `DbContext` instance to assert hides what was actually persisted — the change tracker serves cached data, not a real database read.

```csharp
// BAD: Change tracker masks true persistence
[Fact]
public async Task ExecuteAsync_WhenMiddlewareSucceeds_SavesOutboxMessage()
{
    using var context = CreateContext();
    var service = new SendCodSettlementService(context, new SuccessMiddlewareClient(), ...);

    await service.ExecuteAsync(CreateRequest(), ct);

    var message = context.OutboxMessages.Single(); // served from change tracker
    message.Status.ShouldBe(OutboxMessageStatuses.Sent);
}

// GOOD: Fresh context forces a real read from the database
[Fact]
public async Task ExecuteAsync_WhenMiddlewareSucceeds_PersistsOutboxMessageAsSent()
{
    using var context = CreateContext();
    var service = new SendCodSettlementService(context, new SuccessMiddlewareClient(), ...);

    await service.ExecuteAsync(CreateRequest(), ct);

    using var assertContext = CreateContext();
    var message = await assertContext.OutboxMessages.SingleAsync(ct);
    message.Status.ShouldBe(OutboxMessageStatuses.Sent);
}
```

### Tautological tests

Expected value restates the implementation, so the test passes by construction.

```csharp
// BAD: Expected value is derived the same way the implementation derives it
[Fact]
public async Task ExecuteAsync_SetsCorrectStatus()
{
    var middlewareResult = new CodSettlementResult(false, "error");
    var expected = middlewareResult.Success ? OutboxMessageStatuses.Sent : OutboxMessageStatuses.Failed;

    var response = await service.ExecuteAsync(CreateRequest(), ct);

    response.Status.ShouldBe(expected); // always passes — restates the logic
}

// GOOD: Expected value is a known, independent literal
[Fact]
public async Task ExecuteAsync_WhenMiddlewareFails_ReturnsFailedStatus()
{
    var response = await service.ExecuteAsync(CreateRequest(), ct);

    response.Status.ShouldBe(OutboxMessageStatuses.Failed);
}
```
