Endpoints Roles

# /roles/ (GET)

Listar los roles:
id
integer (Id)
Role ID

name
string (Name) non-empty
Role name

description
string (Description) non-empty
Role description

access_level
integer (Access level)
Access level

is_active
boolean (Is active)
Role active status

user_count
integer (User count)
Number of users with this role

## Response

```json
[
    {
        "id": 0,
        "name": "string",
        "description": "string",
        "access_level": 0,
        "is_active": true,
        "user_count": 0
    }
]
```

# /roles/assign/ (POST)

Request Body schema: application/json
user_id
required
integer (User id)
ID of the user to assign role to

role_id
required
integer (Role id)
ID of the role to assign

assigned_by_user_id	
integer (Assigned by user id)
ID of the user performing the assignment

## Request

```json
{
    "user_id": 0,
    "role_id": 0,
    "assigned_by_user_id": 0
}
```

# /roles/create/ (POST)

name
required
string (Name) [ 1 .. 100 ] characters
Role name

description
required
string (Description) non-empty
Role description

access_level
required
integer (Access level) [ 1 .. 5 ]
Access level (1-5, where 1 is highest)

can_lead_projects
boolean (Can lead projects)
Default: false
Whether role holders can lead projects

is_unique_per_team
boolean (Is unique per team)
Default: false
Whether only one user per team can have this role

created_by_user_id
required
integer (Created by user id)
ID of the user creating the role

## Request

```json
{
    "name": "string",
    "description": "string",
    "access_level": 1,
    "can_lead_projects": false,
    "is_unique_per_team": false,
    "created_by_user_id": 0
}
```

## Responses

201 Role created successfully
Response Schema: application/json
id	
integer (Id)
Role ID

name	
string (Name) non-empty
Role name

description	
string (Description) non-empty
Role description

access_level	
integer (Access level)
Access level (1-5)

can_lead_projects	
boolean (Can lead projects)
Can lead projects

is_unique_per_team	
boolean (Is unique per team)
Unique per team

is_active	
boolean (Is active)
Role active status

created_at	
string <date-time> (Created at)
Role creation date

user_count	
integer (User count)
Number of users with this role

400 Bad request
403 Forbidden

```json
{
    "id": 0,
    "name": "string",
    "description": "string",
    "access_level": 0,
    "can_lead_projects": true,
    "is_unique_per_team": true,
    "is_active": true,
    "created_at": "2019-08-24T14:15:22Z",
    "user_count": 0
}
```

# /roles/unassign/ (POST)

user_id
required
integer (User id)
ID of the user to unassign role from

## Request

```json
{
    "user_id": 0
}
```

# /roles/{role_id}/ (GET)

id
integer (Id)
Role ID

name
string (Name) non-empty
Role name

description
string (Description) non-empty
Role description

access_level
integer (Access level)
Access level (1-5)

can_lead_projects
boolean (Can lead projects)
Can lead projects

is_unique_per_team
boolean (Is unique per team)
Unique per team

is_active
boolean (Is active)
Role active status

created_at
string <date-time> (Created at)
Role creation date

user_count
integer (User count)
Number of users with this role

## Response

```json
{
    "id": 0,
    "name": "string",
    "description": "string",
    "access_level": 0,
    "can_lead_projects": true,
    "is_unique_per_team": true,
    "is_active": true,
    "created_at": "2019-08-24T14:15:22Z",
    "user_count": 0
}
```

# /roles/{role_id}/delete/ (DELETE)

path Parameters
role_id
required
string

## Response

```json
Responses
200 Role deleted successfully
400 Cannot delete role with assigned users
404 Role not found
```

# /roles/{role_id}/update/ (PUT)

path Parameters
role_id
required
string
Request Body schema: application/json
name
string (Name) [ 1 .. 100 ] characters
Role name

description
string (Description) non-empty
Role description

access_level
integer (Access level) [ 1 .. 5 ]
Access level (1-5, where 1 is highest)

can_lead_projects
boolean (Can lead projects)
Whether role holders can lead projects

is_unique_per_team
boolean (Is unique per team)
Whether only one user per team can have this role

is_active
boolean (Is active)
Whether the role is active

## Request

```json
{
    "name": "string",
    "description": "string",
    "access_level": 1,
    "can_lead_projects": true,
    "is_unique_per_team": true,
    "is_active": true
}
```

## Response


id	
integer (Id)
Role ID

name	
string (Name) non-empty
Role name

description	
string (Description) non-empty
Role description

access_level	
integer (Access level)
Access level (1-5)

can_lead_projects	
boolean (Can lead projects)
Can lead projects

is_unique_per_team	
boolean (Is unique per team)
Unique per team

is_active	
boolean (Is active)
Role active status

created_at	
string <date-time> (Created at)
Role creation date

user_count	
integer (User count)
Number of users with this role

```json
{
    "id": 0,
    "name": "string",
    "description": "string",
    "access_level": 0,
    "can_lead_projects": true,
    "is_unique_per_team": true,
    "is_active": true,
    "created_at": "2019-08-24T14:15:22Z",
    "user_count": 0
}
```
