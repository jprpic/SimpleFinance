## Core rule

Test what the user can observe through the template and public component API. Avoid testing internal implementation details.

## Good tests

Characteristics:

- Fresh state per test with `beforeEach`
- Inputs set through Angular input APIs
- Queries by role or accessible name
- Assertions on rendered UI and emitted payloads
- Minimal setup focused on behavior under test

## Test placement and tools

Frontend tests are split by scope. Place tests close to the feature they verify.

Shared frontend testing tools for this repository:

- Setup: use `TestBed` to configure the Angular testing environment
- Runner: use `vitest` to execute unit, component, and integration tests

### Unit tests

- Location: alongside the tested unit in the feature (for example, `*.spec.ts` next to a component, pipe, or service)

Use unit tests for isolated behavior in one component, service, pipe or helper.

### Component tests

- Location: alongside the component/page workflow in its feature folder

Use component tests as the primary frontend verification layer for user-facing behavior.
Prefer these for forms, dialogs, filters, data grids, route guards, and permission-based UI behavior.

### Integration tests

- Location: in the same feature folder as the composed workflow being tested

Use integration tests for interactions between multiple frontend units in one feature flow when the scenario is broader than a single component boundary.

### End-to-end tests

- Location: in the E2E test project/folder (outside unit/integration spec locations)
- Framework: use `playwright`

Use E2E tests for full user journeys running against the real application in a browser.
Write E2E tests only for critical business workflows.

## Common mistakes and better alternatives

### 1. Shared mutable state in `describe`

Bad pattern:

- Initializing component state once in `describe`
- Tests become order-dependent

Better:

- Create fresh component and fixture in `beforeEach`
- Keep each test isolated and deterministic

### 2. Incorrect input updates

Bad pattern:

- Assigning `component.input` directly after render

Better:

- Use `fixture.componentRef.setInput(...)` for input changes
- Run change detection after setting input

```ts
fixture.componentRef.setInput("user", user);
fixture.detectChanges();
```

Why:

- Triggers Angular lifecycle correctly
- Executes `ngOnChanges`
- Matches production binding behavior

### 3. Fragile CSS selectors

Bad pattern:

- Querying by class chains or `nth-child` selectors

Better:

- Prefer semantic queries such as role and label
- Use `data-testid` only when semantic queries are not practical

```ts
const saveButton = screen.getByRole("button", { name: /save/i });
```

### 4. Class-only tests

Bad pattern:

- Calling component methods and asserting only internal fields

Better:

- Trigger user interactions and assert visible result

```ts
await user.click(screen.getByRole("button", { name: /increment/i }));
expect(screen.getByText("Counter: 1")).toBeVisible();
```

### 5. False-positive output tests

Bad pattern:

- Spying only on `emit()` without checking payload

Better:

- Subscribe to output and assert emitted values

```ts
const emitted: User[] = [];

component.saved.subscribe((v) => emitted.push(v));
component.save();

expect(emitted).toEqual([expectedUser]);
```

## Query strategy

Use this order:

1. `getByRole` with accessible name
2. `getByLabelText` or `getByText` when appropriate
3. `data-testid` as a fallback
4. Avoid styling and DOM-structure selectors

## Test structure

Recommended shape:

1. Arrange minimal input and dependencies
2. Act through user interaction or public input API
3. Assert rendered output, user-visible side effects, and output payloads

## Definition of done

- Test fails before implementation and passes after
- No assertions on private methods or internals
- No fragile selectors tied to CSS layout
- Inputs and outputs tested with Angular-correct behavior
- User-visible behavior is the primary assertion
