# Analytics & Category Charts Spec

## Objectives
1. Provide a dedicated, mobile-optimized Analytics tab/view.
2. Allow selecting and navigating to any past month or year.
3. Render a stacked vertical bar chart showing spending totals by Category.
4. Render a detailed breakdown list below the chart for the selected period.

## Tech Stack & Dependencies
- Chart Library: chart.js (installed via `npm i chart.js`)
- Wrapper: NONE (Use native `chart.js` instance bound to HTML5 canvas via ElementRef and Angular effect())
- State Management: Angular Signals for active view mode, selected date reference, and active slice selection

---

## 1. Data Transformation Helper

Create `src/app/utils/analytics.utils.ts`:

- Define high-contrast hex color mappings for each `Category` enum value.
- `getMonthlyChartData(spendings: Spending[], year: number)`:
  - Filters spendings for the given target year.
  - Groups spending by 12 months (Jan–Dec).
  - Returns a `ChartData` object formatted for Chart.js stacked bar chart.
- `getYearlyChartData(spendings: Spending[], startYear: number, endYear: number)`:
  - Groups spending across the year range.
  - Returns a `ChartData` object formatted for Chart.js stacked bar chart.
- `getCategoryBreakdown(spendings: Spending[], periodFilterFn: (s: Spending) => boolean)`:
  - Calculates total amount spent and percentage per category for the current filter.

---

## 2. Component Architecture (`AnalyticsComponent`)

### State & Controls
- `viewMode`: Signal<'MONTH' | 'YEAR'> (Default: 'MONTH')
- `selectedDate`: Signal<Date> (Default: current date)
- `selectedMonthIndex`: Signal<number | null> (Default: null — shows whole year, or specific month 0-11 when tapped)

### User Interface Layout
1. View Mode Segmented Controls: `[ Monthly ]` | `[ Yearly ]`
2. Date Navigator Header:
   - `< Prev` and `Next >` chevron buttons to increment/decrement `selectedDate` by year.
   - Date Label displaying active year (e.g., "2026").
   - `Next >` button disabled if selected year is current year.
3. Total Spending Card:
   - Displays aggregated total spent for the active period.
4. Chart View:
   - Single HTML5 `<canvas>` element wrapped in a fixed height container (`260px`).
   - Chart config: `type: 'bar'`, scales `x` and `y` both set to `stacked: true`.
   - Touch/Click event listener on chart bars to update `selectedMonthIndex`.
5. Category Summary List:
   - Sorted descending by amount.
   - Displays Color Indicator, Category Name, Total Amount, and Percentage (`XX%`).

---

## 3. Acceptance Criteria
1. Installing `chart.js` and adding `AnalyticsComponent` requires no third-party Angular chart wrappers.
2. Tapping `< Prev` shifts the chart to display the previous year's dataset instantly.
3. Tapping a specific month bar updates `selectedMonthIndex` and filters the summary list below to show numbers strictly for that month.
4. Chart resizes dynamically on window/viewport resize without horizontal screen overflow.