export interface Message {
  success: boolean;
  message?: string;
  error?: string;
  [key: string]: any;
}
