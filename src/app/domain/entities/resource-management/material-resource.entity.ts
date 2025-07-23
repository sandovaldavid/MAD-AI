import { Resource } from './resource.entity';

export interface MaterialResource extends Resource {
  is_consumable: boolean;
  unit_cost: string | null;
  unit_of_measure: 'unit' | 'hour' | 'day' | 'sprint' | 'story_point' | 'task' | 'license' | 'user' | 'instance' | 'month' | 'service';
  unit_of_measure_display: string;
  quantity_available: string;
  minimum_stock: string;
  supplier: string;
  purchase_date: string | null;
  warranty_expiry: string | null;
  serial_number: string;
  is_low_stock: boolean;
  total_value: string;
  stock_status: string;
}
