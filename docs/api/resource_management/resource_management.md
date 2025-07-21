# Endpoints de Resource Manager

Los endpints comienzan en `/api/v1/resource_management/`

A continuacion mencionare los endpoints con su request y response.

## ViewSet para gestión completa de ausencias de recursos

### Descripción:

Proporciona endpoints para:

-   Operaciones CRUD estándar
-   Workflow de aprobación (aprobar, rechazar, pendientes)
-   Operaciones masivas (creación y aprobación)
-   Detección y reporte de conflictos
-   Reportes por período y estadísticas
-   Vista de calendario e integración
-   Consultas personalizadas (mis ausencias, equipo)
-   Todas las operaciones delegan la lógica de negocio al AbsenceService, manteniendo las vistas como adaptadores delgados.

### Endpoint: absences/

### Query Parameters

search
string
A search term.

ordering
string
Which field to use when ordering the results.

page
integer
A page number within the paginated result set.

page_size
integer
Number of results to return per page.

### Responses

#### 200 - Response Schema: application/json

count
required
integer

next
string or null <uri>

previous
string or null <uri>

results
required
Array of objects (ResourceAbsenceList)

## Crear nueva ausencia con validaciones de negocio.

### Descripción

Delega toda la lógica al servicio, manejando únicamente la transformación de datos HTTP y respuestas.

### Endpoint: absences/ - POST

### Request Body schema: application/json

resource
integer (Resource)
Resource that will be absent

resource_id
integer (Resource id)
absence_type
string (Absence type)
Enum: "vacation" "sick_leave" "training" "maintenance" "conference" "personal" "other"
Type of absence

start_date
required
string <date> (Start date)
Start date of the absence

end_date
required
string <date> (End date)
End date of the absence

reason
required
string (Reason) [ 1 .. 500 ] characters
Reason for the absence

notes
string (Notes)
Additional notes or comments

### Responses

#### 201 - Response Schema: application/json

resource
integer (Resource)
Resource that will be absent

resource_id
integer (Resource id)
absence_type
string (Absence type)
Enum: "vacation" "sick_leave" "training" "maintenance" "conference" "personal" "other"
Type of absence

start_date
required
string <date> (Start date)
Start date of the absence

end_date
required
string <date> (End date)
End date of the absence

reason
required
string (Reason) [ 1 .. 500 ] characters
Reason for the absence

notes
string (Notes)
Additional notes or comments

## Aprobar múltiples ausencias de manera masiva.

### Endpoint: absences/bulk-approve/ - POST

### Request Body schema: application/json

action
required
string (Action)
Enum: "create" "approve" "reject"

absence_ids
Array of integers[ items >= 1 ]
Lista de IDs de ausencias (para aprobar/rechazar)

absences_data
Array of objects
Lista de datos de ausencias (para crear)

comments
string (Comments) <= 500 characters

### Responses

#### 201 - Response Schema: application/json

action
required
string (Action)
Enum: "create" "approve" "reject"

absence_ids
Array of integers[ items >= 1 ]
Lista de IDs de ausencias (para aprobar/rechazar)

absences_data
Array of objects
Lista de datos de ausencias (para crear)

comments
string (Comments) <= 500 characters

## Crear múltiples ausencias de manera masiva.

### Endpoint: POST /api/v1/absences/bulk-create/

### Request Body schema: application/json

action
required
string (Action)
Enum: "create" "approve" "reject"

absence_ids
Array of integers[ items >= 1 ]
Lista de IDs de ausencias (para aprobar/rechazar)

absences_data
Array of objects
Lista de datos de ausencias (para crear)

comments
string (Comments) <= 500 characters

### Responses

#### 201 - Response Schema: application/json

action
required
string (Action)
Enum: "create" "approve" "reject"

absence_ids
Array of integers[ items >= 1 ]
Lista de IDs de ausencias (para aprobar/rechazar)

absences_data
Array of objects
Lista de datos de ausencias (para crear)

comments
string (Comments) <= 500 characters

## Obtener datos para vista de calendario.

### Endpoint: GET /api/v1/absences/calendar-view

### query Parameters

search
string
A search term.

ordering
string
Which field to use when ordering the results.

page
integer
A page number within the paginated result set.

page_size
integer
Number of results to return per page.

### Responses

#### 200 - Response Schema: application/json

count
required
integer

next
string or null <uri>

previous
string or null <uri>

results
required
Array of objects (ResourceAbsenceDetail)

## Generar reporte de conflictos en un período.

### Ednpoint: GET /api/v1/absences/conflict-report

### query Parameters

search
string
Término de búsqueda

ordering
string
Campo de ordenamiento

page
integer
Número de página

page_size
integer
Tamaño de página

start_date
string <date>
Fecha de inicio (YYYY-MM-DD)

end_date
string <date>
Fecha de fin (YYYY-MM-DD)

### Responses

#### 200 - Response Schema: application/json

count
required
integer

next
string or null <uri>

previous
string or null <uri>

results
required
Array of objects (ResourceAbsenceDetail)

## Obtener ausencias del usuario autenticado.

### Endpoint: GET /api/v1/absences/my-absences/

### query Parameters

search
string
A search term.

ordering
string
Which field to use when ordering the results.

page
integer
A page number within the paginated result set.

page_size
integer
Number of results to return per page.

### Responses

#### 200 - Response Schema: application/json

count
required
integer

next
string or null <uri>

previous
string or null <uri>

results
required
Array of objects (AbsenceMyAbsences)

## Obtener ausencias pendientes de aprobación.

### Endpoint: GET /api/v1/absences/pending-approval/

### query Parameters

search
string
A search term.

ordering
string
Which field to use when ordering the results.

page
integer
A page number within the paginated result set.

page_size
integer
Number of results to return per page.

### Responses

#### 200 - Response Schema: application/json

count
required
integer

next
string or null <uri>

previous
string or null <uri>

results
required
Array of objects (ResourceAbsenceDetail)

## Generar reporte de ausencias por período.

### Endpoint: GET /api/v1/absences/period-report/

### query Parameters

search
string
Término de búsqueda

ordering
string
Campo de ordenamiento

page
integer
Número de página

page_size
integer
Tamaño de página

start_date
required
string <date>
Fecha de inicio (YYYY-MM-DD)

end_date
required
string <date>
Fecha de fin (YYYY-MM-DD)

### Responses

#### 200 - Response Schema: application/json

count
required
integer

next
string or null <uri>

previous
string or null <uri>

results
required
Array of objects (AbsencePeriod)

## Obtener estadísticas generales de ausencias.

### Endpoint: GET /api/v1/absences/statistics/

### query Parameters

search
string
A search term.

ordering
string
Which field to use when ordering the results.

page
integer
A page number within the paginated result set.

page_size
integer
Number of results to return per page.

### Responses

#### 200 - Response Schema: application/json

count
required
integer

next
string or null <uri>

previous
string or null <uri>

results
required
Array of objects (AbsenceStats)

## Obtener ausencias del equipo (para managers).

### Endpoints: GET /api/v1/absences/team-absences/

### query Parameters

search
string
A search term.

ordering
string
Which field to use when ordering the results.

page
integer
A page number within the paginated result set.

page_size
integer
Number of results to return per page.

### Responses

#### 200 - Response Schema: application/json

count
required
integer

next
string or null <uri>

previous
string or null <uri>

results
required
Array of objects (AbsenceTeamAbsences)

## ViewSet para gestión completa de ausencias de recursos.

### Descripción

Proporciona endpoints para:

-   Operaciones CRUD estándar
-   Workflow de aprobación (aprobar, rechazar, pendientes)
-   Operaciones masivas (creación y aprobación)
-   Detección y reporte de conflictos
-   Reportes por período y estadísticas
-   Vista de calendario e integración
-   Consultas personalizadas (mis ausencias, equipo)
-   Todas las operaciones delegan la lógica de negocio al AbsenceService, manteniendo las vistas como adaptadores delgados.

### Endpoint: absences/{id}/ - GET

path Parameters

id
required
integer
A unique integer value identifying this Resource Absence.

### Responses

#### 200 - Response Schema: application/json

id
integer (Id)

resource
required
integer (Resource)
Resource that will be absent

resource_detail
object (Resource detail)
absence_type
string (Absence type)
Enum: "vacation" "sick_leave" "training" "maintenance" "conference" "personal" "other"
Type of absence

absence_type_display
string (Absence type display) non-empty
status
string (Status)
Enum: "planned" "approved" "in_progress" "completed" "cancelled"
Current status of the absence

status_display
string (Status display) non-empty
start_date
required
string <date> (Start date)
Start date of the absence

end_date
required
string <date> (End date)
End date of the absence

duration_days
string (Duration days)
reason
required
string (Reason) [ 1 .. 500 ] characters
Reason for the absence

notes
string (Notes)
Additional notes or comments

approved_by
integer or null (Approved by)
User who approved this absence

approved_by_detail
object (Approved by detail)
approval_date
string or null <date-time> (Approval date)
Date when the absence was approved

conflict_info
object (Conflict info)
created_at
string <date-time> (Created at)
updated_at
string <date-time> (Updated at)

## resource_management_absences_update

### Descripción

Actualizar ausencia existente.

### Endpoint: PUT /api/v1/absences/{id}/

### path Parameters

id
required
integer
A unique integer value identifying this Resource Absence.

### Request Body schema: application/json

resource
integer (Resource)
Resource that will be absent

resource_id
integer (Resource id)
absence_type
string (Absence type)
Enum: "vacation" "sick_leave" "training" "maintenance" "conference" "personal" "other"
Type of absence

start_date
required
string <date> (Start date)
Start date of the absence

end_date
required
string <date> (End date)
End date of the absence

reason
required
string (Reason) [ 1 .. 500 ] characters
Reason for the absence

notes
string (Notes)
Additional notes or comments

### Responses

#### 200 - Response Schema: application/json

resource
integer (Resource)
Resource that will be absent

resource_id
integer (Resource id)
absence_type
string (Absence type)
Enum: "vacation" "sick_leave" "training" "maintenance" "conference" "personal" "other"
Type of absence

start_date
required
string <date> (Start date)
Start date of the absence

end_date
required
string <date> (End date)
End date of the absence

reason
required
string (Reason) [ 1 .. 500 ] characters
Reason for the absence

notes
string (Notes)
Additional notes or comments

## ViewSet para gestión completa de ausencias de recursos.

### Descripción

Proporciona endpoints para:

-   Operaciones CRUD estándar
-   Workflow de aprobación (aprobar, rechazar, pendientes)
-   Operaciones masivas (creación y aprobación)
-   Detección y reporte de conflictos
-   Reportes por período y estadísticas
-   Vista de calendario e integración
-   Consultas personalizadas (mis ausencias, equipo)
-   Todas las operaciones delegan la lógica de negocio al AbsenceService, manteniendo las vistas como adaptadores delgados.

### path Parameters

id
required
integer
A unique integer value identifying this Resource Absence.

### Request Body schema: application/json

resource
integer (Resource)
Resource that will be absent

resource_id
integer (Resource id)
absence_type
string (Absence type)
Enum: "vacation" "sick_leave" "training" "maintenance" "conference" "personal" "other"
Type of absence

start_date
required
string <date> (Start date)
Start date of the absence

end_date
required
string <date> (End date)
End date of the absence

reason
required
string (Reason) [ 1 .. 500 ] characters
Reason for the absence

notes
string (Notes)
Additional notes or comments

### Responses

#### 200 - Response Schema: application/json

resource
integer (Resource)
Resource that will be absent

resource_id
integer (Resource id)
absence_type
string (Absence type)
Enum: "vacation" "sick_leave" "training" "maintenance" "conference" "personal" "other"
Type of absence

start_date
required
string <date> (Start date)
Start date of the absence

end_date
required
string <date> (End date)
End date of the absence

reason
required
string (Reason) [ 1 .. 500 ] characters
Reason for the absence

notes
string (Notes)
Additional notes or comments

## resource_management_absences_delete

### Descripción

Eliminar ausencia si es posible.

### Endpoint: DELETE /api/v1/absences/{id}/

### path Parameters

id
required
integer
A unique integer value identifying this Resource Absence.

### Responses

#### 204

## Aprobar una ausencia específica.

### Endpoint: POST /api/v1/absences/{id}/approve/

### path Parameters

id
required
integer
A unique integer value identifying this Resource Absence.

### Request Body schema: application/json

action
required
string (Action)
Enum: "approve" "reject"

comments
string (Comments) <= 500 characters
Comentarios sobre la decisión de aprobación/rechazo

### Responses

#### 201 - Response Schema: application/json

action
required
string (Action)
Enum: "approve" "reject"

comments
string (Comments) <= 500 characters
Comentarios sobre la decisión de aprobación/rechazo

## Rechazar una ausencia específica.

### Endpoint: POST /api/v1/absences/{id}/reject/

### path Parameters

id
required
integer
A unique integer value identifying this Resource Absence.

### Request Body schema: application/json

action
required
string (Action)
Enum: "approve" "reject"

comments
string (Comments) <= 500 characters
Comentarios sobre la decisión de aprobación/rechazo

### Responses

#### 201 - Response Schema: application/json

action
required
string (Action)
Enum: "approve" "reject"

comments
string (Comments) <= 500 characters
Comentarios sobre la decisión de aprobación/rechazo

## Generar análisis avanzado de disponibilidad.

### Descripción

Proporciona análisis detallado con métricas avanzadas, tendencias y patrones de utilización.

### Endpoints: GET /api/v1/absences/advanced-analysis/

### query Parameters

search
string
A search term.

ordering
string
Which field to use when ordering the results.

page
integer
A page number within the paginated result set.

page_size
integer
Number of results to return per page.

### Responses

#### 200 - Response Schema: application/json

count
required
integer

next
string or null <uri>

previous
string or null <uri>

results
required
Array of objects (AvailabilityAnalytics)

## Obtener slots de tiempo disponibles.

### Descripción

Proporciona lista de slots de tiempo disponibles para recursos según criterios específicos.

### Endpoint: api/v1/resource_management/availabilities/available-time-slots/

### query Parameters

search
string
A search term.

ordering
string
Which field to use when ordering the results.

page
integer
A page number within the paginated result set.

page_size
integer
Number of results to return per page.

start_date
required
string
Fecha de inicio (YYYY-MM-DD)

end_date
required
string
Fecha de fin (YYYY-MM-DD)

duration
required
integer
Duración en minutos

resource_type
string
Tipo de recurso

location
string
Ubicación

### Responses

#### 200 - Response Schema: application/json

count
required
integer

next
string or null <uri>

previous
string or null <uri>

results
required
Array of objects (AvailabilityTimeSlotQuery)

## Ejecutar operaciones masivas de disponibilidad.

### Descripción

Permite ejecutar múltiples operaciones de disponibilidad (reservar, liberar, actualizar) en una sola transacción.

### Endpoint: POST /api/v1/resource_management/availabilities/bulk-operations/

### Request Body schema: application/json

operaciones
required
Array of objects
Lista de operaciones a ejecutar

### Responses

#### 201 - Response Schema: application/json

operaciones
required
Array of objects
Lista de operaciones a ejecutar

## Obtener vista de calendario de disponibilidad.

### Descripción

Proporciona datos de disponibilidad formateados para mostrar en vista de calendario.

### Endpoint: GET /api/v1/resource_management/availabilities/calendar-view/

### query Parameters

search
string
A search term.

ordering
string
Which field to use when ordering the results.

page
integer
A page number within the paginated result set.

page_size
integer
Number of results to return per page.

### Responses

#### 200 - Response Schema: application/json

count
required
integer

next
string or null <uri>

previous
string or null <uri>

results
required
Array of objects (AvailabilityCalendar)

## Verificar disponibilidad de un recurso específico.

### Descripción

Permite verificar si un recurso está disponible en un período específico y con una capacidad requerida determinada.

### Endpoint: POST /api/v1/resource_management/availabilities/check-availability/

### Request Body schema: application/json

resource_id
required
integer (Resource id)
ID del recurso a verificar

fecha_inicio
required
string <date> (Fecha inicio)
Fecha de inicio del período

fecha_fin
required
string <date> (Fecha fin)
Fecha de fin del período

capacidad_requerida
number (Capacidad requerida) [ 0.01 .. 100 ]
Capacidad requerida en porcentaje

### Responses

#### 201 - Response Schema: application/json

resource_id
required
integer (Resource id)
ID del recurso a verificar

fecha_inicio
required
string <date> (Fecha inicio)
Fecha de inicio del período

fecha_fin
required
string <date> (Fecha fin)
Fecha de fin del período

capacidad_requerida
number (Capacidad requerida) [ 0.01 .. 100 ]
Capacidad requerida en porcentaje

## Detectar conflictos de disponibilidad.

### Descripción

Analiza conflictos de disponibilidad en un período específico y proporciona sugerencias de resolución.

### Endpoint: GET - /api/v1/resource_management/availabilities/detect-conflicts/

### query Parameters

search
string
Término de búsqueda

ordering
string
Campo para ordenar

page
integer
Número de página

page_size
integer
Tamaño de página

fecha_inicio
required
string
Fecha de inicio (YYYY-MM-DD)

fecha_fin
required
string
Fecha de fin (YYYY-MM-DD)

resource_ids
Array of integers
IDs de recursos (lista)

### Responses

#### 200 - Response Schema: application/json

count
required
integer
next
string or null <uri>
previous
string or null <uri>
results
required
Array of objects (AvailabilityQueryParams)

## Buscar recursos disponibles con criterios específicos.

### Descripción

Permite buscar recursos que cumplan con criterios específicos de disponibilidad, tipo, ubicación, habilidades, etc.

### Endpoint: POST /api/v1/resource_management/availabilities/find-available-resources

### Request Body schema: application/json

fecha_inicio
required
string <date> (Fecha inicio)

fecha_fin
required
string <date> (Fecha fin)

tipo_recurso
string (Tipo recurso) [ 1 .. 100 ] characters

capacidad_minima
number (Capacidad minima) [ 0 .. 100 ]

ubicacion
string (Ubicacion) [ 1 .. 255 ] characters

habilidades
Array of strings[ items [ 1 .. 100 ] characters ]

limit
integer (Limit) [ 1 .. 200 ]
Default: 50

### Responses

#### 201 - Response Schema: application/json

fecha_inicio
required
string <date> (Fecha inicio)
fecha_fin
required
string <date> (Fecha fin)
tipo_recurso
string (Tipo recurso) [ 1 .. 100 ] characters
capacidad_minima
number (Capacidad minima) [ 0 .. 100 ]
ubicacion
string (Ubicacion) [ 1 .. 255 ] characters
habilidades
Array of strings[ items [ 1 .. 100 ] characters ]
limit
integer (Limit) [ 1 .. 200 ]
Default: 50

## Generar pronóstico de disponibilidad.

### Descripción

Proporciona pronósticos de disponibilidad basados en patrones históricos y ausencias programadas.

### Endpoint: GET - /api/v1/resource_management/availabilities/forecast/

### query Parameters

search
string
A search term.

ordering
string
Which field to use when ordering the results.

page
integer
A page number within the paginated result set.

page_size
integer
Number of results to return per page.

### Responses

#### 200 -Response Schema: application/json

count
required
integer

next
string or null <uri>

previous
string or null <uri>

results
required
Array of objects (AvailabilityForecast)

## Liberar capacidad de un recurso.

### Descripción

Permite liberar capacidad previamente asignada de un recurso específico.

### Request Body schema: application/json

resource_id
required
integer (Resource id)
ID del recurso

capacidad_a_liberar
required
number (Capacidad a liberar) [ 0.01 .. 100 ]
Capacidad a liberar en porcentaje

motivo
string (Motivo) [ 1 .. 500 ] characters
Motivo de la liberación

### Responses

#### 201 - Response Schema: application/json

resource_id
required
integer (Resource id)
ID del recurso

capacidad_a_liberar
required
number (Capacidad a liberar) [ 0.01 .. 100 ]
Capacidad a liberar en porcentaje

motivo
string (Motivo) [ 1 .. 500 ] characters
Motivo de la liberación

## Reservar un slot de tiempo para un recurso.

### Descripción

Permite reservar capacidad específica de un recurso para un período determinado.

### Endpoint: POST - /api/v1/resource_management/availabilities/reserve-slot/

### Request Body schema: application/json

resource_id
required
integer (Resource id)
ID del recurso a reservar

fecha_inicio
required
string <date> (Fecha inicio)
Fecha de inicio de la reserva

fecha_fin
required
string <date> (Fecha fin)
Fecha de fin de la reserva

capacidad_requerida
required
number (Capacidad requerida) [ 0.01 .. 100 ]
Capacidad a reservar en porcentaje

motivo
string (Motivo) [ 1 .. 500 ] characters
Motivo de la reserva

### Responses

#### 201 - Response Schema: application/json

resource_id
required
integer (Resource id)
ID del recurso a reservar

fecha_inicio
required
string <date> (Fecha inicio)
Fecha de inicio de la reserva

fecha_fin
required
string <date> (Fecha fin)
Fecha de fin de la reserva

capacidad_requerida
required
number (Capacidad requerida) [ 0.01 .. 100 ]
Capacidad a reservar en porcentaje

motivo
string (Motivo) [ 1 .. 500 ] characters
Motivo de la reserva

## Generar reporte de utilización de recursos.

### Descripción

Proporciona análisis detallado de utilización de recursos con estadísticas, tendencias y recomendaciones.

### Endpoint: GET - /api/v1/resource_management/availabilities/utilization-report/

### query Parameters

search
string
A search term.

ordering
string
Which field to use when ordering the results.

page
integer
A page number within the paginated result set.

page_size
integer
Number of results to return per page.

### Responses

#### 200 - Response Schema: application/json

count
required
integer
next
string or null <uri>
previous
string or null <uri>
results
required
Array of objects (UtilizationReport)

## ViewSet para gestión de recursos humanos.

### Descripción

Proporciona operaciones CRUD completas para recursos humanos con acciones especializadas para gestión de habilidades y vinculación de usuarios.

### Endpoint: GET - /api/v1/resource_management/human-resources/

### query Parameters

search
string
A search term.

ordering
string
Which field to use when ordering the results.

page
integer
A page number within the paginated result set.

page_size
integer
Number of results to return per page.

### Responses

#### 200 - Response Schema: application/json

count
required
integer

next
string or null <uri>

previous
string or null <uri>

results
required
Array of objects (HumanResourceList)

## ViewSet para gestión de recursos humanos.

### Descripción

Proporciona operaciones CRUD completas para recursos humanos con acciones especializadas para gestión de habilidades y vinculación de usuarios.

### Endpoint: /api/v1/resource_management/human-resources/

### Request Body schema: application/json

resource
required
integer (Resource)
ID del recurso base existente

user
integer or null (User)
ID del usuario a asociar (opcional)

position
required
string (Position) [ 1 .. 255 ] characters
Posición o cargo del recurso humano

role
string (Role)
Enum: "senior" "junior" "specialist" "consultant" "intern"
Rol del recurso humano

employment_type
string (Employment type)
Enum: "full_time" "part_time" "contract" "freelance" "intern"
Tipo de empleo

experience_years
integer or null (Experience years) [ 0 .. 50 ]
Años de experiencia

hourly_rate
string or null <decimal> (Hourly rate)
Tarifa por hora

skills
string (Skills)
Habilidades en formato texto

skills_data
object (SkillSet)
Datos estructurados de habilidades

certification_level
string (Certification level) <= 100 characters
Nivel de certificación

### Responses

201
Response Schema: application/json
resource
required
integer (Resource)
ID del recurso base existente

user
integer or null (User)
ID del usuario a asociar (opcional)

position
required
string (Position) [ 1 .. 255 ] characters
Posición o cargo del recurso humano

role
string (Role)
Enum: "senior" "junior" "specialist" "consultant" "intern"
Rol del recurso humano

employment_type
string (Employment type)
Enum: "full_time" "part_time" "contract" "freelance" "intern"
Tipo de empleo

experience_years
integer or null (Experience years) [ 0 .. 50 ]
Años de experiencia

hourly_rate
string or null <decimal> (Hourly rate)
Tarifa por hora

skills
string (Skills)
Habilidades en formato texto

skills_data
object (SkillSet)
Datos estructurados de habilidades

certification_level
string (Certification level) <= 100 characters
Nivel de certificación

## Obtener recursos humanos disponibles

### Descripción

Obtiene la lista de recursos humanos actualmente disponibles

### Endpoint: GET - /api/v1/resource_management/human-resources/available/

### query Parameters

search
string
A search term.

ordering
string
Which field to use when ordering the results.

page
integer
A page number within the paginated result set.

page_size
integer
Number of results to return per page.

min_capacity
number
Capacidad mínima disponible requerida (%)

### Responses

200
Response Schema: application/json
Array
resource
required
integer (Resource)
resource_id
integer (Resource id)
resource_name
string (Resource name) non-empty
resource_status
string (Resource status) non-empty
position
required
string (Position) [ 1 .. 255 ] characters
Job position or role

role
string (Role)
Enum: "senior" "junior" "specialist" "consultant" "intern"
Role of the human resource

role_display
string (Role display) non-empty
employment_type
string (Employment type)
Enum: "full_time" "part_time" "contract" "freelance" "intern"
Type of employment

employment_type_display
string (Employment type display) non-empty
hourly_rate
string or null <decimal> (Hourly rate)
Hourly rate in local currency

user_full_name
string (User full name)
is_available
boolean (Is available)

## Obtener posiciones disponibles

### Descripción

Obtiene la lista de posiciones/cargos únicos con estadísticas de uso

### Endpoint: GET - /api/v1/resource_management/human-resources/positions/

### query Parameters

search
string
Buscar posiciones por nombre

ordering
string
Which field to use when ordering the results.

page
integer
A page number within the paginated result set.

page_size
integer
Number of results to return per page.

active_only
boolean
Default: false
Solo posiciones de recursos activos

### Responses

200 Lista de posiciones disponibles

## Obtener roles disponibles

### Descripción

Obtiene la lista de roles disponibles para recursos humanos con estadísticas

### Endpoint: GET - /api/v1/resource_management/human-resources/roles/

### query Parameters

search
string
A search term.

ordering
string
Which field to use when ordering the results.

page
integer
A page number within the paginated result set.

page_size
integer
Number of results to return per page.

### Responses

200 Lista de roles disponibles
Response Schema: application/json
object

## Buscar recursos humanos por habilidades

### Descripción

Busca recursos humanos que tengan habilidades específicas

### Endpoint: GET - /api/v1/resource_management/human-resources/search-by-skills/

### query Parameters

search
string
A search term.

ordering
string
Which field to use when ordering the results.

page
integer
A page number within the paginated result set.

page_size
integer
Number of results to return per page.

skills
required
string
Habilidades a buscar (separadas por comas)

available_only
boolean
Default: false
Solo recursos disponibles

### Responses

#### 200 - Response Schema: application/json

Array
resource
required
integer (Resource)

resource_id
integer (Resource id)

resource_name
string (Resource name) non-empty

resource_status
string (Resource status) non-empty

position
required
string (Position) [ 1 .. 255 ] characters
Job position or role

role
string (Role)
Enum: "senior" "junior" "specialist" "consultant" "intern"
Role of the human resource

role_display
string (Role display) non-empty
employment_type
string (Employment type)
Enum: "full_time" "part_time" "contract" "freelance" "intern"
Type of employment

employment_type_display
string (Employment type display) non-empty
hourly_rate
string or null <decimal> (Hourly rate)
Hourly rate in local currency

user_full_name
string (User full name)
is_available
boolean (Is available)

## Buscar recursos humanos por habilidades

### Descripción

Busca recursos humanos que tengan habilidades específicas

### Endpoint: GET - /api/v1/resource_management/human-resources/search-by-skills/

### query Parameters

search
string
A search term.

ordering
string
Which field to use when ordering the results.

page
integer
A page number within the paginated result set.

page_size
integer
Number of results to return per page.

skills
required
string
Habilidades a buscar (separadas por comas)

available_only
boolean
Default: false
Solo recursos disponibles

### Responses

#### 200 - Response Schema: application/json

Array

resource
required
integer (Resource)
resource_id
integer (Resource id)
resource_name
string (Resource name) non-empty
resource_status
string (Resource status) non-empty
position
required
string (Position) [ 1 .. 255 ] characters
Job position or role

role
string (Role)
Enum: "senior" "junior" "specialist" "consultant" "intern"
Role of the human resource

role_display
string (Role display) non-empty
employment_type
string (Employment type)
Enum: "full_time" "part_time" "contract" "freelance" "intern"
Type of employment

employment_type_display
string (Employment type display) non-empty
hourly_rate
string or null <decimal> (Hourly rate)
Hourly rate in local currency

user_full_name
string (User full name)
is_available
boolean (Is available)

## Obtener estadísticas de recursos humanos

### Descripción

Obtiene estadísticas generales sobre los recursos humanos

### Endpoint: GET - /api/v1/resource_management/human-resources/stats/

### query Parameters

search
string
A search term.

ordering
string
Which field to use when ordering the results.

page
integer
A page number within the paginated result set.

page_size
integer
Number of results to return per page.

### Responses

200 Estadísticas de recursos humanos
Response Schema: application/json
object

## Obtener historial de cargas de trabajo

### Descripción

Obtiene el historial de cargas de trabajo de un recurso humano específico o de todos

### query Parameters

search
string
A search term.

ordering
string
Which field to use when ordering the results.

page
integer
A page number within the paginated result set.

page_size
integer
Number of results to return per page.

start_date
string
Fecha de inicio para el historial (YYYY-MM-DD)

end_date
string
Fecha de fin para el historial (YYYY-MM-DD)

resource_id
integer
ID del recurso específico (opcional)

### Responses

200 Historial de cargas de trabajo
Response Schema: application/json
object

## ViewSet para gestión de recursos humanos.

### Descripción

Proporciona operaciones CRUD completas para recursos humanos con acciones especializadas para gestión de habilidades y vinculación de usuarios.

### Endpoint: GET - /api/v1/resource_management/human-resources/{resource}/

### path Parameters

resource
required
string
A unique value identifying this Human Resource.

### Responses

200
Response Schema: application/json
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
string (Position) [ 1 .. 255 ] characters
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
integer or null (Experience years) [ 0 .. 50 ]
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

## ViewSet para gestión de recursos humanos.

### Descripción

Proporciona operaciones CRUD completas para recursos humanos con acciones especializadas para gestión de habilidades y vinculación de usuarios.

### Endpoint: PUT - /api/v1/resource_management/human-resources/{resource}/

### path Parameters

resource
required
string
A unique value identifying this Human Resource.

### Request Body schema: application/json

resource
required
integer (Resource)
ID del recurso base existente

user
integer or null (User)
ID del usuario a asociar (opcional)

position
required
string (Position) [ 1 .. 255 ] characters
Posición o cargo del recurso humano

role
string (Role)
Enum: "senior" "junior" "specialist" "consultant" "intern"
Rol del recurso humano

employment_type
string (Employment type)
Enum: "full_time" "part_time" "contract" "freelance" "intern"
Tipo de empleo

experience_years
integer or null (Experience years) [ 0 .. 50 ]
Años de experiencia

hourly_rate
string or null <decimal> (Hourly rate)
Tarifa por hora

skills
string (Skills)
Habilidades en formato texto

skills_data
object (SkillSet)
Datos estructurados de habilidades

certification_level
string (Certification level) <= 100 characters
Nivel de certificación

### Responses

#### 200 - Response Schema: application/json

resource
required
integer (Resource)
ID del recurso base existente

user
integer or null (User)
ID del usuario a asociar (opcional)

position
required
string (Position) [ 1 .. 255 ] characters
Posición o cargo del recurso humano

role
string (Role)
Enum: "senior" "junior" "specialist" "consultant" "intern"
Rol del recurso humano

employment_type
string (Employment type)
Enum: "full_time" "part_time" "contract" "freelance" "intern"
Tipo de empleo

experience_years
integer or null (Experience years) [ 0 .. 50 ]
Años de experiencia

hourly_rate
string or null <decimal> (Hourly rate)
Tarifa por hora

skills
string (Skills)
Habilidades en formato texto

skills_data
object (SkillSet)
Datos estructurados de habilidades

certification_level
string (Certification level) <= 100 characters
Nivel de certificación

## ViewSet para gestión de recursos humanos.

### Descripción

Proporciona operaciones CRUD completas para recursos humanos con acciones especializadas para gestión de habilidades y vinculación de usuarios.

### Endpoint: PATCH - api/v1/resource_management/human-resources/{resource}/

### path Parameters

resource
required
string
A unique value identifying this Human Resource.

### Request Body schema: application/json

resource
required
integer (Resource)
ID del recurso base existente

user
integer or null (User)
ID del usuario a asociar (opcional)

position
required
string (Position) [ 1 .. 255 ] characters
Posición o cargo del recurso humano

role
string (Role)
Enum: "senior" "junior" "specialist" "consultant" "intern"
Rol del recurso humano

employment_type
string (Employment type)
Enum: "full_time" "part_time" "contract" "freelance" "intern"
Tipo de empleo

experience_years
integer or null (Experience years) [ 0 .. 50 ]
Años de experiencia

hourly_rate
string or null <decimal> (Hourly rate)
Tarifa por hora

skills
string (Skills)
Habilidades en formato texto

skills_data
object (SkillSet)
Datos estructurados de habilidades

certification_level
string (Certification level) <= 100 characters
Nivel de certificación

### Responses

#### 200 - Response Schema: application/json

resource
required
integer (Resource)
ID del recurso base existente

user
integer or null (User)
ID del usuario a asociar (opcional)

position
required
string (Position) [ 1 .. 255 ] characters
Posición o cargo del recurso humano

role
string (Role)
Enum: "senior" "junior" "specialist" "consultant" "intern"
Rol del recurso humano

employment_type
string (Employment type)
Enum: "full_time" "part_time" "contract" "freelance" "intern"
Tipo de empleo

experience_years
integer or null (Experience years) [ 0 .. 50 ]
Años de experiencia

hourly_rate
string or null <decimal> (Hourly rate)
Tarifa por hora

skills
string (Skills)
Habilidades en formato texto

skills_data
object (SkillSet)
Datos estructurados de habilidades

certification_level
string (Certification level) <= 100 characters
Nivel de certificación

## ViewSet para gestión de recursos humanos.

### Descripción

Proporciona operaciones CRUD completas para recursos humanos con acciones especializadas para gestión de habilidades y vinculación de usuarios.

### Endpoint: DELETE - /api/v1/resource_management/human-resources/{resource}/

### path Parameters

resource
required
string
A unique value identifying this Human Resource.

### Responses

204

## Actualizar tarifa por hora

### Descripción

Actualiza la tarifa por hora del recurso humano

### Endpoint: POST - /api/v1/resource_management/human-resources/{resource}/hourly-rate/

### path Parameters

resource
required
string
A unique value identifying this Human Resource.

Request Body schema: application/json
hourly_rate
required
string <decimal> (Hourly rate)
Nueva tarifa por hora

reason
string (Reason) <= 200 characters
Razón del cambio de tarifa

### Responses

200 Tarifa actualizada exitosamente
400 Error de validación
404 Recurso humano no encontrado

## Vincular usuario con recurso humano

### Descripción

Vincula un usuario del sistema con un recurso humano

### Endpoint: POST - /api/v1/resource_management/human-resources/{resource}/link-user/

### path Parameters

resource
required
string
A unique value identifying this Human Resource.

Request Body schema: application/json
user_id
required
integer (User id)
ID del usuario a vincular

### Responses

200 Usuario vinculado exitosamente
404 Usuario o recurso no encontrado
409 Usuario ya vinculado

## Actualizar habilidades del recurso humano

### Descripción

Actualiza las habilidades y competencias del recurso humano

### Endpoint: POST - /api/v1/resource_management/human-resources/{resource}/skills/

### path Parameters

resource
required
string
A unique value identifying this Human Resource.

Request Body schema: application/json
skills
required
string (Skills) non-empty
Habilidades del recurso humano (texto libre o JSON)

### Responses

200 Habilidades actualizadas exitosamente
400 Error de validación
404 Recurso humano no encontrado

## Desvincular usuario del recurso humano

### Descipción

Desvincula el usuario actualmente asociado al recurso humano

### Endpoint: DELETE - /api/v1/resource_management/human-resources/{resource}/unlink-user/

### path Parameters

resource
required
string
A unique value identifying this Human Resource.

### Responses

200 Usuario desvinculado exitosamente
400 No hay usuario vinculado
404 Recurso humano no encontrado

## ViewSet para gestión de recursos materiales.

### Descripcion

Proporciona operaciones CRUD completas para recursos materiales con acciones especializadas para gestión de inventario, stock y proveedores.

### Endpoint: GET - /api/v1/resource_management/material-resources/

### query Parameters

search
string
A search term.

ordering
string
Which field to use when ordering the results.

page
integer
A page number within the paginated result set.

page_size
integer
Number of results to return per page.

### Responses

#### 200 - Response Schema: application/json

count
required
integer

next
string or null <uri>

previous
string or null <uri>

results
required
Array of objects (MaterialResourceList)

## ViewSet para gestión de recursos materiales.

### Descripción

Proporciona operaciones CRUD completas para recursos materiales con acciones especializadas para gestión de inventario, stock y proveedores.

### Endpoint: POST - /api/v1/resource_management/material-resources/

### Request Body schema: application/json

resource
required
integer (Resource)
ID del recurso base ya creado

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

### Responses

201
Response Schema: application/json
resource
required
integer (Resource)
ID del recurso base ya creado

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

## Obtener recursos con garantías próximas a expirar

### Descripción

Lista recursos con garantías que expiran pronto

### query Parameters

search
string
A search term.

ordering
string
Which field to use when ordering the results.

page
integer
A page number within the paginated result set.

page_size
integer
Number of results to return per page.

days_ahead
integer
Default: 30
Días de anticipación para la alerta (default: 30)

### Responses

#### 200 - Response Schema: application/json

resource_id
integer (Resource id)

resource_name
string (Resource name) non-empty

warranty_expiry
string <date> (Warranty expiry)

days_to_expire
integer (Days to expire)

supplier
string (Supplier) non-empty

serial_number
string (Serial number) non-empty

## Obtener estadísticas de inventario

### Descripción

Obtiene estadísticas generales del inventario

### Endpoint: GET - /api/v1/resource_management/material-resources/inventory-statistics/

### query Parameters

search
string
A search term.

ordering
string
Which field to use when ordering the results.

page
integer
A page number within the paginated result set.

page_size
integer
Number of results to return per page.

### Responses

#### 200 - Response Schema: application/json

total_resources
integer (Total resources)

consumable_resources
integer (Consumable resources)

permanent_resources
integer (Permanent resources)

low_stock_count
integer (Low stock count)

low_stock_percentage
number (Low stock percentage)

total_inventory_value
string <decimal> (Total inventory value)

average_stock
number (Average stock)

maximum_stock
number (Maximum stock)

minimum_stock
number (Minimum stock)

total_quantity
number (Total quantity)

## Obtener recursos con stock bajo

### Descripción

Lista todos los recursos con stock por debajo del mínimo

### Endpoint: GET - /api/v1/resource_management/material-resources/low-stock-alerts/

### query Parameters

search
string
A search term.

ordering
string
Which field to use when ordering the results.

page
integer
A page number within the paginated result set.

page_size
integer
Number of results to return per page.

threshold_percentage
number
Default: 0
Porcentaje adicional sobre el mínimo (default: 0)

### Responses

### 200 - Response Schema: application/json

Array
resource_id
integer (Resource id)
resource_name
string (Resource name) non-empty
current_quantity
string <decimal> (Current quantity)
minimum_stock
string <decimal> (Minimum stock)
shortage
string <decimal> (Shortage)
unit_cost
string <decimal> (Unit cost)
supplier
string (Supplier) non-empty
unit_of_measure
string (Unit of measure) non-empty

## Buscar recursos materiales

### Descripción

Busca recursos materiales por múltiples criterios

### Endpoint: GET - /api/v1/resource_management/material-resources/search/

### query Parameters

search
string
A search term.

ordering
string
Which field to use when ordering the results.

page
integer
A page number within the paginated result set.

page_size
integer
Number of results to return per page.

name
string
Nombre del recurso

supplier
string
Proveedor

unit_of_measure
string
Unidad de medida

is_consumable
boolean
Es consumible

min_quantity
number
Cantidad mínima

max_quantity
number
Cantidad máxima

### Responses

#### 200 - Response Schema: application/json

Array
resource
required
integer (Resource)
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

quantity_available
string <decimal> (Quantity available)
Available quantity

minimum_stock
string <decimal> (Minimum stock)
Minimum stock level

supplier
string (Supplier) <= 255 characters
Primary supplier information

is_low_stock
boolean (Is low stock)
total_value
string <decimal> (Total value)

## ViewSet para gestión de recursos materiales.

### Descripción

Proporciona operaciones CRUD completas para recursos materiales con acciones especializadas para gestión de inventario, stock y proveedores.

### path Parameters

resource
required
string
A unique value identifying this Material Resource.

### Responses

#### 200 - Response Schema: application/json

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

## ViewSet para gestión de recursos materiales.

### Descripción

Proporciona operaciones CRUD completas para recursos materiales con acciones especializadas para gestión de inventario, stock y proveedores.

### Endpoint: PUT - /api/v1/resource_management/material-resources/{resource}/

### path Parameters

resource
required
string
A unique value identifying this Material Resource.

### Request Body schema: application/json

resource
required
integer (Resource)
ID del recurso base ya creado

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

### Responses

#### 200 - Response Schema: application/json

resource
required
integer (Resource)
ID del recurso base ya creado

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

## ViewSet para gestión de recursos materiales.

### Descripción

Proporciona operaciones CRUD completas para recursos materiales con acciones especializadas para gestión de inventario, stock y proveedores.

### Endpoint: PATCH - /api/v1/resource_management/material-resources/{resource}/

### path Parameters

resource
required
string
A unique value identifying this Material Resource.

### Request Body schema: application/json

resource
required
integer (Resource)
ID del recurso base ya creado

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

### Responses

200
Response Schema: application/json
resource
required
integer (Resource)
ID del recurso base ya creado

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

## ViewSet para gestión de recursos materiales.

### Descripción

Proporciona operaciones CRUD completas para recursos materiales con acciones especializadas para gestión de inventario, stock y proveedores.

### Endpoint: DELETE - /api/v1/resource_management/material-resources/{resource}/

### path Parameters

resource
required
string
A unique value identifying this Material Resource.

### Responses

204

## Consumir stock del recurso material

### Descripción

Reduce el stock disponible del recurso material

### Endpoint: POST - /api/v1/resource_management/material-resources/{resource}/consume-stock/

### path Parameters

resource
required
string
A unique value identifying this Material Resource.

### path Parameters

resource
required
string
A unique value identifying this Material Resource.

### Request Body schema: application/json

quantity_to_consume
required
string <decimal> (Quantity to consume)
Cantidad a consumir

consumed_by
string (Consumed by) <= 255 characters
Quien consume el recurso

purpose
string (Purpose) <= 255 characters
Propósito del consumo

### Responses

200 Stock consumido exitosamente
400 Error de validación
404 Recurso material no encontrado
409 Stock insuficiente

## Reponer stock del recurso material

### Descripción

Aumenta el stock disponible del recurso material

### Endpoint: POST - /api/v1/resource_management/material-resources/{resource}/replenish-stock/

### path Parameters

resource
required
string
A unique value identifying this Material Resource.

### Request Body schema: application/json

quantity_to_add
required
string <decimal> (Quantity to add)
Cantidad a agregar

supplier
string (Supplier) <= 255 characters
Proveedor de la reposición

purchase_cost
string <decimal> (Purchase cost)
Costo de compra por unidad

purchase_date
string <date> (Purchase date)
Fecha de compra

### Responses

200 Stock repuesto exitosamente
400 Error de validación
404 Recurso material no encontrado

## Actualizar stock del recurso material

### Descripción

Actualiza la cantidad de stock disponible del recurso material

### Endpoint: POST - /api/v1/resource_management/material-resources/{resource}/update-stock/

### path Parameters

resource
required
string
A unique value identifying this Material Resource.

Request Body schema: application/json
new_quantity
required
string <decimal> (New quantity)
Nueva cantidad de stock

reason
string (Reason) <= 255 characters
Motivo de la actualización

### Responses

200 Stock actualizado exitosamente
400 Error de validación
404 Recurso material no encontrado

## resource_management_resource-types_list

### Descripción

Listar tipos de recursos usando el servicio con filtros.

### Endpoint: GET - /api/v1/resource_management/resource-types/

### query Parameters

search
string
A search term.

ordering
string
Which field to use when ordering the results.

page
integer
A page number within the paginated result set.

page_size
integer
Number of results to return per page.

### Responses

#### 200 - Response Schema: application/json

count
required
integer
next
string or null <uri>
previous
string or null <uri>
results
required
Array of objects (ResourceTypeList)

## resource_management_resource-types_create

### Descripción:

Crear un nuevo tipo de recurso usando el servicio.

### Endpoints: POST - /api/v1/resource_management/resource-types/

### Request Body schema: application/json

name
required
string (Name) [ 1 .. 100 ] characters
Name of the resource type

description
string (Description)
Detailed description of the resource type

category
string (Category)
Enum: "human" "software" "hardware" "other"
Category of the resource type

is_active
boolean (Is active)
Whether this resource type is currently active

### Responses

#### 201 - Response Schema: application/json

name
required
string (Name) [ 1 .. 100 ] characters
Name of the resource type

description
string (Description)
Detailed description of the resource type

category
string (Category)
Enum: "human" "software" "hardware" "other"
Category of the resource type

is_active
boolean (Is active)
Whether this resource type is currently active

## Actualización masiva de tipos de recursos

### Descripción

Actualiza múltiples tipos de recursos en una sola operación

### Endpoint: POST - /api/v1/resource_management/resource-types/bulk-update/

### Request Body schema: application/json

resource_type_ids
required
Array of integers [ 1 .. 50 ] items
Lista de IDs de tipos de recursos a actualizar

updates
required
object (Updates)
Campos a actualizar

### Responses

200 Actualización exitosa
400 Error de validación

## Obtener categorías disponibles

### Descripción

Obtiene la lista de todas las categorías de tipos de recursos disponibles

### Endpoint: GET - /api/v1/resource_management/resource-types/categories/

### query Parameters

search
string
A search term.

ordering
string
Which field to use when ordering the results.

page
integer
A page number within the paginated result set.

page_size
integer
Number of results to return per page.

### Responses

200 Lista de categorías
Response Schema: application/json
categories
Array of objects

## Obtener estadísticas de tipos de recursos

### Descripción

Obtiene estadísticas generales sobre los tipos de recursos

### Endpoint: GET - /api/v1/resource_management/resource-types/stats/

### query Parameters

search
string
A search term.

ordering
string
Which field to use when ordering the results.

page
integer
A page number within the paginated result set.

page_size
integer
Number of results to return per page.

### Responses

#### 200 - Response Schema: application/json

total_types
integer (Total types)
active_types
integer (Active types)
inactive_types
integer (Inactive types)
types_by_category
object (Types by category)
resources_distribution
object (Resources distribution)
most_used_type
object or null (Most used type)
least_used_type
object or null (Least used type)

## resource_management_resource-types_read

### Descripción

Obtener un tipo de recurso específico usando el servicio.

### Endpoint: GET - /api/v1/resource_management/resource-types/{id}/

### path Parameters

id
required
integer
A unique integer value identifying this Resource Type.

### Responses

#### 200 - Response Schema: application/json

id
integer (Id)
name
required
string (Name) [ 1 .. 100 ] characters
Name of the resource type

description
string (Description)
Detailed description of the resource type

category
string (Category)
Enum: "human" "software" "hardware" "other"
Category of the resource type

category_display
string (Category display) non-empty
is_active
boolean (Is active)
Whether this resource type is currently active

created_at
string <date-time> (Created at)
updated_at
string <date-time> (Updated at)
resources_count
integer (Resources count)
active_resources_count
integer (Active resources count)
resources_by_status
object (Resources by status)
last_resource_created
object or null (Last resource created)

## resource_management_resource-types_update

### Descripción

Actualizar un tipo de recurso usando el servicio.

### Endpoint: PUT - /api/v1/resource_management/resource-types/{id}/

### path Parameters

id
required
integer
A unique integer value identifying this Resource Type.

### Request Body schema: application/json

name
required
string (Name) [ 1 .. 100 ] characters
Name of the resource type

description
string (Description)
Detailed description of the resource type

category
string (Category)
Enum: "human" "software" "hardware" "other"
Category of the resource type

is_active
boolean (Is active)
Whether this resource type is currently active

### Responses

#### 200 - Response Schema: application/json

name
required
string (Name) [ 1 .. 100 ] characters
Name of the resource type

description
string (Description)
Detailed description of the resource type

category
string (Category)
Enum: "human" "software" "hardware" "other"
Category of the resource type

is_active
boolean (Is active)
Whether this resource type is currently active

## ViewSet para gestión de tipos de recursos usando servicios.

### Descripción

Proporciona operaciones CRUD completas para tipos de recursos con filtros, búsqueda y acciones adicionales.

### Endpoint: PATCH - /api/v1/resource_management/resource-types/{id}/

### path Parameters

id
required
integer
A unique integer value identifying this Resource Type.

### Request Body schema: application/json

name
required
string (Name) [ 1 .. 100 ] characters
Name of the resource type

description
string (Description)
Detailed description of the resource type

category
string (Category)
Enum: "human" "software" "hardware" "other"
Category of the resource type

is_active
boolean (Is active)
Whether this resource type is currently active

### Responses

#### 200 - Response Schema: application/json

name
required
string (Name) [ 1 .. 100 ] characters
Name of the resource type

description
string (Description)
Detailed description of the resource type

category
string (Category)
Enum: "human" "software" "hardware" "other"
Category of the resource type

is_active
boolean (Is active)
Whether this resource type is currently active

## resource_management_resource-types_delete

### Descripción

Eliminar un tipo de recurso usando el servicio.

### Endpoint: DELETE - /api/v1/resource_management/resource-types/{id}/

### path Parameters

id
required
integer
A unique integer value identifying this Resource Type.

### Responses

204

## Activar tipo de recurso

### Descripción

Activa un tipo de recurso previamente desactivado

### Endpoint: POST - /api/v1/resource_management/resource-types/{id}/activate/

### path Parameters

id
required
integer
A unique integer value identifying this Resource Type.

### Request Body schema: application/json

name
required
string (Name) [ 1 .. 100 ] characters
Name of the resource type

description
string (Description)
Detailed description of the resource type

category
string (Category)
Enum: "human" "software" "hardware" "other"
Category of the resource type

is_active
boolean (Is active)
Whether this resource type is currently active

### Responses

200 Tipo de recurso activado
404 Tipo de recurso no encontrado

## Desactivar tipo de recurso

### Descripción

Desactiva un tipo de recurso (no elimina, solo desactiva)

### Endpoint: POST - /api/v1/resource_management/resource-types/{id}/deactivate/

### path Parameters

id
required
integer
A unique integer value identifying this Resource Type.

### Request Body schema: application/json

name
required
string (Name) [ 1 .. 100 ] characters
Name of the resource type

description
string (Description)
Detailed description of the resource type

category
string (Category)
Enum: "human" "software" "hardware" "other"
Category of the resource type

is_active
boolean (Is active)
Whether this resource type is currently active

### Responses

200 Tipo de recurso desactivado
404 Tipo de recurso no encontrado
409 No se puede desactivar debido a recursos activos

## Obtener recursos del tipo

### Descripción

Obtiene todos los recursos asociados a este tipo de recurso

### Endpoint: GET - /api/v1/resource_management/resource-types/{id}/resources/

### path Parameters

id
required
integer
A unique integer value identifying this Resource Type.

### Responses

#### 200 Lista de recursos del tipo

Response Schema: application/json
count
integer
results
Array of objects

## Obtener resumen de uso del tipo de recurso

### Descripción

Obtiene estadísticas detalladas sobre el uso de un tipo de recurso específico

### Endpoint: GET - /api/v1/resource_management/resource-types/{id}/usage-summary/

### path Parameters

id
required
integer
A unique integer value identifying this Resource Type.

### Responses

#### 200 Resumen de uso del tipo de recurso

Response Schema: application/json
resource_type
object
totals
object
status_distribution
object
last_updated
string

#### 404 Tipo de recurso no encontrado

## ViewSet para gestión de recursos.

### Decripción

Proporciona operaciones CRUD completas para recursos con acciones especializadas para asignación y gestión de carga. Integrado con ResourceService para lógica de negocio.

### Endpoint: GET - /api/v1/resource_management/resources/

### query Parameters

search
string
A search term.

ordering
string
Which field to use when ordering the results.

page
integer
A page number within the paginated result set.

page_size
integer
Number of results to return per page.

### Responses

#### 200 - Response Schema: application/json

count
required
integer
next
string or null <uri>
previous
string or null <uri>
results
required
Array of objects (ResourceList)

## resource_management_resources_create

### Descripción

Crear un nuevo recurso usando el servicio.

### Endpoint: POST - /api/v1/resource_management/resources/

### Request Body schema: application/json

name
required
string (Name) [ 1 .. 255 ] characters
Name of the resource

description
string (Description)
Detailed description of the resource

resource_type
required
integer (Resource type)
Type of this resource

location
string (Location) <= 255 characters
Physical or logical location of the resource

availability_status
string (Availability status)
Enum: "available" "assigned" "maintenance" "unavailable"
Current availability status

workload_percentage
number (Workload percentage) [ 0 .. 100 ]
Current workload as percentage (0-100)

is_active
boolean (Is active)
Whether this resource is currently active

acquisition_date
string or null <date> (Acquisition date)
Date when the resource was acquired

### Responses

#### 201 - Response Schema: application/json

name
required
string (Name) [ 1 .. 255 ] characters
Name of the resource

description
string (Description)
Detailed description of the resource

resource_type
required
integer (Resource type)
Type of this resource

location
string (Location) <= 255 characters
Physical or logical location of the resource

availability_status
string (Availability status)
Enum: "available" "assigned" "maintenance" "unavailable"
Current availability status

workload_percentage
number (Workload percentage) [ 0 .. 100 ]
Current workload as percentage (0-100)

is_active
boolean (Is active)
Whether this resource is currently active

acquisition_date
string or null <date> (Acquisition date)
Date when the resource was acquired

## Obtener recursos disponibles

### Descripción

Obtiene una lista de recursos disponibles para asignación

### Endpoint: GET - /api/v1/resource_management/resources/available/

### query Parameters

search
string
A search term.

ordering
string
Which field to use when ordering the results.

page
integer
A page number within the paginated result set.

page_size
integer
Number of results to return per page.

resource_type
integer
Filtrar por tipo de recurso

minimum_capacity
number
Capacidad mínima disponible requerida

### Responses

#### 200 - Response Schema: application/json

Array
id
integer (Id)
name
required
string (Name) [ 1 .. 255 ] characters
Name of the resource

resource_type
required
integer (Resource type)
Type of this resource

resource_type_name
string (Resource type name) non-empty
resource_category
string (Resource category) non-empty
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
number (Workload percentage) [ 0 .. 100 ]
Current workload as percentage (0-100)

is_active
boolean (Is active)
Whether this resource is currently active

is_available
boolean (Is available)
remaining_capacity
number (Remaining capacity)

## Creación masiva de recursos

### Descripción

Crea múltiples recursos en una sola operación

### Endpoint: POST - /api/v1/resource_management/resources/bulk-create/

### Request Body schema: application/json

resources
required
Array of objects (ResourceCreateUpdate) [ 1 .. 20 ] items
Lista de recursos a crear

### Responses

201 Recursos creados exitosamente
400 Error de validación

## Búsqueda avanzada de recursos

### Descripción

Realiza búsqueda avanzada de recursos con múltiples criterios

### Endpoint: POST - /api/v1/resource_management/resources/search/

### Request Body schema: application/json

name
string (Name) non-empty
Buscar por nombre (búsqueda parcial)

resource_type_id
integer (Resource type id)
Filtrar por tipo de recurso

category
string (Category)
Enum: "human" "software" "hardware" "other"
Filtrar por categoría

availability_status
string (Availability status)
Enum: "available" "assigned" "maintenance" "unavailable"
Filtrar por estado de disponibilidad

location
string (Location) non-empty
Buscar por ubicación (búsqueda parcial)

min_capacity
number (Min capacity) [ 0 .. 100 ]
Capacidad mínima disponible requerida

is_active
boolean (Is active)
Default: true
Filtrar por estado activo

### Responses

#### 200 - Response Schema: application/json

Array
id
integer (Id)
name
required
string (Name) [ 1 .. 255 ] characters
Name of the resource

resource_type
required
integer (Resource type)
Type of this resource

resource_type_name
string (Resource type name) non-empty
resource_category
string (Resource category) non-empty
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
number (Workload percentage) [ 0 .. 100 ]
Current workload as percentage (0-100)

is_active
boolean (Is active)
Whether this resource is currently active

is_available
boolean (Is available)
remaining_capacity
number (Remaining capacity)

## Obtener estadísticas de recursos

### Descripción

Obtiene estadísticas generales sobre los recursos

### Endpoint: GET - /api/v1/resource_management/resources/stats/

### query Parameters

search
string
A search term.

ordering
string
Which field to use when ordering the results.

page
integer
A page number within the paginated result set.

page_size
integer
Number of results to return per page.

### Responses

#### 200 Estadísticas de recursos

Response Schema: application/json
object

## ViewSet para gestión de recursos.

### Descripción

Proporciona operaciones CRUD completas para recursos con acciones especializadas para asignación y gestión de carga. Integrado con ResourceService para lógica de negocio.

### Endpoint: GET - /api/v1/resource_management/resources/{id}/

### path Parameters

id
required
integer
A unique integer value identifying this Resource.

### Responses

#### 200 - Response Schema: application/json

id
integer (Id)
name
required
string (Name) [ 1 .. 255 ] characters
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
number (Workload percentage) [ 0 .. 100 ]
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

## resource_management_resources_update

### Descripción

Actualizar un recurso usando el servicio.

### Endpoint: PUT - /api/v1/resource_management/resources/{id}/

### path Parameters

id
required
integer
A unique integer value identifying this Resource.

### Request Body schema: application/json

name
required
string (Name) [ 1 .. 255 ] characters
Name of the resource

description
string (Description)
Detailed description of the resource

resource_type
required
integer (Resource type)
Type of this resource

location
string (Location) <= 255 characters
Physical or logical location of the resource

availability_status
string (Availability status)
Enum: "available" "assigned" "maintenance" "unavailable"
Current availability status

workload_percentage
number (Workload percentage) [ 0 .. 100 ]
Current workload as percentage (0-100)

is_active
boolean (Is active)
Whether this resource is currently active

acquisition_date
string or null <date> (Acquisition date)
Date when the resource was acquired

### Responses

#### 200 - Response Schema: application/json

name
required
string (Name) [ 1 .. 255 ] characters
Name of the resource

description
string (Description)
Detailed description of the resource

resource_type
required
integer (Resource type)
Type of this resource

location
string (Location) <= 255 characters
Physical or logical location of the resource

availability_status
string (Availability status)
Enum: "available" "assigned" "maintenance" "unavailable"
Current availability status

workload_percentage
number (Workload percentage) [ 0 .. 100 ]
Current workload as percentage (0-100)

is_active
boolean (Is active)
Whether this resource is currently active

acquisition_date
string or null <date> (Acquisition date)
Date when the resource was acquired

## ViewSet para gestión de recursos.

### Decripción

Proporciona operaciones CRUD completas para recursos con acciones especializadas para asignación y gestión de carga. Integrado con ResourceService para lógica de negocio.

### Endpoint: PATCH - /api/v1/resource_management/resources/{id}/

### path Parameters

id
required
integer
A unique integer value identifying this Resource.

### Request Body schema: application/json

name
required
string (Name) [ 1 .. 255 ] characters
Name of the resource

description
string (Description)
Detailed description of the resource

resource_type
required
integer (Resource type)
Type of this resource

location
string (Location) <= 255 characters
Physical or logical location of the resource

availability_status
string (Availability status)
Enum: "available" "assigned" "maintenance" "unavailable"
Current availability status

workload_percentage
number (Workload percentage) [ 0 .. 100 ]
Current workload as percentage (0-100)

is_active
boolean (Is active)
Whether this resource is currently active

acquisition_date
string or null <date> (Acquisition date)
Date when the resource was acquired

### Responses

#### 200 - Response Schema: application/json

name
required
string (Name) [ 1 .. 255 ] characters
Name of the resource

description
string (Description)
Detailed description of the resource

resource_type
required
integer (Resource type)
Type of this resource

location
string (Location) <= 255 characters
Physical or logical location of the resource

availability_status
string (Availability status)
Enum: "available" "assigned" "maintenance" "unavailable"
Current availability status

workload_percentage
number (Workload percentage) [ 0 .. 100 ]
Current workload as percentage (0-100)

is_active
boolean (Is active)
Whether this resource is currently active

acquisition_date
string or null <date> (Acquisition date)
Date when the resource was acquired

## resource_management_resources_delete

### Descripción

Eliminar un recurso usando el servicio.

### Endpoint: DELETE - /api/v1/resource_management/resources/{id}/

### path Parameters

id
required
integer
A unique integer value identifying this Resource.

### Responses

204

## Activar recurso

### Descripción

Activa un recurso desactivado y lo marca como disponible

### Endpoint: POST - /api/v1/resource_management/resources/{id}/activate/

### path Parameters

id
required
integer
A unique integer value identifying this Resource.

### Request Body schema: application/json

name
required
string (Name) [ 1 .. 255 ] characters
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

workload_percentage
number (Workload percentage) [ 0 .. 100 ]
Current workload as percentage (0-100)

is_active
boolean (Is active)
Whether this resource is currently active

acquisition_date
string or null <date> (Acquisition date)
Date when the resource was acquired

resource_type
required
integer (Resource type)
Type of this resource

resource_type_detail
object (ResourceTypeList)

### Responses

200 Recurso activado exitosamente
404 Recurso no encontrado

## Asignar recurso a tarea

### Descripción

Asigna un recurso a una tarea específica con el porcentaje de carga indicado

### Endpoint: POST - /api/v1/resource_management/resources/{id}/assign/

### path Parameters

id
required
integer
A unique integer value identifying this Resource.

#### Request Body schema: application/json

task_id
required
integer (Task id)
ID de la tarea a la que se asignará el recurso

assignment_percentage
number (Assignment percentage) [ 0.1 .. 100 ]
Default: 100
Porcentaje de asignación del recurso (0.1-100.0)

start_date
required
string <date> (Start date)
Fecha de inicio de la asignación

end_date
required
string <date> (End date)
Fecha de fin de la asignación

notes
string (Notes) <= 500 characters
Notas adicionales sobre la asignación

### Responses

200 Recurso asignado exitosamente
400 Error de validación
409 Recurso no disponible o ya asignado

## Desactivar recurso

### Descripción

Desactiva un recurso y lo marca como no disponible

### Endpoint: POST - /api/v1/resource_management/resources/{id}/deactivate/

### path Parameters

id
required
integer
A unique integer value identifying this Resource.

### Request Body schema: application/json

name
required
string (Name) [ 1 .. 255 ] characters
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

workload_percentage
number (Workload percentage) [ 0 .. 100 ]
Current workload as percentage (0-100)

is_active
boolean (Is active)
Whether this resource is currently active

acquisition_date
string or null <date> (Acquisition date)
Date when the resource was acquired

resource_type
required
integer (Resource type)
Type of this resource

resource_type_detail
object (ResourceTypeList)

### Responses

200 Recurso desactivado exitosamente
400 No se puede desactivar un recurso asignado
404 Recurso no encontrado

### Liberar recurso de tarea

### Descripción

Libera un recurso de su asignación actual

### Endpoint: POST - /api/v1/resource_management/resources/{id}/release/

### path Parameters

id
required
integer
A unique integer value identifying this Resource.

### Request Body schema: application/json

release_percentage
number
Porcentaje de carga a liberar

reason
string
Razón de la liberación

### Responses

200 Recurso liberado exitosamente
400 Error de validación

## Obtener carga de trabajo del recurso

Obtiene información detallada sobre la carga de trabajo actual del recurso

### Endpoint: GET - /api/v1/resource_management/resources/{id}/workload/

### path Parameters

id
required
integer
A unique integer value identifying this Resource.

### Responses

#### 200 Información de carga de trabajo

Response Schema: application/json
workload_percentage
number
remaining_capacity
number
is_available
boolean
status
string
