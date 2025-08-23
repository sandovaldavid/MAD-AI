# **Endpoints de Usuarios (Users)**

## **1. Listar Usuarios**
- **Endpoint:** `GET /auth/users/`
- **Descripción:** Obtiene una lista paginada de todos los usuarios del sistema
- **Parámetros:** Ninguno
- **Request:** No requiere body
- **Response:** 
  ```json
  [
    {
      "id": 1,
      "username": "string",
      "email": "email@example.com",
      "first_name": "string",
      "last_name": "string",
      "is_active": true,
      "role_name": "string",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
  ```

## **2. Crear Usuario (Admin Only)**
- **Endpoint:** `POST /auth/users/create/`
- **Descripción:** Crea un nuevo usuario en el sistema (solo administradores)
- **Parámetros:** Ninguno
- **Request:**
  ```json
  {
    "username": "string",
    "email": "email@example.com",
    "password": "string",
    "first_name": "string",
    "last_name": "string",
    "role_id": 1 // opcional
  }
  ```
- **Response:** `201 Created`
  ```json
  {
    "id": 1,
    "username": "string",
    "email": "email@example.com",
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
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "role_id": 1,
    "role_name": "string",
    "last_activity_at": "2024-01-01T00:00:00Z"
  }
  ```

## **3. Obtener Usuario por ID**
- **Endpoint:** `GET /auth/users/{user_id}/`
- **Descripción:** Obtiene los detalles de un usuario específico por su ID
- **Parámetros:** 
  - `user_id` (path): ID único del usuario
- **Request:** No requiere body
- **Response:** `200 OK`
  ```json
  {
    "id": 1,
    "username": "string",
    "email": "email@example.com",
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
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "role_id": 1,
    "role_name": "string",
    "last_activity_at": "2024-01-01T00:00:00Z"
  }
  ```

## **4. Actualizar Usuario**
- **Endpoint:** `PUT /auth/users/{user_id}/update/`
- **Descripción:** Actualiza la información de un usuario existente
- **Parámetros:**
  - `user_id` (path): ID único del usuario
- **Request:**
  ```json
  {
    "first_name": "string",
    "last_name": "string",
    "email": "email@example.com",
    "role_id": 1, // solo admin
    "status": "string",
    "email_notifications_enabled": true,
    "system_notifications_enabled": true,
    "task_notifications_enabled": true
  }
  ```
- **Response:** `200 OK` - Mismo formato que el response de obtener usuario

## **5. Activar Usuario**
- **Endpoint:** `PUT /auth/users/{user_id}/activate/`
- **Descripción:** Activa una cuenta de usuario desactivada
- **Parámetros:**
  - `user_id` (path): ID único del usuario
- **Request:** No requiere body
- **Response:** `200 OK` - "User activated successfully"

## **6. Desactivar Usuario**
- **Endpoint:** `DELETE /auth/users/{user_id}/deactivate/`
- **Descripción:** Desactiva una cuenta de usuario
- **Parámetros:**
  - `user_id` (path): ID único del usuario
- **Request:**
  ```json
  {
    "reason": "string" // opcional
  }
  ```
- **Response:** `200 OK` - "User deactivated successfully"

## **7. Cambiar Contraseña**
- **Endpoint:** `POST /auth/users/change-password/`
- **Descripción:** Permite a un usuario cambiar su contraseña actual
- **Parámetros:** Ninguno
- **Request:**
  ```json
  {
    "current_password": "string",
    "new_password": "string",
    "new_password_confirm": "string"
  }
  ```
- **Response:** `200 OK` - "Password changed successfully"

## **8. Obtener Perfil Actual**
- **Endpoint:** `GET /auth/me/`
- **Descripción:** Obtiene la información del perfil del usuario autenticado actualmente
- **Parámetros:** Ninguno
- **Request:** No requiere body
- **Response:** `200 OK` - Mismo formato que el response de obtener usuario

# **Códigos de Respuesta Comunes:**
- `200 OK`: Operación exitosa
- `201 Created`: Recurso creado exitosamente
- `204 No Content`: Operación exitosa sin contenido de respuesta
- `400 Bad Request`: Error de validación o solicitud incorrecta
- `401 Unauthorized`: Usuario no autenticado
- `403 Forbidden`: Usuario no autorizado para esta operación
- `404 Not Found`: Usuario no encontrado

# **Notas Importantes:**
1. Todos los endpoints requieren autenticación básica (`Basic Auth`)
2. Las operaciones de creación, actualización, activación y desactivación están restringidas a administradores
3. Los usuarios pueden cambiar su propia contraseña y consultar su propio perfil
4. El endpoint `/auth/me/` usa el token de autenticación para identificar al usuario actual