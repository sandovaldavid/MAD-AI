# Endpoints de Workflows y Operaciones Especializadas

Acciones específicas fuera del CRUD.

## Ausencias (Aprobación)
- POST `/api/v1/absences/{id}/approve/`
- POST `/api/v1/absences/{id}/reject/`

## Recursos Humanos
- POST `/api/v1/resource_management/human-resources/{resource}/hourly-rate/`
- POST `/api/v1/resource_management/human-resources/{resource}/link-user/`
- POST `/api/v1/resource_management/human-resources/{resource}/skills/`
- DELETE `/api/v1/resource_management/human-resources/{resource}/unlink-user/`

## Recursos Materiales (Stock)
- POST `/api/v1/resource_management/material-resources/{resource}/consume-stock/`
- POST `/api/v1/resource_management/material-resources/{resource}/replenish-stock/`
- POST `/api/v1/resource_management/material-resources/{resource}/update-stock/`

## Tipos de Recurso (Activación)
- POST `/api/v1/resource_management/resource-types/{id}/activate/`
- POST `/api/v1/resource_management/resource-types/{id}/deactivate/`
