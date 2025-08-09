# Implementacion del componente Detalle Recurso (detail-rm)

Para esta implementacion, tendremos en consideracion 3 endpoind (se detallan mas abajo). necesitamos que cuando
ingresemos mediante el id del recuso, para ver su detalle, debemos verificar si es un recurso material o humano para que
pueda mostrar los detalles especificos de cada uno.

Para hacer esa validacion de tipo de recurso de debe de llamar al endpoint de tipo de recuso:

## GET - /resource_management/resource-types/

### Respuesta:

#### Ejemplo de respuesta:

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

para esto tipos de recuros, necesitamos guardar en cache la ifnroamcion para evitar haecr peticiones constantemenetes,
asi que quiero que crees una funcion que guarde estos datos en el cache, otro para obtener los datos, y otro para
eliminar los datos del cache.

## GET - /resource_management/resources/{id}/

Este endpoint proporciona los detalles comunes entre los dos tipos de recuros (material y humanos):

### Respuesta

#### Response Schema: application/json

```json
id
integer (Id)
name
required
string (Name) [
    1
    ..
    255
] characters
Name of the resource

description
string (Description)
Detailed description of the resource

location
string (Location) <= 255 characters
Physical or logical location of the resource

availability_status
string (Availability status)
Enum: "available" "assigned" "maintenance" "unavailable"
Current availability status

status_display
string (Status display) non-empty
workload_percentage
number (Workload percentage) [0 .. 100]
Current workload as percentage (0-100)

is_active
boolean (Is active)
Whether this resource is currently active

acquisition_date
string or null <date> (Acquisition date)
Date when the resource was acquired

created_at
string <date-time> (Created at)
updated_at
string <date-time> (Updated at)
resource_type
required
integer (Resource type)
Type of this resource

resource_type_name
string (Resource type name) non-empty
resource_category
string (Resource category) non-empty
resource_type_detail
object (ResourceTypeList)
is_available
boolean (Is available)
remaining_capacity
number (Remaining capacity)
days_since_acquisition
integer or null (Days since acquisition)
human_resource
string (Human resource)
material_resource
string (Material resource)
active_absences_count
integer (Active absences count)
recent_absences
string (Recent absences)
```

#### Ejemplo de respuesta

```json
{
    "id": 0,
    "name": "string",
    "description": "string",
    "location": "string",
    "availability_status": "available",
    "status_display": "string",
    "workload_percentage": 100,
    "is_active": true,
    "acquisition_date": "2019-08-24",
    "created_at": "2019-08-24T14:15:22Z",
    "updated_at": "2019-08-24T14:15:22Z",
    "resource_type": 0,
    "resource_type_name": "string",
    "resource_category": "string",
    "resource_type_detail": {
        "id": 0,
        "name": "string",
        "category": "human",
        "category_display": "string",
        "is_active": true,
        "resources_count": 0
    },
    "is_available": true,
    "remaining_capacity": 0,
    "days_since_acquisition": 0,
    "human_resource": "string",
    "material_resource": "string",
    "active_absences_count": 0,
    "recent_absences": "string"
}
```

## GET - /resource_management/material-resources/{resource}/

Este endpoint proporciona detalles especificos para los recursos materiales.

### Respuesta

#### Response Schema: application/json

```json
resource
integer (Resource)
resource_id
integer (Resource id)
resource_name
string (Resource name) non-empty
resource_status
string (Resource status) non-empty
resource_type_name
string (Resource type name) non-empty
is_consumable
boolean (Is consumable)
Indica si el recurso es consumible (requiere reposición) o permanente (reutilizable)

unit_cost
string or null <decimal> (Unit cost)
Cost per unit in local currency

unit_of_measure
string (Unit of measure)
Enum: "unit" "hour" "day" "sprint" "story_point" "task" "license" "user" "instance" "month" "service"
Unit of measurement

unit_of_measure_display
string (Unit of measure display) non-empty
quantity_available
string <decimal> (Quantity available)
Available quantity

minimum_stock
string <decimal> (Minimum stock)
Minimum stock level

supplier
string (Supplier) <= 255 characters
Primary supplier information

purchase_date
string or null <date> (Purchase date)
Date of last purchase

warranty_expiry
string or null <date> (Warranty expiry)
Warranty expiration date

serial_number
string (Serial number) <= 100 characters
Serial number if applicable

is_low_stock
boolean (Is low stock)
total_value
string <decimal> (Total value)
is_available
boolean (Is available)
stock_status
string (Stock status)
```

#### Ejemplo de respuesta

```json
{
    "resource": 0,
    "resource_id": 0,
    "resource_name": "string",
    "resource_status": "string",
    "resource_type_name": "string",
    "is_consumable": true,
    "unit_cost": "string",
    "unit_of_measure": "unit",
    "unit_of_measure_display": "string",
    "quantity_available": "string",
    "minimum_stock": "string",
    "supplier": "string",
    "purchase_date": "2019-08-24",
    "warranty_expiry": "2019-08-24",
    "serial_number": "string",
    "is_low_stock": true,
    "total_value": "string",
    "is_available": true,
    "stock_status": "string"
}
```

## GET - /resource_management/human-resources/{resource}/

### Respuesta

#### Response Schema: application/json

```json
resource
integer (Resource)
resource_id
integer (Resource id)
resource_name
string (Resource name) non-empty
resource_status
string (Resource status) non-empty
resource_workload
number (Resource workload)
role
string (Role)
Enum: "senior" "junior" "specialist" "consultant" "intern"
Role of the human resource

role_display
string (Role display) non-empty
position
required
string (Position) [1 .. 255] characters
Job position or role

skills
string (Skills)
List of skills and competencies

hourly_rate
string or null <decimal> (Hourly rate)
Hourly rate in local currency

employment_type
string (Employment type)
Enum: "full_time" "part_time" "contract" "freelance" "intern"
Type of employment

employment_type_display
string (Employment type display) non-empty
experience_years
integer or null (Experience years) [0 .. 50]
Years of relevant experience

certification_level
string (Certification level) <= 100 characters
Professional certifications or level

user
integer or null (User)
Associated user account

user_email
string (User email) non-empty
user_full_name
string (User full name)
is_available
boolean (Is available)
monthly_cost
string or null <decimal> (Monthly cost)
```

#### Ejemplo de respuesta

```json
{
    "resource": 68,
    "resource_id": 68,
    "resource_name": "Sala de Servidores Secundaria",
    "resource_status": "maintenance",
    "resource_workload": 30,
    "role": "DEVELOPMENT",
    "role_display": "DEVELOPMENT",
    "position": "Diseñador UX/UI",
    "skills": "Figma, Adobe XD, Sketch, InVision, Prototipos interactivos, User Research, Usability Testing, Wireframing",
    "hourly_rate": "38.50",
    "employment_type": "PART_TIME",
    "employment_type_display": "PART_TIME",
    "experience_years": 5,
    "certification_level": "Certificación Nielsen Norman Group UX",
    "user": 11,
    "user_email": "carlos.rodriguez@example.com",
    "user_full_name": "Carlos Rodríguez",
    "is_available": false,
    "monthly_cost": 6160
}
```
