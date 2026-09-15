# When to Fake

Fake at **system boundaries** only:

- External HTTP/middleware clients
- External APIs (payment, notifications, etc.)
- Time (`TimeProvider`)
- File system, message queues

Do **not** fake:

- `AppDbContext` — use `SqliteTestBase` instead; a real in-memory database is always better than a fake one
- Services within the same feature slice — if you feel compelled to fake your own code, the seam is in the wrong place
- Anything you control

## How to Write Fakes

A fake is an inner `sealed class` that implements the interface directly. Never use a mocking framework (Moq, NSubstitute, FakeItEasy).

```csharp
private sealed class SuccessMiddlewareClient : ICodSettlementMiddlewareClient
{
    public Task<CodSettlementResult> SendAsync(CodSettlementPayload payload, CancellationToken ct)
        => Task.FromResult(new CodSettlementResult(true));
}

private sealed class FailureMiddlewareClient(string error) : ICodSettlementMiddlewareClient
{
    public Task<CodSettlementResult> SendAsync(CodSettlementPayload payload, CancellationToken ct)
        => Task.FromResult(new CodSettlementResult(false, error));
}
```

Name fakes for the state they represent: `SuccessClient`, `FailureClient`, `EmptyClient`. Keep them inside the test class — they are not reusable infrastructure.

## The Verification Rule

If you feel you need to verify that a method was called, you are testing HOW, not WHAT. Find the observable state instead.

In this codebase, there is always an observable artifact: an `OutboxMessage`, an `InboxMessage`, a persisted record, or a returned value. Assert on that.

```csharp
// WRONG question: "Was SendAsync called?"
// RIGHT question: "What is in the OutboxMessages table?"

using var assertContext = CreateContext();
var message = await assertContext.OutboxMessages.SingleAsync(ct);
message.Status.ShouldBe(OutboxMessageStatuses.Sent);
```

## Designing for Fakeability

In a vertical slice architecture, each interface wraps a single external operation. A fake for a one-method interface is trivial.

```csharp
// GOOD: One interface, one operation — trivially fakeable
public interface ICodSettlementMiddlewareClient
{
    Task<CodSettlementResult> SendAsync(CodSettlementPayload payload, CancellationToken ct);
}

// BAD: Generic HTTP wrapper — requires conditional logic in every fake
public interface IHttpClient
{
    Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct);
}
```

**A painful fake is a design signal.** If writing a fake requires implementing many methods or adding conditional logic, the interface is too broad. Narrow it.
