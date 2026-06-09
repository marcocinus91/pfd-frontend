import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

export interface Transaction {
    id: string;
    amount: number;
    type: 'income' | 'expense';
    category: 'food' | 'transport' | 'entertainment' | 'health' | 'shopping' | 'salary' | 'other';
    description: string;
    date: string;
    userId: string;
}

export interface Summary {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    byCategory: Record<string, number>;
    byMonth: Record<string, { income: number; expenses: number }>;
}

export interface CreateTransactionDto {
    amount: number;
    type: 'income' | 'expense';
    category: string;
    description: string;
    date: string;
}

@Injectable({
    providedIn: 'root',
})
export class TransactionsService {
    private readonly API_URL = 'http://localhost:3000/transactions';

    constructor(private http: HttpClient) {}

    getAll(): Observable<Transaction[]> {
        return this.http.get<Transaction[]>(this.API_URL);
    }

    getSummary(): Observable<Summary> {
        return this.http.get<Summary>(`${this.API_URL}/summary`);
    }

    create(dto: CreateTransactionDto): Observable<Transaction> {
        return this.http.post<Transaction>(this.API_URL, dto);
    }

    update(id: string, dto: Partial<CreateTransactionDto>): Observable<Transaction> {
        return this.http.patch<Transaction>(`${this.API_URL}/${id}`, dto);
    }

    remove(id: string): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/${id}`);
    }
}