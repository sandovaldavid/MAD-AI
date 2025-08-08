# ✅ Gráfico 1: Distribución por Rol

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

Tipo: Gráfico de barras horizontales (Horizontal Bar Chart)

Datos fuente que extraeremos de la respuesta de la api:

```json
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
}

```

Configuración recomendada: usa talwind con bg-_, test-_, etc.

Color principal: var(--color-primary-500)

Color de fondo de barra: var(--color-primary-100)

Ejes y labels: neutros (--color-neutral-700)

Tipo de gráfico: bar, con indexAxis: 'y' para que sea horizontal.

## detalles

implementa el modo oscuro y claro para la grafica y la ui
