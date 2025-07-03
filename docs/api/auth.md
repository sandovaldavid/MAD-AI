Tengo los siguientes endpoints para la auth, y quiero que me ayudes a definir bien mis capas de dominio, core, aplication, infraestructure y presentación.

```json

```

## /confirm-email/ (POST)

Request Body schema: application/json
token
required
string (Token) non-empty
Email confirmation token

### Request

```json
{
    "identifier": "Username or email address",
    "password": "string",
    "remember_me": false
}
```

### Response

```json
{
    "access_token": "string",
    "refresh_token": "string",
    "token_type": "Bearer",
    "expires_in": 0,
    "user": {
        "property1": "string",
        "property2": "string"
    }
}
```

## /login/ (POST)

Request Body schema: application/json
identifier
required
string (Identifier) non-empty
Username or email address

password
required
string (Password) non-empty
User password

remember_me
boolean (Remember me)
Default: false
Keep user logged in for extended period

### Request

```json
{
    "identifier": "string",
    "password": "string",
    "remember_me": false
}
```

### Response

access_token
string (Access token) non-empty
JWT access token

refresh_token
string (Refresh token) non-empty
JWT refresh token

token_type
string (Token type) non-empty
Default: "Bearer"
Token type

expires_in
integer (Expires in)
Token expiration time in seconds

user
object (User)
User information

```json
{
    "access_token": "string",
    "refresh_token": "string",
    "token_type": "Bearer",
    "expires_in": 0,
    "user": {
        "property1": "string",
        "property2": "string"
    }
}
```

## /logout/ (POST)

Request Body schema: application/json
refresh_token
string (Refresh token) non-empty
Refresh token to revoke

### Request

{
"refresh_token": "string"
}

### Response

```json
    200 logged out successfully
```

## /me/ (GET)

### Response

```json
{
    "200 User profile information"
}
```

## /refresh-token/ (POST)

Request Body schema: application/json
refresh_token
required
string (Refresh token) non-empty
Valid refresh token

### Request

```json
{
    "refresh_token": "string"
}
```

### Response

Response Schema: application/json
access_token
string (Access token) non-empty
JWT access token

refresh_token
string (Refresh token) non-empty
JWT refresh token

token_type
string (Token type) non-empty
Default: "Bearer"
Token type

expires_in
integer (Expires in)
Token expiration time in seconds

user
object (User)
User information

```json
{
    "access_token": "string",
    "refresh_token": "string",
    "token_type": "Bearer",
    "expires_in": 0,
    "user": {
        "property1": "string",
        "property2": "string"
    }
}
```

## /register/ (POST)

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
Password must meet security requirements

password_confirm
required
string (Password confirm) non-empty
Must match the password field

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
Optional role ID (admin use only)

### Request

```json
{
    "username": "string",
    "email": "user@example.com",
    "password": "string",
    "password_confirm": "string",
    "first_name": "string",
    "last_name": "string",
    "role_id": 0
}
```

### Response

Response Schema: application/json
access_token
string (Access token) non-empty
JWT access token

refresh_token
string (Refresh token) non-empty
JWT refresh token

token_type
string (Token type) non-empty
Default: "Bearer"
Token type

expires_in
integer (Expires in)
Token expiration time in seconds

user
object (User)
User information

```json
{
    "access_token": "string",
    "refresh_token": "string",
    "token_type": "Bearer",
    "expires_in": 0,
    "user": {
        "property1": "string",
        "property2": "string"
    }
}
```

## /reset-password/ (POST)

email
required
string <email> (Email) non-empty
Email address of the account to reset

### Request

```json
{
    "email": "user@example.com"
}
```

### Response

```json
{
    "200 passoword reset email sent or invalid email"
}
```

## /reset-password/confirm/ (POST)

Request Body schema: application/json
token
required
string (Token) non-empty
Password reset token

new_password
required
string (New password) non-empty
New password

new_password_confirm
required
string (New password confirm) non-empty
Confirm new password

### Request

```json
{
    "token": "string",
    "new_password": "string",
    "new_password_confirm": "string"
}
```

### Response

```json
{
    "200 passoword reset successfully or 400 invalid token or password"
}
```
