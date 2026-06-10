export const CATEGORY_LABELS: Record<string, string> = {
    food: 'Cibo',
    transport: 'Trasporti',
    entertainment: 'Intrattenimento',
    health: 'Salute',
    shopping: 'Shopping',
    salary: 'Stipendio',
    other: 'Altro',
};

export const CATEGORY_ICONS: Record<string, string> = {
    food: 'restaurant',
    transport: 'directions_car',
    entertainment: 'movie',
    health: 'medical_services',
    shopping: 'shopping_bag',
    salary: 'payments',
    other: 'category',
};

export const CATEGORY_COLORS: Record<string, string> = {
    food: 'var(--cat-food)',
    transport: 'var(--cat-transport)',
    entertainment: 'var(--cat-entertainment)',
    health: 'var(--cat-health)',
    shopping: 'var(--cat-shopping)',
    salary: 'var(--cat-salary)',
    other: 'var(--cat-other)',
};

export function getCategoryColor(category: string): string {
    return CATEGORY_COLORS[category] ?? CATEGORY_COLORS['other'];
}