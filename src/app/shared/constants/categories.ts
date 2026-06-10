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

export const CATEGORY_COLORS_HEX: Record<string, string> = {
    food: '#ef6c00',
    transport: '#1e88e5',
    entertainment: '#8e24aa',
    health: '#00897b',
    shopping: '#d81b60',
    salary: '#43a047',
    other: '#6d6f76',
}

export function getCategoryColor(category: string): string {
    return CATEGORY_COLORS[category] ?? CATEGORY_COLORS['other'];
}