# ✅ Gráfico 2: Distribución por Tipo de Contrato

para obtener la inforamcion para estos stats, usa el siguiente endpoint: GET - /resource_management/human-resources/stats/

y me da un respuesta como la siguiente:

```json
{
    "total_human_resources": 14,
    "active_human_resources": 13,
    "available_human_resources": 8,
    "linked_to_users": 14,
    "not_linked_to_users": 0,
    "role_distribution": {
        "QUALITY": 1,
        "SECURITY": 1,
        "BUSINESS": 1,
        "MANAGEMENT": 2,
        "SUPPORT": 1,
        "DATA": 1,
        "OPERATIONS": 1,
        "TECHNICAL": 2,
        "DEVELOPMENT": 4
    },
    "employment_distribution": {
        "CONTRACTOR": 1,
        "REMOTE": 1,
        "FULL_TIME": 10,
        "PART_TIME": 2
    },
    "experience_statistics": {
        "average_years": 6.7,
        "max_years": 15,
        "min_years": 3
    },
    "rate_statistics": {
        "average_rate": 44.41,
        "max_rate": 85.5,
        "min_rate": 22.75
    },
    "high_workload_count": 5,
    "utilization_rate": 42.86,
    "insights": ["Más del 30% de recursos con alta carga de trabajo"],
    "recommendations": []
}
```

Tipo: Gráfico de dona (Doughnut Chart)

Datos fuente:

```json
"employment_distribution": {
  "CONTRACTOR": 1,
  "REMOTE": 1,
  "FULL_TIME": 10,
  "PART_TIME": 2
}
```

Configuración recomendada:

Colores sugeridos:

FULL_TIME: --color-successful-500

PART_TIME: --color-warning-500

REMOTE: --color-secondary-500

CONTRACTOR: --color-info-500

Bordes finos: borderWidth: 1, con color de borde blanco.

Tooltip y leyenda activados.

Cutout: 60% para estilo moderno.

## Descripción

implementa el modo oscuro y claro para la grafica y la ui
