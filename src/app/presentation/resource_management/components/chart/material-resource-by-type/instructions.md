# Implementación del componente material-resources-stats

para obtener la inforamcion para el grafico, usa el siguiente endpoint: GET - /resource_management/material-resources/inventory-statistics/

y me da un respuesta como la siguiente:

```json
{
    "total_resources": 9,
    "consumable_resources": 1,
    "permanent_resources": 8,
    "low_stock_count": 7,
    "low_stock_percentage": 77.77777777777779,
    "total_inventory_value": 66500,
    "average_stock": 1.222222222222222,
    "maximum_stock": 2,
    "minimum_stock": 1,
    "total_quantity": 11
}
```

## Implementacion de la Grafica de Distribución de recursos material por tipo

Un doughnut chart para comparar consumibles vs permanentes.

```typescript
doughnutData = {
    labels: ['Consumibles', 'Permanentes'],
    datasets: [
        {
            data: [1, 8],
            backgroundColor: ['var(--color-warning-500)', 'var(--color-primary-500)'],
            borderColor: 'var(--color-white)',
            borderWidth: 2,
        },
    ],
};
```
