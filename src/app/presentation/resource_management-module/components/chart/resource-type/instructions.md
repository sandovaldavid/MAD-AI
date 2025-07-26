# Grafica de Recursos disponibles por tipo

Para obtener la información para esta grafica usa el siguiente endpoint: GET - /resource_management/resources/stats/. El cual me da una respuesta como la siguiente:

```json
{
    "totales": {
        "total": 39,
        "activos": 38,
        "inactivos": 1,
        "asignados": 0,
        "disponibles": 21,
        "en_mantenimiento": 3,
        "no_disponibles": 0
    },
    "por_tipo": {
        "SOFTWARE": {
            "tipo_id": 1,
            "total": 6,
            "activos": 6,
            "asignados": 0,
            "disponibles": 2
        },
        "HUMANO": {
            "tipo_id": 3,
            "total": 11,
            "activos": 10,
            "asignados": 0,
            "disponibles": 4
        },
        "HARDWARE": {
            "tipo_id": 2,
            "total": 14,
            "activos": 14,
            "asignados": 0,
            "disponibles": 10
        },
        "OTROS": {
            "tipo_id": 4,
            "total": 8,
            "activos": 8,
            "asignados": 0,
            "disponibles": 5
        }
    },
    "estadisticas_generales": {
        "estadisticas_generales": {
            "total_recursos": 39,
            "recursos_activos": 38,
            "recursos_disponibles": 21,
            "recursos_asignados": 0,
            "carga_promedio": 64.5,
            "carga_maxima": 100,
            "carga_minima": 0
        },
        "total_recursos": 39
    },
    "subutilizacion": {
        "total_subutilizados": 2,
        "recursos": [
            {
                "id": 64,
                "nombre": "Sala de Conferencias Principal",
                "carga_actual": 0
            },
            {
                "id": 72,
                "nombre": "Mantenimiento UPS",
                "carga_actual": 0
            }
        ]
    }
}
```

## Descripción del grafico

gráfico de barras horizontales para comparar cuántos recursos disponibles hay por cada tipo (SOFTWARE, HUMANO, HARDWARE, OTROS).
