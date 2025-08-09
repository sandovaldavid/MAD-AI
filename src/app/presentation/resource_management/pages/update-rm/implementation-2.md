# Actualizar campos para Recurso

## Campo: de Tipo de recuros

Extrar el contenido de los tipos de recurso, con este endpoint: GET - /resource_management/resource-types/

## Modelo de la respuesta:

```typescript
[ResourceTypeList{
id	Idinteger
title: Id
readOnly: true
name*	Namestring
title: Name
maxLength: 100
minLength: 1
Name of the resource type

category	Categorystring
title: Category
Category of the resource type

Enum:
Array [ 4 ]
category_display	Category displaystring
title: Category display
readOnly: true
minLength: 1
is_active	Is activeboolean
title: Is active
Whether this resource type is currently active

resources_count	Resources countinteger
title: Resources count
readOnly: true

}]
```

## Ejemplo de respuesta:

```json
{
    "count": 4,
    "next": null,
    "previous": null,
    "page_info": {
        "current_page": 1,
        "total_pages": 1,
        "page_size": 4,
        "active_types": 4,
        "category_distribution": {
            "HARDWARE": 1,
            "HUMANO": 1,
            "OTROS": 1,
            "SOFTWARE": 1
        },
        "total_resources_in_page": 38
    },
    "results": [
        {
            "id": 2,
            "name": "HARDWARE",
            "category": "HARDWARE",
            "category_display": "HARDWARE",
            "is_active": true,
            "resources_count": 14
        },
        {
            "id": 3,
            "name": "HUMANO",
            "category": "HUMANO",
            "category_display": "HUMANO",
            "is_active": true,
            "resources_count": 10
        },
        {
            "id": 4,
            "name": "OTROS",
            "category": "OTROS",
            "category_display": "OTROS",
            "is_active": true,
            "resources_count": 8
        },
        {
            "id": 1,
            "name": "SOFTWARE",
            "category": "SOFTWARE",
            "category_display": "SOFTWARE",
            "is_active": true,
            "resources_count": 6
        }
    ]
}
```


