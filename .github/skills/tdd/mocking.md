## Decision rule

Prefer behavior verification through user-visible outcomes. Use mocks only at external boundaries that are outside the component or feature's control.

## What can be mocked

Mock or stub:

- HTTP calls in service or component tests
- Router and navigation boundaries
- Browser APIs that are non-deterministic in tests (for example, `localStorage`, `IntersectionObserver`, time)

## What should not be mocked

Do not mock:

- Angular lifecycle behavior
- Template rendering behavior
- Internal methods of the component under test
- Child behavior that is part of the same user-visible flow (unless isolation is explicitly required)

Reason:

- Interaction-focused tests become implementation-coupled and brittle
- Refactors break tests even when behavior is unchanged

## Prefer user-level assertions

Assert outcomes users care about:

- Rendered text and UI states
- Enabled and disabled state of controls
- Output payloads emitted to parent
- Navigation result or visible error and success states

## Good example (outcome-focused)

```ts
it("shows error message when save fails", async () => {
  api.save.and.returnValue(throwError(() => new Error("network")));
  const user = userEvent.setup();

  await user.click(screen.getByRole("button", { name: /save/i }));

  expect(screen.getByText(/could not save/i)).toBeVisible();
});
```

## Bad example (interaction-focused)

```ts
it("calls internal methods in order", () => {
  spyOn(component as any, "validateForm");
  spyOn(component as any, "mapPayload");
  spyOn(component as any, "handleSuccess");

  component.onSave();

  expect((component as any).validateForm).toHaveBeenCalledBefore(
    (component as any).mapPayload,
  );
  expect((component as any).handleSuccess).toHaveBeenCalled();
});
```

## Quick checklist

Before adding a mock, ask:

1. Is this dependency outside our control?
2. Can I assert behavior through a public seam without this mock?
3. Will this test still pass after internal refactor with the same behavior?
4. Am I verifying outcomes instead of interaction details?

If answers indicate implementation coupling, remove the mock and reframe the test around observable behavior.
