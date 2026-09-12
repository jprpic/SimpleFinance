import { Category, Spending } from '../models/spending.model';
import { getCategoryBreakdown, getMonthlyChartData, getYearlyChartData } from './analytics.utils';

describe('analytics.utils', () => {
  const spendings: Spending[] = [
    {
      id: '1',
      amount: 120,
      category: Category.FOOD,
      subcategory: 'Groceries',
      createdAt: '2024-01-15T10:00:00.000Z',
    },
    {
      id: '2',
      amount: 200,
      category: Category.HOUSING,
      subcategory: 'Rent',
      createdAt: '2024-02-02T10:00:00.000Z',
    },
    {
      id: '3',
      amount: 50,
      category: Category.FOOD,
      subcategory: 'Restaurants & Dining Out',
      createdAt: '2025-03-05T10:00:00.000Z',
    },
    {
      id: '4',
      amount: 75,
      category: Category.CAR,
      subcategory: 'Fuel',
      createdAt: '2025-12-20T10:00:00.000Z',
    },
  ];

  it('aggregates monthly totals for a year', () => {
    const data = getMonthlyChartData(spendings, 2024);

    expect(data.labels).toEqual([
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ]);
    expect(data.datasets).toHaveLength(Object.values(Category).length);
    expect(data.datasets[0].data).toEqual([0, 200, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(data.datasets[1].data).toEqual([120, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('aggregates yearly totals across the selected range', () => {
    const data = getYearlyChartData(spendings, 2024, 2025);

    expect(data.labels).toEqual(['2024', '2025']);
    expect(data.datasets).toHaveLength(Object.values(Category).length);
    expect(data.datasets[0].data).toEqual([200, 0]);
    expect(data.datasets[1].data).toEqual([120, 50]);
  });

  it('calculates category percentages for a filtered period', () => {
    const breakdown = getCategoryBreakdown(spendings, (spending) =>
      new Date(spending.createdAt).getFullYear() === 2024,
    );

    expect(breakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ category: Category.HOUSING, total: 200, percentage: 62.5 }),
        expect.objectContaining({ category: Category.FOOD, total: 120, percentage: 37.5 }),
      ]),
    );
    expect(breakdown.every((item) => item.percentage >= 0)).toBe(true);
  });
});
