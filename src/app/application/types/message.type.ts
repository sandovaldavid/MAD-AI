export interface Message {
  success: boolean;
  message?: string;
  error?: string;
  [key: string]: unknown;
}

/**
 * Type guard to check if a value is a Message
 * @param value The value to check
 * @returns true if value is Message, false otherwise
 */
export function isMessage(value: unknown): value is Message {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    typeof (value as Message).success === 'boolean'
  );
}
