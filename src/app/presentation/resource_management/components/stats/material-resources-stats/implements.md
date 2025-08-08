# Implementación del componente material-resources-stats

para obtener la inforamcion para eetos estts, usa el siguiente endpoint: GET - /resource_management/material-resources/inventory-statistics/

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

## Descripción de la implementación

para la implementacion de los stats, usaras los siguientes datos: total_resources, consumable_resources y permanent_resources. adicional a ello a cada stat agregale un indicador visual de tendencia o algo adicional que pueda incluir a los tres stats.

Usa FontsAwesome para los los iconos de los 3 stats, ademas no te olvides de implementar el modo oscuro y modo claro.
