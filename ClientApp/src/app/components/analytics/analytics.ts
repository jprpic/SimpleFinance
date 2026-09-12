import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Chart, type ChartConfiguration } from 'chart.js';

import { Spending } from '../../models/spending.model';
import { StorageService } from '../../services/storage.service';
import {
  CATEGORY_COLORS,
  getCategoryBreakdown,
  getMonthlyChartData,
  getYearlyChartData,
} from '../../utils/analytics.utils';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.html',
  styleUrl: './analytics.css',
})
export class AnalyticsComponent implements AfterViewInit, OnDestroy, OnInit {
  private readonly storage = inject(StorageService);

  protected readonly spendings = signal<Spending[]>([]);
  protected readonly viewMode = signal<'MONTH' | 'YEAR'>('MONTH');
  protected readonly selectedDate = signal(new Date());
  protected readonly selectedMonthIndex = signal<number | null>(null);
  protected readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('chartCanvas');

  protected readonly activeYear = computed(() => this.selectedDate().getFullYear());
  protected readonly canGoNextYear = computed(() => this.activeYear() < new Date().getFullYear());

  protected readonly totalSpent = computed(() => this.getPeriodSpendings().reduce((sum, spending) => sum + spending.amount, 0));
  protected readonly breakdown = computed(() =>
    getCategoryBreakdown(this.getPeriodSpendings(), () => true),
  );
  protected readonly chartData = computed(() => {
    if (this.viewMode() === 'YEAR') {
      const year = this.activeYear();
      return getYearlyChartData(this.spendings(), year, year);
    }

    return getMonthlyChartData(this.spendings(), this.activeYear());
  });

  private chart: Chart<'bar'> | null = null;
  private readonly resizeListener = () => this.chart?.resize();

  constructor() {
    effect(() => {
      this.renderChart();
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadSpendings();
  }

  ngAfterViewInit(): void {
    this.renderChart();
    window.addEventListener('resize', this.resizeListener);
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    window.removeEventListener('resize', this.resizeListener);
  }

  protected async loadSpendings(): Promise<void> {
    this.spendings.set(await this.storage.getSpendings());
  }

  protected setViewMode(mode: 'MONTH' | 'YEAR'): void {
    this.viewMode.set(mode);
    this.selectedMonthIndex.set(null);
    this.renderChart();
  }

  protected changeYear(offset: number): void {
    const nextDate = new Date(this.selectedDate());
    nextDate.setFullYear(nextDate.getFullYear() + offset);

    const maximumYear = new Date().getFullYear();
    if (nextDate.getFullYear() > maximumYear) {
      return;
    }

    this.selectedDate.set(nextDate);
    this.selectedMonthIndex.set(null);
    this.renderChart();
  }

  protected getPeriodSpendings(): Spending[] {
    const selectedYear = this.activeYear();

    return this.spendings().filter((spending) => {
      const spendingDate = new Date(spending.createdAt);
      if (spendingDate.getFullYear() !== selectedYear) {
        return false;
      }

      if (this.viewMode() === 'MONTH' && this.selectedMonthIndex() !== null) {
        return spendingDate.getMonth() === this.selectedMonthIndex();
      }

      return true;
    });
  }

  protected formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  protected getCategoryColor(category: string): string {
    return CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] ?? '#111827';
  }

  private renderChart(): void {
    const canvas = this.canvas();
    if (!canvas) {
      return;
    }

    if (this.chart) {
      this.chart.destroy();
    }

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: this.chartData(),
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { mode: 'nearest', axis: 'x', intersect: false },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: ${this.formatCurrency(Number(context.parsed.y ?? 0))}`,
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: {
              color: '#374151',
            },
          },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: {
              color: '#374151',
              callback: (value) => `€${value}`,
            },
          },
        },
        onClick: (_event, elements) => {
          if (this.viewMode() !== 'MONTH' || elements.length === 0) {
            return;
          }

          const selectedIndex = elements[0].index;
          this.selectedMonthIndex.set(this.selectedMonthIndex() === selectedIndex ? null : selectedIndex);
        },
      },
    };

    this.chart = new Chart(canvas.nativeElement, config);
  }
}
