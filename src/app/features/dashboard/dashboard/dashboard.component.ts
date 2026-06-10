import { Component, OnInit, computed, inject } from '@angular/core';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { TransactionsStore } from '../../../store/transactions.store';
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  CATEGORY_COLORS_HEX,
  getCategoryColor,
} from '../../../shared/constants/categories';
import {
  BarChartModule,
  PieChartModule,
  Color,
  ScaleType,
} from '@swimlane/ngx-charts';
import { ResponsiveService } from '../../../core/services/responsive.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, NgClass, BarChartModule, PieChartModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  store = inject(TransactionsStore);

  categoryLabels = CATEGORY_LABELS;
  categoryIcons = CATEGORY_ICONS;
  responsive = inject(ResponsiveService);
  isMobile = this.responsive.isMobile;

  ngOnInit() {
    this.store.loadAll();
    this.store.loadSummary();
  }

  getCategoryColor = getCategoryColor;

  getMonthLabel(key: string): string {
    const [year, month] = key.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('it-IT', {
      month: 'short',
      year: 'numeric',
    });
  }

  getByMonthEntries() {
    const byMonth = this.store.summary()?.byMonth;
    if (!byMonth) return [];
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-4);
  }

  getByCategoryEntries() {
    const byCategory = this.store.summary()?.byCategory;
    if (!byCategory) return [];
    return Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }

  getMaxMonthValue(): number {
    const entries = this.getByMonthEntries();
    if (!entries.length) return 1;
    return Math.max(...entries.flatMap(([, v]) => [v.income, v.expenses]));
  }

  getRecentTransactions() {
    return [...this.store.entities()]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }

  barColorScheme: Color = {
    name: 'incomeExpense',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#4caf50', '#f44336'],
  };

  monthlyChartData = computed(() => {
    return this.getByMonthEntries().map(([key, value]) => ({
      name: this.getMonthLabel(key),
      series: [
        { name: 'Entrate', value: value.income },
        { name: 'Uscite', value: value.expenses },
      ],
    }));
  });

  categoryChartData = computed(() => {
    return this.getByCategoryEntries().map(([key, value]) => ({
      name: this.categoryLabels[key],
      value,
    }));
  });

  categoryColors = computed(() => {
    return this.getByCategoryEntries().map(([key]) => ({
      name: this.categoryLabels[key],
      value: CATEGORY_COLORS_HEX[key] ?? CATEGORY_COLORS_HEX['other'],
    }));
  });

  currentMonthTransactions = computed(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    return this.store.entities().filter((tx) => {
      const d = new Date(tx.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  });

  currentMonthIncomeCount = computed(() => {
    return this.currentMonthTransactions().filter((tx) => tx.type === 'income')
      .length;
  });
}
