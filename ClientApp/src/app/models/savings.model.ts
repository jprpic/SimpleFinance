export enum SavingsCategoryId {
    LOAN = 'loan',
    CAR = 'car',
    TRIPS = 'trips',
    WEDDING = 'wedding',
    CRNI_FOND = 'crni-fond',
}

export interface SavingsCategoryDefinition {
    id: SavingsCategoryId;
    name: string;
    targetPercentage: number;
    color: string;
}

export const SAVINGS_CATEGORY_DEFINITIONS: readonly SavingsCategoryDefinition[] = [
    { id: SavingsCategoryId.LOAN, name: 'Loan', targetPercentage: 20, color: '#2563eb' },
    { id: SavingsCategoryId.CAR, name: 'Car', targetPercentage: 15, color: '#0f766e' },
    { id: SavingsCategoryId.TRIPS, name: 'Trips', targetPercentage: 20, color: '#d97706' },
    { id: SavingsCategoryId.WEDDING, name: 'Wedding', targetPercentage: 25, color: '#be185d' },
    { id: SavingsCategoryId.CRNI_FOND, name: 'Crni Fond', targetPercentage: 20, color: '#7c3aed' },
];

export type SavingsAllocation = Record<SavingsCategoryId, number>;

export interface SavingsCategory {
    id: SavingsCategoryId;
    name: string;
    targetPercentage: number;
    balance: number;
    color?: string;
}

export type SavingsTransactionType = 'BULK_DEPOSIT' | 'TOP_UP' | 'TRANSFER' | 'WITHDRAWAL';

export interface SavingsTransaction {
    id: string;
    date: string;
    type: SavingsTransactionType;
    amount: number;
    fromCategoryId?: string;
    toCategoryId?: string;
    note?: string;
    categoryAmounts?: Partial<Record<SavingsCategoryId, number>>;
}
