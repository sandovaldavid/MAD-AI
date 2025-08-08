# Implementación del componente Filtro

Paa la implementacion de este componente filtro, este componente filtro funcionara con el componente resources-table, el cual usara el siguiente endpoint para mostrar las rows correspondientes a la busqueda, segun el filtro. El endpoint es el siguiente: POST - /resource_management/resources/search/
el cual debemos pasarle sos siguiente parametros por el body de la request:

```json
{
    "name": "string",
    "resource_type_id": 0,
    "category": "human",
    "availability_status": "available",
    "location": "string",
    "min_capacity": 100,
    "is_active": true
}
```

tipos de datos del request:

```json
ResourceSearch{
name	string
title: Name
minLength: 1
Buscar por nombre (búsqueda parcial)

resource_type_id	integer
title: Resource type id
Filtrar por tipo de recurso

category	string
title: Category
Filtrar por categoría

Enum:
Array [ 4 ]
availability_status	string
title: Availability status
Filtrar por estado de disponibilidad

Enum:
Array [ 4 ]
location	string
title: Location
minLength: 1
Buscar por ubicación (búsqueda parcial)

min_capacity	number
title: Min capacity
maximum: 100
minimum: 0
Capacidad mínima disponible requerida

is_active	boolean
title: Is active
default: true
Filtrar por estado activo


}
```

y eso me dara un resultado como el siguiente:

```json
{
    "results": [],
    "count": 0,
    "search_criteria": {
        "name": "string",
        "resource_type_id": 0,
        "category": "human",
        "availability_status": "available",
        "location": "string",
        "min_capacity": 100,
        "is_active": true
    }
}
```

en donde para que tengas mas contexto sobre que tipo de dato me devuelve de la respuesta, a continuacion te lo presento:

```json
ResourceList{
id	Idinteger
title: Id
readOnly: true

name*	Namestring
title: Name
maxLength: 255
minLength: 1
Name of the resource

resource_type*	Resource typeinteger
title: Resource type
Type of this resource

resource_type_name	Resource type namestring
title: Resource type name
readOnly: true
minLength: 1

resource_category	Resource categorystring
title: Resource category
readOnly: true
minLength: 1

location	Locationstring
title: Location
maxLength: 255
Physical or logical location of the resource

availability_status	Availability statusstring
title: Availability status
Current availability status
Enum:
Array [ 4 ] - > [ available, assigned, maintenance, unavailable ]

status_display	Status displaystring
title: Status display
readOnly: true
minLength: 1

workload_percentage	Workload percentagenumber
title: Workload percentage
maximum: 100
minimum: 0
Current workload as percentage (0-100)

is_active	Is activeboolean
title: Is active
Whether this resource is currently active

is_available	Is availableboolean
title: Is available
readOnly: true

remaining_capacity	Remaining capacitynumber
title: Remaining capacity
readOnly: true

}]
```

## Detalles de la implementación

Implementa el componente para el modo oscuro y claro, usa los colores que estan en colors.css, recueda que para usarlos se usan asi: bg-primary-500, etc.

Ademas de ello no te olvides de implementar el filtro en la tabla de recursos, el componente se llama resources-table
