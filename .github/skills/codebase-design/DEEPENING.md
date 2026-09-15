# Deepening

How to deepen a cluster of shallow modules safely, given its dependencies. Assumes the vocabulary in [SKILL.md](SKILL.md) — **module**, **interface**, **seam**, **adapter**.

## Dependency categories

When assessing a candidate for deepening, classify its dependencies. The category determines how the deepened module is tested across its seam.

### 1. In-process

Pure computation, in-memory state, no I/O. Always deepenable — merge the modules and test through the new interface directly. No adapter needed.

### 2. Local-substitutable

Dependencies that have local test stand-ins. Deepenable if the stand-in exists. The deepened module is tested with the stand-in running in the test suite. The seam is internal; no port at the module's external interface.

Common stand-ins by layer:

| Dependency    | TypeScript / Angular    | C# / .NET                               |
| ------------- | ----------------------- | --------------------------------------- |
| Relational DB | PGLite                  | EF Core `UseInMemoryDatabase` or SQLite |
| Clock / time  | Injected `Clock` object | `TimeProvider` (abstract, .NET 8+)      |

> **Note:** HTTP clients and filesystems are rarely stand-in candidates in this codebase. External integrations (Middleware, SFTP) sit behind ports (`IEventsMiddlewareClient`, `ICodSettlementMiddlewareClient`, future `IPudoTableRepository`). Tests use in-memory fakes that implement the port — `HttpClient` and filesystem are internal details of the production adapter and are never directly tested. Mocking them would mean testing past the seam.

### 3. Remote but owned (Ports & Adapters)

Your own services across a network boundary (microservices, internal APIs). Define a **port** (interface) at the seam. The deep module owns the logic; the transport is injected as an **adapter**. Tests use an in-memory adapter. Production uses an HTTP/gRPC/queue adapter.

Recommendation shape: _"Define a port at the seam, implement an HTTP adapter for production and an in-memory adapter for testing, so the logic sits in one deep module even though it's deployed across a network."_

### 4. True external (Mock)

Third-party services (Stripe, Twilio, etc.) you don't control. The deepened module takes the external dependency as an injected port; tests provide a mock adapter.

## Seam discipline

- **One adapter means a hypothetical seam. Two adapters means a real one.** Don't introduce a port unless at least two adapters are justified (typically production + test). A single-adapter seam is just indirection.
- **Internal seams vs external seams.** A deep module can have internal seams (private to its implementation, used by its own tests) as well as the external seam at its interface. Don't expose internal seams through the interface just because tests use them.
- **`Shared/` kernel seam.** A module earns its place in `Shared/` only when it is called by two or more feature slices. Apply the deletion test: if you delete the module and only one feature's internals are affected, it belongs inside that feature — not in `Shared/`. Moving something to `Shared/` is a seam decision; it requires the same justification as any other seam.
- **Dependency direction within a slice.** When a feature slice has internal layers (`Domain/`, `Infrastructure/`), the dependency must flow inward: `Infrastructure/` depends on `Domain/`, never the reverse. An `Infrastructure/` class is an adapter at an internal seam; it implements an interface defined in `Domain/`. If `Domain/` code has to import from `Infrastructure/`, the seam is inside out.

## Testing strategy: replace, don't layer

- Old unit tests on shallow modules become waste once tests at the deepened module's interface exist — delete them.
- Write new tests at the deepened module's interface. The **interface is the test surface**.
- Tests assert on observable outcomes through the interface, not internal state.
- Tests should survive internal refactors — they describe behaviour, not implementation. If a test has to change when the implementation changes, it's testing past the interface.
