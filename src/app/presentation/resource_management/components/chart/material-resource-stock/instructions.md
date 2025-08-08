# Implementación del componente material-resource-stock

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

## Detalles de la implementación

### Grafico: Indicadores de stock

Usamos un bar chart para mostrar:

-   Máximo stock

-   Mínimo stock

-   Stock promedio
