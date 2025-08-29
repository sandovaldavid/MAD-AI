# Guía Arquitectónica para Infrastructure Layer

## QUÉ ES Infrastructure

Infrastructure es la capa que **implementa los contratos definidos por Domain** y **proporciona servicios técnicos** para que la aplicación funcione. Es el "cómo" técnico de tu aplicación.

## REGLA DE ORO

**Pregunta decisiva:** "¿Este código podría cambiar completamente si cambio de tecnología (base de datos, framework, API externa) sin afectar las reglas de negocio?"

- Si SÍ → Va en Infrastructure
- Si NO → Probablemente va en otra capa

## PRINCIPIO FUNDAMENTAL

Infrastructure **IMPLEMENTA** pero **NO DEFINE** contratos. Los contratos los define Domain, Infrastructure solo los cumple.

## ESTRUCTURA OBLIGATORIA

### `/repositories` - Implementaciones de persistencia

**QUÉ VA:**

- Implementaciones concretas de interfaces de Domain
- Lógica específica de base de datos/API
- Mappers entre DTOs externos y entidades de Domain
- Manejo de conexiones y transacciones

**QUÉ NO VA:**

- Interfaces (van en Domain)
- Lógica de negocio
- Validaciones de dominio
- Transformaciones para UI

**Estructura recomendada:**

```typescript
repositories/
  business/           # Repositories de entidades de negocio
    http-user.repository.ts
    http-role.repository.ts
  session/           # Repositories de sesión/auth técnica
    local-storage-token-store.repository.ts
  system/           # Repositories de servicios técnicos
    system-clock.repository.ts
```

**Ejemplo correcto:**

```typescript
// http-user.repository.ts - Implementa UserRepository de Domain
async save(user: User): Promise<void> {
  const dto = this.mapper.toDTO(user);
  await this.httpClient.post('/users', dto);
}
```

**Ejemplo incorrecto:**

```typescript
// NO - Contiene lógica de negocio
async save(user: User): Promise<void> {
  if (user.isAdmin()) { // Esta lógica va en Domain
    throw new Error('Cannot save admin');
  }
}
```

### `/http` - Comunicación externa

**QUÉ VA:**

- Clients para APIs externas
- Interceptors de HTTP específicos de Angular
- Configuración de headers, timeouts, etc.
- Manejo de códigos de error HTTP específicos

**QUÉ NO VA:**

- Lógica de negocio
- Transformaciones de datos de negocio
- Validaciones de dominio

**Estructura recomendada:**

```typescript
http/
  clients/           # Clientes específicos por API
    auth-api.client.ts
    stripe-api.client.ts
  interceptors/      # Interceptors técnicos
    auth.interceptor.ts
    retry.interceptor.ts
  config/           # Configuraciones HTTP
    http.config.ts
```

### `/mappers` - Transformaciones de datos

**QUÉ VA:**

- Conversión entre DTOs externos y entidades Domain
- Transformación de formatos específicos de APIs
- Manejo de diferencias entre modelos internos y externos

**QUÉ NO VA:**

- Mappers para presentación (van en Presentation)
- Mappers entre capas de Application
- Lógica de negocio durante transformación

**Ejemplo correcto:**

```typescript
// user.mapper.ts
toDomain(dto: UserDTO): User {
  return User.create({
    id: dto.user_id,        // Transformación técnica
    email: dto.email_addr,  // Nombres diferentes
    firstName: dto.first_name
  });
}
```

### `/services` - Servicios técnicos específicos

**QUÉ VA:**

- Implementaciones de servicios que requieren tecnología específica
- Servicios que encapsulan APIs de terceros
- Servicios que manejan recursos del sistema

**QUÉ NO VA:**

- Servicios de dominio
- Servicios que usen múltiples bounded contexts (van en Core)
- Servicios de presentación

**Estructura recomendada:**

```typescript
services/
  storage/          # Servicios de almacenamiento
    local-storage.service.ts
  notification/     # Servicios de notificación externa
    email-gateway.service.ts
  external-apis/    # Servicios para APIs externas
    stripe-payment.service.ts
  system/          # Servicios del sistema
    file-system.service.ts
```

### `/guards` - Protección específica de Angular

**QUÉ VA:**

- Guards que protegen rutas usando lógica técnica
- Guards que verifican estados técnicos (autenticación, roles)
- Lógica específica del router de Angular

**QUÉ NO VA:**

- Lógica compleja de autorización (debería llamar a Domain/Application)
- Validaciones de dominio
- Guards que no dependan del router

**Ejemplo correcto:**

```typescript
// auth.guard.ts
canActivate(): boolean {
  return this.authFacade.isAuthenticated(); // Delega a Application
}
```

### `/errors` - Manejo de errores técnicos

**QUÉ VA:**

- InfrastructureError y sus implementaciones
- Transformadores de errores HTTP a errores de dominio
- Manejo de errores específicos de tecnologías

**QUÉ NO VA:**

- Definición de errores de dominio
- Errores de presentation
- Lógica de cómo mostrar errores al usuario

### `/dtos` - Objetos de transferencia de datos

**QUÉ VA:**

- DTOs que representan contratos de APIs externas
- Estructuras de datos específicas de servicios externos
- Objetos de serialización/deserialización

**QUÉ NO VA:**

- DTOs internos entre capas de tu aplicación
- Objetos con lógica de negocio
- DTOs que solo son para presentación

**Estructura recomendada:**

```typescript
dtos / auth / login - request.dto.ts;
login - response.dto.ts;
stripe / payment - request.dto.ts;
sendgrid / email - request.dto.ts;
```

## REGLAS ESPECÍFICAS POR TECNOLOGÍA

### Para Angular

**VA en Infrastructure:**

- Guards, Interceptors, Pipes técnicos
- Servicios que usan HttpClient
- Servicios que usan Angular-specific APIs

**NO VA en Infrastructure:**

- Componentes (van en Presentation)
- Servicios de routing/navegación
- Servicios de estado de UI

### Para APIs Externas

**VA en Infrastructure:**

- Autenticación técnica (API keys, tokens)
- Manejo de rate limiting específico
- Transformación de formatos específicos de la API

**NO VA en Infrastructure:**

- Decisiones de cuándo llamar la API
- Lógica de qué datos enviar
- Validaciones antes de enviar

## PATRONES CORRECTOS

### Implementación de Repository

```typescript
@Injectable()
export class HttpUserRepository implements UserRepository {
  constructor(
    private http: HttpClient,
    private mapper: UserMapper,
    private errorTransformer: HttpErrorTransformer
  ) {}

  async findById(id: string): Promise<User | null> {
    try {
      const dto = await this.http.get<UserDTO>(`/users/${id}`);
      return this.mapper.toDomain(dto);
    } catch (error) {
      throw this.errorTransformer.transform(error);
    }
  }
}
```

### Servicio de API Externa

```typescript
@Injectable()
export class StripePaymentService implements PaymentGatewayRepository {
  constructor(private stripeAuth: StripeAuthService) {}

  async processPayment(payment: Payment): Promise<PaymentResult> {
    const stripePayload = this.toStripeFormat(payment);
    const result = await this.callStripeAPI(stripePayload);
    return this.fromStripeResult(result);
  }

  private toStripeFormat(payment: Payment): StripePaymentDTO {
    /* */
  }
  private fromStripeResult(result: any): PaymentResult {
    /* */
  }
}
```

## PROHIBICIONES ABSOLUTAS EN INFRASTRUCTURE

### NUNCA hagas esto:

- **Definir interfaces:** Las interfaces van en Domain
- **Lógica de negocio:** Va en Domain o Application
- **Transformaciones para UI:** Van en Presentation
- **Comunicación directa con Presentation:** Solo a través de Application
- **Modificar entidades de Domain:** Solo mapping, nunca modificación

### NUNCA importes de:

- Presentation layer
- Application layer (excepto interfaces)
- Otras partes de Infrastructure que no sean utilities

## SEÑALES DE ALARMA

Si encuentras esto en Infrastructure, está mal:

- Validaciones de reglas de negocio
- Lógica condicional basada en roles de usuario
- Cálculos o algoritmos de dominio
- Referencias a componentes de UI
- Importaciones de Application layer

## REGLA DE DEPENDENCIAS

**Infrastructure puede conocer:**

- Domain (interfaces y entidades para implementar)
- Core (servicios transversales)
- Tecnologías externas (Angular, APIs, etc.)

**Infrastructure NO puede conocer:**

- Presentation
- Application (excepto facades para guards específicos)

## TEST FINAL

Pregúntate: "Si cambio de Angular a React, de MySQL a MongoDB, o de REST a GraphQL, ¿qué archivos de Infrastructure cambiarían?"

La respuesta debería ser: "Solo los archivos específicos de esa tecnología, sin afectar la lógica de negocio."
