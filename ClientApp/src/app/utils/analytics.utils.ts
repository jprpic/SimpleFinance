import type { ChartData, ChartDataset } from 'chart.js';

import { Category, Spending } from '../models/spending.model';

export type CategoryBreakdownItem = {
  category: Category;
  total: number;
  percentage: number;
};

export const CATEGORY_COLORS: Record<Category, string> = {
  [Category.HOUSING]: '#1f2937',
  [Category.FOOD]: '#f59e0b',
  [Category.CAR]: '#ef4444',
  [Category.UTILITIES]: '#10b981',
  [Category.LIFE_EVENTS]: '#8b5cf6',
  [Category.LIFESTYLE]: '#ec4899',
  [Category.OBLIGATIONS]: '#06b6d4',
};

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function getMonthlyChartData(
  spendings: Spending[],
  year: number,
): ChartData<'bar', number[], string> {
  const categories = Object.values(Category) as Category[];
  const datasets: ChartDataset<'bar', number[]>[] = categories.map((category) => ({
    label: category,
    data: Array.from({ length: 12 }, () => 0),
    backgroundColor: CATEGORY_COLORS[category],
    borderColor: CATEGORY_COLORS[category],
    borderWidth: 1,
    borderRadius: 4,
    stack: 'spending',
  }));

  spendings
    .filter((spending) => new Date(spending.createdAt).getFullYear() === year)
    .forEach((spending) => {
      const monthIndex = new Date(spending.createdAt).getMonth();
      const dataset = datasets.find((entry) => entry.label === spending.category);
      if (dataset) {
        dataset.data[monthIndex] += spending.amount;
      }
    });

  return {
    labels: MONTH_LABELS,
    datasets,
  };
}

export function getYearlyChartData(
  spendings: Spending[],
  startYear: number,
  endYear: number,
): ChartData<'bar', number[], string> {
  const fromYear = Math.min(startYear, endYear);
  const toYear = Math.max(startYear, endYear);
  const yearRange = Array.from({ length: toYear - fromYear + 1 }, (_, index) => fromYear + index);
  const categories = Object.values(Category) as Category[];

  const datasets: ChartDataset<'bar', number[]>[] = categories.map((category) => ({
    label: category,
    data: Array.from({ length: yearRange.length }, () => 0),
    backgroundColor: CATEGORY_COLORS[category],
    borderColor: CATEGORY_COLORS[category],
    borderWidth: 1,
    borderRadius: 4,
    stack: 'spending',
  }));

  spendings.forEach((spending) => {
    const year = new Date(spending.createdAt).getFullYear();
    const yearIndex = yearRange.indexOf(year);
    if (yearIndex === -1) {
      return;
    }

    const dataset = datasets.find((entry) => entry.label === spending.category);
    if (dataset) {
      dataset.data[yearIndex] += spending.amount;
    }
  });

  return {
    labels: yearRange.map((year) => String(year)),
    datasets,
  };
}

export function getCategoryBreakdown(
  spendings: Spending[],
  periodFilterFn: (spending: Spending) => boolean,
): CategoryBreakdownItem[] {
  const totalsByCategory = Object.values(Category).reduce<Record<Category, number>>((accumulator, category) => {
    accumulator[category] = 0;
    return accumulator;
  }, {} as Record<Category, number>);

  spendings
    .filter(periodFilterFn)
    .forEach((spending) => {
      totalsByCategory[spending.category] += spending.amount;
    });

  const totalSpent = Object.values(totalsByCategory).reduce((sum, amount) => sum + amount, 0);

  return (Object.values(Category) as Category[])
    .map((category) => ({
      category,
      total: totalsByCategory[category],
      percentage: totalSpent === 0 ? 0 : (totalsByCategory[category] / totalSpent) * 100,
    }))
    .filter((item) => item.total > 0)
    .sort((left, right) => right.total - left.total);
}
