import { Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { TransactionsStore } from '../../../store/transactions.store';
import { CATEGORY_ICONS, CATEGORY_LABELS, getCategoryColor } from '../../../shared/constants/categories';

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

  getCategoryColor = getCategoryColor

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