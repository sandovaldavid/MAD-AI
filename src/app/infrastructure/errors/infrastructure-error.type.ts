export interface InfrastructureError {
  type: 'NETWORK' | 'HTTP' | 'API' | 'CONNECTIVITY';
  originalError?: any; // Error original para logging
  statusCode?: number; // Para errores HTTP
  endpoint?: string; // Qué endpoint falló
  message: string; // Mensaje técnico
  code: string; // Código específico de infra
  timestamp: Date;
  retryable: boolean; // Si se puede reintentar
  context?: Record<string, any>;
}
