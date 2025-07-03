# /users/ (GET)

List all users

Response Schema: application/json
Array
id
integer (Id)
User ID

username
string (Username) non-empty
Username

email
string <email> (Email) non-empty
Email address

first_name
string (First name) non-empty
First name

last_name
string (Last name) non-empty
Last name

is_active
boolean (Is active)
Account active status

role_name
string or null (Role name) non-empty
Role name

created_at
string <date-time> (Created at)
Account creation date

## Responses

```json
[
    {
        "id": 0,
        "username": "string",
        "email": "user@example.com",
        "first_name": "string",
        "last_name": "string",
        "is_active": true,
        "role_name": "string",
        "created_at": "2019-08-24T14:15:22Z"
    }
]
```

# /users/change-password/ (POST)

Request Body schema: application/json
current_password
required
string (Current password) non-empty
Current password

new_password
required
string (New password) non-empty
New password

new_password_confirm
required
string (New password confirm) non-empty
Confirm new password

## Request

```json
{
    "current_password": "string",
    "new_password": "string",
    "new_password_confirm": "string"
}
```

## Responses:

Responses
200 Password changed successfully
400 Bad request

# /users/create/ (POST)

Request Body schema: application/json
username
required
string (Username) [ 1 .. 150 ] characters
Unique username for the user

email
required
string <email> (Email) non-empty
Valid email address

password
required
string (Password) non-empty
Password for the user

first_name
required
string (First name) [ 1 .. 150 ] characters
User's first name

last_name
required
string (Last name) [ 1 .. 150 ] characters
User's last name

role_id
integer or null (Role id)
Role ID to assign to the user

## Request

```json
{
    "username": "string",
    "email": "user@example.com",
    "password": "string",
    "first_name": "string",
    "last_name": "string",
    "role_id": 0
}
```

## Response

Responses
201 User created successfully
Response Schema: application/json
id
integer (Id)
User ID

username
string (Username) non-empty
Username

email
string <email> (Email) non-empty
Email address

first_name
string (First name) non-empty
First name

last_name
string (Last name) non-empty
Last name

full_name
string (Full name) non-empty
Full name

status
string (Status) non-empty
User status

is_email_confirmed
boolean (Is email confirmed)
Email confirmation status

profile_completed
boolean (Profile completed)
Profile completion status

email_notifications_enabled
boolean (Email notifications enabled)
Email notifications enabled

system_notifications_enabled
boolean (System notifications enabled)
System notifications enabled

task_notifications_enabled
boolean (Task notifications enabled)
Task notifications enabled

is_active
boolean (Is active)
Account active status

created_at
string <date-time> (Created at)
Account creation date

updated_at
string <date-time> (Updated at)
Last update date

role_id
integer or null (Role id)
Role ID

role_name
string or null (Role name) non-empty
Role name

last_activity_at
string or null <date-time> (Last activity at)
Last activity date

400 Bad request
403 Forbidden

```json
{
    "id": 0,
    "username": "string",
    "email": "user@example.com",
    "first_name": "string",
    "last_name": "string",
    "full_name": "string",
    "status": "string",
    "is_email_confirmed": true,
    "profile_completed": true,
    "email_notifications_enabled": true,
    "system_notifications_enabled": true,
    "task_notifications_enabled": true,
    "is_active": true,
    "created_at": "2019-08-24T14:15:22Z",
    "updated_at": "2019-08-24T14:15:22Z",
    "role_id": 0,
    "role_name": "string",
    "last_activity_at": "2019-08-24T14:15:22Z"
}
```

# /users/{user_id}/ (GET)

path Parameters
user_id
required
string

## Response

Responses
200 User details
Response Schema: application/json
id
integer (Id)
User ID

username
string (Username) non-empty
Username

email
string <email> (Email) non-empty
Email address

first_name
string (First name) non-empty
First name

last_name
string (Last name) non-empty
Last name

full_name
string (Full name) non-empty
Full name

status
string (Status) non-empty
User status

is_email_confirmed
boolean (Is email confirmed)
Email confirmation status

profile_completed
boolean (Profile completed)
Profile completion status

email_notifications_enabled
boolean (Email notifications enabled)
Email notifications enabled

system_notifications_enabled
boolean (System notifications enabled)
System notifications enabled

task_notifications_enabled
boolean (Task notifications enabled)
Task notifications enabled

is_active
boolean (Is active)
Account active status

created_at
string <date-time> (Created at)
Account creation date

updated_at
string <date-time> (Updated at)
Last update date

role_id
integer or null (Role id)
Role ID

role_name
string or null (Role name) non-empty
Role name

last_activity_at
string or null <date-time> (Last activity at)
Last activity date

404 User not found

## Response Sample

```json
{
    "id": 0,
    "username": "string",
    "email": "user@example.com",
    "first_name": "string",
    "last_name": "string",
    "full_name": "string",
    "status": "string",
    "is_email_confirmed": true,
    "profile_completed": true,
    "email_notifications_enabled": true,
    "system_notifications_enabled": true,
    "task_notifications_enabled": true,
    "is_active": true,
    "created_at": "2019-08-24T14:15:22Z",
    "updated_at": "2019-08-24T14:15:22Z",
    "role_id": 0,
    "role_name": "string",
    "last_activity_at": "2019-08-24T14:15:22Z"
}
```

# /users/{user_id}/activate/ (PUT)

path Parameters
user_id
required
string

## Responses

200 User activated successfully
404 User not found

# /users/{user_id}/deactivate/ (DEL)

path Parameters
user_id
required
string
Request Body schema: application/json
reason
string (Reason)
Reason for deactivation

# Responses

200 User deactivated successfully
404 User not found

## Response Sample

```json
{
    "reason": "string"
}
```

# /users/{user_id}/update/ (PUT)

path Parameters
user_id
required
string
Request Body schema: application/json
first_name
string (First name) [ 1 .. 150 ] characters
User's first name

last_name
string (Last name) [ 1 .. 150 ] characters
User's last name

email
string <email> (Email) non-empty
User's email address

role_id
integer or null (Role id)
Role ID to assign (admin only)

status
string (Status) non-empty
User status

email_notifications_enabled
boolean (Email notifications enabled)
Enable email notifications

system_notifications_enabled
boolean (System notifications enabled)
Enable system notifications

task_notifications_enabled
boolean (Task notifications enabled)
Enable task notifications

## Request Sample

```json
{
    "first_name": "string",
    "last_name": "string",
    "email": "user@example.com",
    "role_id": 0,
    "status": "string",
    "email_notifications_enabled": true,
    "system_notifications_enabled": true,
    "task_notifications_enabled": true
}
```

## Responses

Responses
200 User updated successfully
Response Schema: application/json
id
integer (Id)
User ID

username
string (Username) non-empty
Username

email
string <email> (Email) non-empty
Email address

first_name
string (First name) non-empty
First name

last_name
string (Last name) non-empty
Last name

full_name
string (Full name) non-empty
Full name

status
string (Status) non-empty
User status

is_email_confirmed
boolean (Is email confirmed)
Email confirmation status

profile_completed
boolean (Profile completed)
Profile completion status

email_notifications_enabled
boolean (Email notifications enabled)
Email notifications enabled

system_notifications_enabled
boolean (System notifications enabled)
System notifications enabled

task_notifications_enabled
boolean (Task notifications enabled)
Task notifications enabled

is_active
boolean (Is active)
Account active status

created_at
string <date-time> (Created at)
Account creation date

updated_at
string <date-time> (Updated at)
Last update date

role_id
integer or null (Role id)
Role ID

role_name
string or null (Role name) non-empty
Role name

last_activity_at
string or null <date-time> (Last activity at)
Last activity date

400 Bad request
404 User not found

## Example Responses

```json
{
    "id": 0,
    "username": "string",
    "email": "user@example.com",
    "first_name": "string",
    "last_name": "string",
    "full_name": "string",
    "status": "string",
    "is_email_confirmed": true,
    "profile_completed": true,
    "email_notifications_enabled": true,
    "system_notifications_enabled": true,
    "task_notifications_enabled": true,
    "is_active": true,
    "created_at": "2019-08-24T14:15:22Z",
    "updated_at": "2019-08-24T14:15:22Z",
    "role_id": 0,
    "role_name": "string",
    "last_activity_at": "2019-08-24T14:15:22Z"
}
```
