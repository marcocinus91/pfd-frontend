import { Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { TransactionsStore } from '../../../store/transactions.store';

const CATEGORY_LABELS: Record<string, string> = {
  food: 'Cibo',
  transport: 'Trasporti',
  entertainment: 'Intrattenimento',
  health: 'Salute',
  shopping: 'Shopping',
  salary: 'Stipendio',
  other: 'Altro',
};

const CATEGORY_ICONS: Record<string, string> = {
  food: 'restaurant',
  transport: 'directions_car',
  entertainment: 'movie',
  health: 'medical_services',
  shopping: 'shopping_bag',
  salary: 'payments',
  other: 'category',
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, NgClass],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  store = inject(TransactionsStore);

  categoryLabels = CATEGORY_LABELS;
  categoryIcons = CATEGORY_ICONS;

  ngOnInit() {
    this.store.loadAll();
    this.store.loadSummary();
  }

  getCategoryColor(cat: string): string {
    const colors: Record<string, string> = {
      food: 'var(--cat-food)',
      transport: 'var(--cat-transport)',
      entertainment: 'var(--cat-entertainment)',
      health: 'var(--cat-health)',
      shopping: 'var(--cat-shopping)',
      salary: 'var(--cat-salary)',
      other: 'var(--cat-other)',
    };
    return colors[cat] || 'var(--cat-other)';
  }

  getMonthLabel(key: string): string {
    const [year, month] = key.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('it-IT', { month: 'short', year: 'numeric' });
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
}