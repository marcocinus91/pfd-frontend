import { Component, Input } from "@angular/core";
import { CurrencyPipe, NgClass } from "@angular/common";
import { Transaction } from "../../../core/services/transactions.service";
import { CATEGORY_LABELS, CATEGORY_ICONS, getCategoryColor } from "../../constants/categories";

@Component({
    selector: 'app-transaction-row',
    standalone: true,
    imports: [CurrencyPipe, NgClass],
    templateUrl: './transaction-row.component.html',
    styleUrl: './transaction-row.component.scss',
})
export class TransactionRowComponent {
    @Input({ required: true }) transaction!: Transaction;

    categoryLabels = CATEGORY_LABELS;
    categoryIcons = CATEGORY_ICONS;
    getCategoryColor = getCategoryColor;
}