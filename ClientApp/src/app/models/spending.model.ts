export interface Spending {
    id: string;
    amount: number;
    category: Category;
    subcategory: string;
    date: string;
    createdAt: string;
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
        'Appliances & Electronics', // Dyson, TV, kitchen gear
        'Home Maintenance',
        'Furnishings & Decor'
    ],
    [Category.FOOD]: [
        'Groceries',
        'Restaurants & Dining Out',
        'Food Delivery'
    ],
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
        'Annual Seaside Vacation', // Track this specific big annual trip
        'Weekend Trips & Getaways',
        'Concerts & Events',
        'Wedding Planning' // High relevance at 27 with a fiancée!
    ],
    [Category.LIFESTYLE]: [
        'Personal Care', // Haircuts, grooming, pharmacy
        'Clothes & Shoes',
        'Hobbies & Tech',
        'Misc Personal'
    ],
    [Category.OBLIGATIONS]: [
        'Gifts (Fiancée)',
        'Gifts (Family & Friends)',
        'Celebrations & Weddings'
    ]
};