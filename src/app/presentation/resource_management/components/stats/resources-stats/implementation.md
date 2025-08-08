# Endpoind: /resource_management/resources/stats/

## Descripcioón

Para poder obtener toda la informacion de los stats de recursos, se usa el endpoint antes mencionado, ademas de ello cuando se hace la peticion, obtenemos la siguiente respuesta:

```json
{
    "totales": {
        "total": 39,
        "activos": 37,
        "inactivos": 2,
        "asignados": 0,
        "disponibles": 21,
        "en_mantenimiento": 3,
        "no_disponibles": 0
    },
    "por_tipo": {},
    "estadisticas_generales": {
        "estadisticas_generales": {
            "total_recursos": 39,
            "recursos_activos": 37,
            "recursos_disponibles": 21,
            "recursos_asignados": 0,
            "carga_promedio": 64.5,
            "carga_maxima": 100,
            "carga_minima": 0
        },
        "total_recursos": 39
    }
}
```

Recuerda que estamos usando clean architecture, asi que debes de implementar las capas anteriores a la de presentacion para poder hacer una correcta implementacion, ademas de ello revisa si no existe codigo repetido para esta funcionalidad.

en este caso tomaremos los datos de "estadisticas_generales" y en especifico usaremos solo 4 de los datos que nos proporcionan:
"total_recursos", "recursos_activos", "recursos_disponibles" y "recursos_asignados", cada uno de estos items tendra su respectivo icono usando fontawesome v6 el plan gratuito.
