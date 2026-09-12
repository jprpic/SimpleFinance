# Savings Envelopes & Allocation Spec

OBJECTIVES

Manage virtual savings envelopes (Loan, Car, Trips, Wedding, Crni Fond) with target allocation percentages.

Support monthly bulk deposits with automatic rule-based distribution.

Support direct single-envelope top-ups, envelope-to-envelope transfers, and direct withdrawals (Isolated Mode).

Persist all category balances and history logs locally using idb-keyval.

DATA MODELS (src/app/models/savings.model.ts)

SavingsCategory interface:

id: string

name: string

targetPercentage: number (e.g. 30 for 30%)

balance: number

color: string (Optional)

SavingsTransactionType: 'BULK_DEPOSIT' | 'TOP_UP' | 'TRANSFER' | 'WITHDRAWAL'

SavingsTransaction interface:

id: string

date: string (ISO format)

type: SavingsTransactionType

amount: number

fromCategoryId: string (Optional)

toCategoryId: string (Optional)

note: string (Optional)

SERVICE ARCHITECTURE (src/app/services/savings.service.ts)

Storage Keys: pwa_savings_categories and pwa_savings_transactions

State Management: Angular Signals

Signals Exposed:

categories = signal<SavingsCategory[]>([])

transactions = signal<SavingsTransaction[]>([])

totalSaved = computed(() => categories().reduce((sum, c) => sum + c.balance, 0))

Core Operations:

depositBulk(totalAmount: number): Calculates proportional amounts based on targetPercentage, updates balances, records single BULK_DEPOSIT transaction.

topUpCategory(categoryId: string, amount: number, note?: string): Increases target category balance and records TOP_UP transaction.

transferFunds(fromId: string, toId: string, amount: number, note?: string): Deducts from source, adds to target, records TRANSFER transaction.

withdrawFunds(categoryId: string, amount: number, note?: string): Deducts from target category balance and records WITHDRAWAL transaction (Isolated Mode).

SEED DATA DEFAULTS
If storage is empty on initial load, seed pwa_savings_categories with:

loan: Loan (Target: 20%, Balance: 0)

car: Car (Target: 15%, Balance: 0)

trips: Trips (Target: 20%, Balance: 0)

wedding: Wedding (Target: 25%, Balance: 0)

crni-fond: Crni Fond (Target: 20%, Balance: 0)

COMPONENT ARCHITECTURE (src/app/components/savings/savings.component.ts)

Mobile Layout Structure:

Total Savings Hero Card: Prominently displays totalSaved().

Global Action Bar:

[ + Bulk Deposit ] Button (Opens Bulk Deposit Drawer/Modal)

[ Transfer ] Button (Opens Transfer Drawer/Modal)

Savings Envelopes List: Cards for the 5 categories displaying Name, Percentage Tag, Current Balance, and Card Action Buttons:

[ + Top Up ]

[ - Spend ]

History Log Container: Simple vertical scrollable list displaying recent SavingsTransaction items ordered by date descending (Type badge, Amount, Date, Note).

ACCEPTANCE CRITERIA

Initializing app populates the 5 default categories (Loan, Car, Trips, Wedding, Crni Fond) summing to 100% allocation.

Executing a Bulk Deposit of 1,000 updates balances to: Loan 200, Car 150, Trips 200, Wedding 250, Crni Fond 200.

Transferring 100 from Wedding to Trips updates individual balances while keeping totalSaved unchanged.

Withdrawing 50 from Car updates Car balance and decreases totalSaved by 50 without creating a record in daily spendings.

All updates instantly persist to IndexedDB via idb-keyval.