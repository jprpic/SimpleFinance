# Phase 1: Spendings Quick-Add & List Spec

## Objectives
1. Remove default Angular boilerplate component/template code.
2. Provide a single-page view listing all spendings with delete actions.
3. Provide a Quick-Add popup/dialog containing the spending entry form.
4. Persist and retrieve data locally using idb-keyval.

## Tech Stack & Conventions
- Framework: Angular 18+ (Standalone components, Signals, @if/@for control flow)
- State/Storage: idb-keyval (IndexedDB)
- Forms: Reactive Forms or Signal-based Forms
- Styling: Standard CSS/Tailwind (simple layout)

---

## 1. Data Models & Predefined Categories

Create src/app/models/spending.model.ts:

export interface Spending {
  id: string;
  amount: number;
  currency: string; // e.g., 'USD', 'EUR'
  category: Category;
  subcategory: string;
  createdAt: string; // ISO String
}

export enum Category {
  HOUSING = 'Housing',
  FOOD = 'Food & Groceries',
  TRANSPORT = 'Transportation',
  UTILITIES = 'Utilities',
  ENTERTAINMENT = 'Entertainment',
  HEALTH = 'Health & Personal Care',
  MISC = 'Miscellaneous'
}

export const SUBCATEGORIES_MAP: Record<Category, string[]> = {
  [Category.HOUSING]: ['Rent', 'Mortgage', 'Maintenance', 'Furnishings'],
  [Category.FOOD]: ['Groceries', 'Restaurants', 'Coffee', 'Delivery'],
  [Category.TRANSPORT]: ['Fuel', 'Public Transit', 'Taxi/Rideshare', 'Parking', 'Car Service'],
  [Category.UTILITIES]: ['Electricity', 'Water', 'Internet', 'Mobile Plan'],
  [Category.ENTERTAINMENT]: ['Subscriptions', 'Movies/Events', 'Hobbies', 'Gaming'],
  [Category.HEALTH]: ['Pharmacy', 'Doctor', 'Gym/Fitness', 'Insurance'],
  [Category.MISC]: ['General', 'Gifts', 'Services']
};

---

## 2. Storage Service (storage.service.ts)

- Primary Key in IndexedDB: 'spendings'
- Methods:
  - getSpendings(): Promise<Spending[]> — Retrieves all entries.
  - addSpending(item: Omit<Spending, 'id' | 'createdAt'>): Promise<Spending[]> — Generates id (using crypto.randomUUID()), attaches createdAt, saves updated array, returns full list.
  - deleteSpending(id: string): Promise<Spending[]> — Filters out target ID, updates storage, returns full list.

---

## 3. UI & Component Architecture

### Cleanup Existing Code
- Clear default HTML boilerplate from app.component.html.
- Remove default boilerplate tests or demo logic in app.component.ts.

### AppComponent / Main View Layout
- Header: Title + "Quick Add +" Button.
- Main Section: 
  - List of Spending cards/rows ordered by createdAt descending.
  - Display: Amount + Currency, Category, Subcategory, Date.
  - Action: "Delete" icon/button per row.
  - Empty state text when list is empty ("No spendings recorded yet.").
- Modal / Quick-Add Overlay:
  - Hidden by default; toggled by "Quick Add +" button or Backdrop click.
  - Inputs:
    - Amount (number input, min 0.01)
    - Currency (dropdown or text input with default preference, e.g., 'EUR' or 'USD')
    - Category (dropdown populated by Category enum)
    - Subcategory (dropdown dynamically populated based on selected Category)
  - Actions: Save (submits form, adds to storage, closes modal) and Cancel (closes modal).

---

## 4. Acceptance Criteria
1. Launching the app shows zero default Angular starter template content.
2. Clicking "Quick Add +" opens the form modal.
3. Selecting a Category filters available options in the Subcategory dropdown immediately.
4. Submitting valid form data adds the item to IndexedDB and renders it in the list immediately without page reload.
5. Clicking Delete on an item removes it permanently from IndexedDB and the UI.
6. Closing and reopening the browser/app retains all saved spendings.