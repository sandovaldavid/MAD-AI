export type SelectSize = 'sm' | 'md' | 'lg';
export type SelectVariant = 'default' | 'error' | 'success';

export interface SelectOption {
    value: string | number;
    label: string;
    disabled?: boolean;
}
