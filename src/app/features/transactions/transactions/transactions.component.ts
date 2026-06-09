import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionsStore } from '../../../store/transactions.store';
import { Transaction } from '../../../core/services/transactions.service';

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
  selector: 'app-transactions',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, NgClass, FormsModule],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss'
})
export class TransactionsComponent {
  store = inject(TransactionsStore);

  categoryLabels = CATEGORY_LABELS;
  categoryIcons = CATEGORY_ICONS;

  filterCategory = signal<string>('');
  filterType = signal<string>('');
  filterMonth = signal<string>('');
  searchText = signal<string>('');

  showModal = signal(false);
  editingTransaction = signal<Transaction | null>(null);

  form = signal({
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: 'food',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  categories = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }));

  availableMonths = computed(() => {
    const months = new Set<string>();
    this.store.entities().forEach(t => {
      months.add(t.date.substring(0, 7));
    });
    return Array.from(months).sort().reverse();
  });

  filteredTransactions = computed(() => {
    return this.store.entities().filter(t => {
      if (this.filterCategory() && t.category !== this.filterCategory()) return false;
      if (this.filterType() && t.type !== this.filterType()) return false;
      if (this.filterMonth() && t.date.startsWith(this.filterMonth())) return false;
      if (this.searchText() && t.description.toLowerCase().includes(this.searchText().toLowerCase())) return false;
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  ngOnInit() {
    this.store.loadAll();
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
    return colors[cat] || 'var(--cat-other)'
  }

  getMonthLabel(key: string): string {
    const [year, month] =key.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  }

  openAddModal() {
    console.log('openAddModel chiamato')
    this.editingTransaction.set(null);
    this.form.set({
      amount: '',
      type: 'expense',
      category: 'food',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
    this.showModal.set(true);
    console.log('showModal dopo set:', this.showModal())
  }

  openEditModal(tx: Transaction) {
    this.editingTransaction.set(tx);
    this.form.set({
      amount: tx.amount.toString(),
      type: tx.type,
      category: tx.category,
      description: tx.description,
      date: tx.date,
    });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingTransaction.set(null);
  }

  saveTransaction() {
    const f = this.form();
    if (!f.amount || !f.description || !f.date) return;

    const dto = {
      amount: parseFloat(f.amount),
      type: f.type,
      category: f.category,
      description: f.description,
      date: f.date,
    };

    const editing = this.editingTransaction();
    if (editing) {
      this.store.updateTransaction({ id: editing.id, dto });
    } else {
      this.store.addTransaction(dto);
    }

    this.closeModal();
  }

  deleteTransaction(id: string) {
    if (confirm('Sei sicuro di voler eliminare questa transazione?')) {
      this.store.deleteTransaction(id);
    }
  }

  setType(type: 'income' | 'expense') {
    this.form.update(f => ({ ...f, type }));
  }

  updateForm(field: string, value: string) {
    this.form.update(f => ({ ...f, [field]: value }))
  }
}
