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
  category: Category;
  subcategory: string;
  createdAt: string; // ISO String
}

export enum Category {
  HOUSING = 'Housing & Home',
  FOOD = 'Food & Dining',
  CAR = 'Car',
  UTILITIES = 'Bills & Utilities',
  LIFE_EVENTS = 'Vacations & Trips',
  LIFESTYLE = 'Entertainment & Personal',
  OBLIGATIONS = 'Gifts & Shared'
}

export const SUBCATEGORIES_MAP: Record<Category, string[]> = {
  [Category.HOUSING]: [
    'Rent',
    'Appliances & Electronics',
    'Home Maintenance',
    'Furnishings & Decor'
  ],
  [Category.FOOD]: ['Groceries', 'Restaurants & Dining Out', 'Food Delivery'],
  [Category.CAR]: [
    'Fuel',
    'Car Maintenance & Repairs',
    'Parking & Tolls',
    'Car Insurance & Registration'
  ],
  [Category.UTILITIES]: [
    'Electricity',
    'Water & Heating',
    'Internet & Mobile Plans',
    'Subscriptions & Streaming'
  ],
  [Category.LIFE_EVENTS]: [
    'Annual Seaside Vacation',
    'Weekend Trips & Getaways',
    'Concerts & Events',
    'Wedding Planning'
  ],
  [Category.LIFESTYLE]: ['Personal Care', 'Clothes & Shoes', 'Hobbies & Tech', 'Misc Personal'],
  [Category.OBLIGATIONS]: ['Gifts (Fiancée)', 'Gifts (Family & Friends)', 'Celebrations & Weddings']
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
- Clear default HTML boilerplate from src/app/app.html.
- Remove default boilerplate tests or demo logic in src/app/app.ts.

### AppComponent / Main View Layout
- Root shell: Global header and router outlet only.
- Spending page: Title + "Quick Add +" Button.
- Main Section:
  - List of Spending cards/rows ordered by createdAt descending.
  - Display: Amount followed by the fixed `EUR` label, Category, Subcategory, Date.
  - Action: "Delete" icon/button per row.
  - Empty state text when list is empty ("No spendings recorded yet.").
- Modal / Quick-Add Overlay:
  - Hidden by default; toggled by "Quick Add +" button or Backdrop click.
  - Inputs:
    - Amount (number input, min 0.01)
    - Category (dropdown populated by Category enum)
    - Subcategory (dropdown dynamically populated based on selected Category)
  - Currency is not a form field or stored property. This personal app uses EUR exclusively, so the list renders `EUR` next to every amount.
  - Actions: Save (submits form, adds to storage, closes modal) and Cancel (closes modal).

---

## 4. Acceptance Criteria
1. Launching the app shows zero default Angular starter template content.
2. Clicking "Quick Add +" opens the form modal.
3. Selecting a Category filters available options in the Subcategory dropdown immediately.
4. Submitting valid form data adds the item to IndexedDB and renders it in the list immediately without page reload.
5. Clicking Delete on an item removes it permanently from IndexedDB and the UI.
6. Closing and reopening the browser/app retains all saved spendings.