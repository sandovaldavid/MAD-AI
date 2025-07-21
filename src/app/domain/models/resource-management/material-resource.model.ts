export interface MaterialResource {
    id: string;
    name: string;
    quantity: number;
    status: 'available' | 'in-use' | 'maintenance';
}
