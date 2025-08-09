# Implement update-rm component

This componente update data of resource, Resource Material and Human Resource. For this implementation, you need to use
this endpoint:

## For GET data do you need to use and review the nex file: [implement.md](/src/app/presentation/resource_management/pages/detail-rm/implement.md)

## For PUT data do you need to use the fallowing information:

### Update information about Resource

#### PUT - /resource_management/resources/{id}/

### Body Request

```json
{
    "name": "string",
    "description": "string",
    "resource_type": 0,
    "location": "string",
    "availability_status": "available",
    "workload_percentage": 100,
    "is_active": true,
    "acquisition_date": "2025-08-09"
}
```

### Response

#### Code 200

Resource{
id integer
title: Id
readOnly: true
name*    string
title: Name
maxLength: 255
minLength: 1
Name of the resource

description string
title: Description
Detailed description of the resource

location string
title: Location
maxLength: 255
Physical or logical location of the resource

availability_status string
title: Availability status
Current availability status

Enum:
Array [ 4 ]
status_display string
title: Status display
readOnly: true
minLength: 1
workload_percentage number
title: Workload percentage
maximum: 100
minimum: 0
Current workload as percentage (0-100)

is_active boolean
title: Is active
Whether this resource is currently active

acquisition_date string($date)
title: Acquisition date
x-nullable: true
Date when the resource was acquired

created_at string($date-time)
title: Created at
readOnly: true
updated_at	string($date-time)
title: Updated at
readOnly: true
resource_type*    integer
title: Resource type
Type of this resource

resource_type_name string
title: Resource type name
readOnly: true
minLength: 1
resource_category string
title: Resource category
readOnly: true
minLength: 1
resource_type_detail ResourceTypeList{
id Idinteger
title: Id
readOnly: true
name*    Namestring
title: Name
maxLength: 100
minLength: 1
Name of the resource type

category Categorystring
title: Category
Category of the resource type

Enum:
Array [ 4 ]
category_display Category displaystring
title: Category display
readOnly: true
minLength: 1
is_active Is activeboolean
title: Is active
Whether this resource type is currently active

resources_count Resources countinteger
title: Resources count
readOnly: true

}
is_available boolean
title: Is available
readOnly: true
remaining_capacity number
title: Remaining capacity
readOnly: true
days_since_acquisition integer
title: Days since acquisition
readOnly: true
x-nullable: true
human_resource string
title: Human resource
readOnly: true
material_resource string
title: Material resource
readOnly: true
active_absences_count integer
title: Active absences count
readOnly: true

}

#### Code 400 - Datos inválidos

#### Code 404 - Recurso no encontrado

### Update information about Human Resource

#### PUT - /resource_management/human-resources/{resource}/

### Body Request

```json
{
    "resource": 0,
    "user": 0,
    "position": "string",
    "role": "senior",
    "employment_type": "full_time",
    "experience_years": 50,
    "hourly_rate": "string",
    "skills": "string",
    "skills_data": {
        "primary_skills": [
            "string"
        ],
        "secondary_skills": [
            "string"
        ],
        "certifications": [
            "string"
        ]
    },
    "certification_level": "string"
}
```

### Response

#### Code 200

HumanResource{
resource integer
title: Resource
readOnly: true
resource_id integer
title: Resource id
readOnly: true
resource_name string
title: Resource name
readOnly: true
minLength: 1
resource_status string
title: Resource status
readOnly: true
minLength: 1
resource_workload number
title: Resource workload
readOnly: true
role string
title: Role
Role of the human resource

Enum:
Array [ 5 ]
role_display string
title: Role display
readOnly: true
minLength: 1
position*    string
title: Position
maxLength: 255
minLength: 1
Job position or role

skills string
title: Skills
List of skills and competencies

hourly_rate string($decimal)
title: Hourly rate
x-nullable: true
Hourly rate in local currency

employment_type string
title: Employment type
Type of employment

Enum:
Array [ 5 ]
employment_type_display string
title: Employment type display
readOnly: true
minLength: 1
experience_years integer
title: Experience years
maximum: 50
minimum: 0
x-nullable: true
Years of relevant experience

certification_level string
title: Certification level
maxLength: 100
Professional certifications or level

user integer
title: User
x-nullable: true
Associated user account

user_email string
title: User email
readOnly: true
minLength: 1
user_full_name string
title: User full name
readOnly: true
is_available boolean
title: Is available
readOnly: true
monthly_cost string($decimal)
title: Monthly cost
readOnly: true
x-nullable: true

}

#### code 400 - Error de validación

#### code 404 - Recurso humano no encontrado

### Update information about Resource Material

#### PUT - /resource_management/material-resources/{resource}/

### Body Request

```json
{
    "resource": 0,
    "is_consumable": true,
    "unit_cost": "string",
    "unit_of_measure": "unit",
    "quantity_available": "string",
    "minimum_stock": "string",
    "supplier": "string",
    "purchase_date": "2025-08-09",
    "warranty_expiry": "2025-08-09",
    "serial_number": "string"
}
```

### Response

#### Code 200

MaterialResource{
resource integer
title: Resource
readOnly: true
resource_id integer
title: Resource id
readOnly: true
resource_name string
title: Resource name
readOnly: true
minLength: 1
resource_status string
title: Resource status
readOnly: true
minLength: 1
resource_type_name string
title: Resource type name
readOnly: true
minLength: 1
is_consumable boolean
title: Is consumable
Indica si el recurso es consumible (requiere reposición) o permanente (reutilizable)

unit_cost string($decimal)
title: Unit cost
x-nullable: true
Cost per unit in local currency

unit_of_measure string
title: Unit of measure
Unit of measurement

Enum:
Array [ 11 ]
unit_of_measure_display string
title: Unit of measure display
readOnly: true
minLength: 1
quantity_available string($decimal)
title: Quantity available
Available quantity

minimum_stock string($decimal)
title: Minimum stock
Minimum stock level

supplier string
title: Supplier
maxLength: 255
Primary supplier information

purchase_date string($date)
title: Purchase date
x-nullable: true
Date of last purchase

warranty_expiry string($date)
title: Warranty expiry
x-nullable: true
Warranty expiration date

serial_number string
title: Serial number
maxLength: 100
Serial number if applicable

is_low_stock boolean
title: Is low stock
readOnly: true
total_value string($decimal)
title: Total value
readOnly: true
is_available boolean
title: Is available
readOnly: true
stock_status string
title: Stock status
readOnly: true

}

#### Code 400 - Error de validación

#### Code 404 - Recurso material no encontrado
