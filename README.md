# micro-template

Plantilla base para crear microservicios NestJS con soporte para REST, gRPC, Kafka, Socket.IO y TCP.

## Stack

- **NestJS 11** con **Fastify** como HTTP adapter
- **MongoDB** (Mongoose) como base de datos
- **gRPC** para comunicacion sincrona inter-servicio
- **Kafka** para eventos asincronos (productor/consumidor)
- **Socket.IO** para comunicacion en tiempo real con clientes
- **Redis** para cache
- **Swagger** para documentacion de API REST
- **Joi** para validacion de datos
- **Pino** para logging estructurado
- **Docker** / **Docker Compose** con Kafka KRaft (sin Zookeeper)
- **GitHub Actions** CI/CD

## Arquitectura

Cada microservicio creado desde esta plantilla expone cinco canales de comunicacion:

| Canal | Protocolo | Puerto | Uso |
|-------|-----------|--------|-----|
| **REST** | HTTP/Fastify | `:5500` | API publica (clientes externos, frontend) |
| **Socket.IO** | WebSocket (upgrade HTTP) | `:5500` | Eventos en tiempo real hacia clientes |
| **gRPC** | HTTP/2 + Protobuf | `:50052` | Comunicacion sincrona entre microservicios |
| **Kafka** | TCP | brokers | Eventos asincronos entre microservicios |
| **TCP** | TCP nativo NestJS | configurable | Comunicacion simple entre micros (opcional) |

```
Frontend        --> [REST   :5500/api/v1/*]
Frontend        <-- [Socket.IO :5500/users] <-- eventos en tiempo real
Micro B         --> [gRPC   :50052] --> Micro A
Micro A         --> [Kafka] --> user.created --> Micro B (consumer)
```

## Paquete commons (`lideris-commoms-microservice`)

Este template depende del paquete compartido que centraliza:

- **Bootstrap**: `bootstrapConfigMicroservice()` configura Fastify plugins, gRPC, Kafka, Swagger, filtros globales
- **Schemas**: Mongoose schemas compartidos (User como ejemplo)
- **Proto definitions**: Contratos `.proto` para gRPC
- **Interceptors**: `StandardResponseInterceptor` para respuestas consistentes
- **Middlewares**: `LoggerMiddleware`, `DecodeJWTMiddleware`, `PerformanceLoggerMiddleware`
- **Filters**: `AllExceptionsFilter` universal (HTTP + RPC + WebSocket)
- **Pipes**: `JoiValidationPipe` para validacion con Joi
- **Utils**: JWT encode/decode, hash passwords, OTP generation
- **Providers**: `RedisProvider` para cache
- **Config helpers**: `registerGRPCConfig()`, `registerKafkaConfig()`, `GRPC_LOADER_OPTIONS`

## Estructura del proyecto

```
src/
  main.ts                                    # Bootstrap con Fastify + gRPC + Kafka + Socket.IO
  app.module.ts                              # Modulo raiz con ConfigModule, Mongoose, Healthcheck
  constants.ts                               # Variables de entorno tipadas
  modules/
    users/
      controllers/
        users.controller.ts                  # REST endpoints (GET, POST, PUT, DELETE)
        users.grpc.controller.ts             # gRPC server (@GrpcMethod)
        users.event.controller.ts            # Kafka consumer (@EventPattern)
      gateways/
        users.gateway.ts                     # Socket.IO gateway (namespace /users)
      providers/
        users.rest.service.ts                # Logica de negocio
        users.grpc-client.service.ts         # Cliente gRPC (llamar otro micro)
        users.kafka.service.ts               # Productor Kafka + broadcast Socket.IO
      users.module.ts                        # Registra Mongoose, gRPC, Kafka, Gateway
      users.mapper.ts                        # Transformacion Mongoose doc -> UserResponse
      joi-validations.ts                     # Schemas Joi para validacion REST
```

---

## Protocolo 1: REST (HTTP/Fastify)

API publica para clientes externos y frontend. Documentada automaticamente con Swagger.

### Archivos clave

- `controllers/users.controller.ts` - Endpoints REST
- `providers/users.rest.service.ts` - Logica de negocio
- `joi-validations.ts` - Validacion de request body

### Endpoints

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `GET` | `/api/v1/users?page=1&limit=10` | Listar usuarios paginados |
| `GET` | `/api/v1/users/:id` | Obtener usuario por ID |
| `POST` | `/api/v1/users` | Crear usuario |
| `PUT` | `/api/v1/users/:id` | Actualizar usuario |
| `DELETE` | `/api/v1/users/:id` | Soft-delete usuario |
| `GET` | `/api/healthcheck` | Health check |

### Ejemplo: crear un endpoint REST

```typescript
// controllers/orders.controller.ts
@ApiTags('Orders')
@Controller({ path: 'orders', version: '1' })
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit ?? '10', 10) || 10));
    return this.ordersService.findAll(pageNum, limitNum);
  }

  @Post()
  @UsePipes(new Pipes.JoiValidationPipe(createOrderSchema))
  async create(@Body() body: CreateOrderDto) {
    return this.ordersService.create(body);
  }
}
```

### Swagger

Disponible en `http://localhost:5500/api/docs` en desarrollo.

---

## Protocolo 2: gRPC (HTTP/2 + Protobuf)

Comunicacion sincrona entre microservicios. Baja latencia, tipado fuerte via Protobuf.

### Archivos clave

- `controllers/users.grpc.controller.ts` - Server (recibe llamadas gRPC)
- `providers/users.grpc-client.service.ts` - Client (llama a otros micros)
- `users.mapper.ts` - Mapeo Mongoose doc -> contrato Protobuf

### Server: exponer metodos gRPC

```typescript
// controllers/users.grpc.controller.ts
@Controller()
export class UsersGrpcController {
  constructor(private readonly usersService: UsersService) {}

  @GrpcMethod('UserService', 'FindById')
  async findById(data: Interfaces.FindByIdRequest): Promise<Interfaces.UserResponse> {
    const user = await this.usersService.findById(data.id);
    return toUserResponse(user);
  }

  @GrpcMethod('UserService', 'FindAll')
  async findAll(data: Interfaces.FindAllRequest): Promise<Interfaces.UserListResponse> {
    const result = await this.usersService.findAll(data.page, data.limit);
    return { users: result.users.map(toUserResponse), total: result.total };
  }
}
```

### Client: llamar a otro microservicio

```typescript
// providers/users.grpc-client.service.ts
@Injectable()
export class UsersGrpcClientService implements OnModuleInit {
  private userService!: Interfaces.IUserGrpcService;

  constructor(@Inject('USER_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.userService = this.client.getService<Interfaces.IUserGrpcService>('UserService');
  }

  findById(id: string) {
    return this.userService.findById({ id });
  }
}
```

### Registrar en el module

```typescript
// users.module.ts
ClientsModule.register([
  registerGRPCConfig('user', 'USER_PACKAGE'),  // proto name, injection token
])
```

El helper `registerGRPCConfig` resuelve automaticamente la URL desde `GRPC_URL_USER` (env var) y usa las `GRPC_LOADER_OPTIONS` unificadas.

### Proto definition

Los `.proto` se definen en el paquete commons (`lideris-commoms-microservice/src/_proto/`).

---

## Protocolo 3: Kafka (Eventos asincronos)

Productor y consumidor de eventos. Desacoplamiento total entre microservicios.

### Archivos clave

- `providers/users.kafka.service.ts` - Productor (emite eventos)
- `controllers/users.event.controller.ts` - Consumidor (recibe eventos)

### Productor: emitir eventos

```typescript
// providers/users.kafka.service.ts
@Injectable()
export class UsersKafkaService implements OnModuleInit {
  constructor(
    @Inject('KAFKA_CLIENT') private kafkaClient: ClientKafka,
    private readonly usersGateway: UsersGateway,
  ) {}

  async onModuleInit() {
    await this.kafkaClient.connect();
  }

  emitUserCreated(user: UserLeanDoc) {
    const payload = toUserResponse(user);
    // Kafka: evento asincrono para otros microservicios
    this.kafkaClient.emit('user.created', { key: payload.id, value: payload });
    // Socket.IO: notificacion en tiempo real para clientes conectados
    this.usersGateway.broadcastUserEvent('user.created', payload);
  }
}
```

### Consumidor: reaccionar a eventos

```typescript
// controllers/users.event.controller.ts
@Controller()
export class UsersEventController {
  @EventPattern('user.created')
  async handleUserCreated(@Payload() data: Interfaces.UserResponse) {
    this.logger.log(`User created event: ${data.id} - ${data.email}`);
    // Logica de reaccion al evento
  }
}
```

### Registrar en el module

```typescript
ClientsModule.register([
  registerKafkaConfig('KAFKA_CLIENT', constants.KAFKA_GROUP_ID),
])
```

### Flujo completo

```
REST POST /users  -->  UsersService.create()
                       |
                       v
                  UsersKafkaService.emitUserCreated()
                       |
                       +--> kafkaClient.emit('user.created')  --> Otros micros (consumer)
                       +--> usersGateway.broadcastUserEvent()  --> Clientes Socket.IO
```

---

## Protocolo 4: Socket.IO (Tiempo real)

Comunicacion bidireccional con clientes via Socket.IO. Corre sobre el mismo puerto HTTP (upgrade), no requiere un puerto adicional.

### Archivos clave

- `gateways/users.gateway.ts` - Gateway Socket.IO (namespace `/users`)

### Conexion desde el cliente

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5500/users');
```

### Escuchar eventos broadcast

Cuando se crea o actualiza un usuario (via REST o gRPC), el gateway emite automaticamente a todos los clientes conectados:

```typescript
socket.on('user.created', (data) => {
  console.log('Nuevo usuario:', data);
  // { id, fullName, userName, email, phone, gender, isActive, createdAt, updatedAt }
});

socket.on('user.updated', (data) => {
  console.log('Usuario actualizado:', data);
});
```

### Suscribirse a un usuario especifico (rooms)

Los clientes pueden unirse a rooms para recibir solo eventos de un usuario concreto:

```typescript
// Suscribirse a eventos del usuario 123
socket.emit('subscribe', { userId: '123' });

// Desuscribirse
socket.emit('unsubscribe', { userId: '123' });
```

### Ping/Pong

```typescript
socket.emit('ping', {}, (response) => {
  console.log(response); // { event: 'pong', data: '2026-04-08T...' }
});
```

### Crear un nuevo gateway

```typescript
// gateways/orders.gateway.ts
@WebSocketGateway({ namespace: '/orders', cors: { origin: '*' } })
export class OrdersGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  afterInit() { /* gateway listo */ }
  handleConnection(client: Socket) { /* cliente conectado */ }
  handleDisconnect(client: Socket) { /* cliente desconectado */ }

  @SubscribeMessage('subscribe')
  handleSubscribe(@ConnectedSocket() client: Socket, @MessageBody() data: { orderId: string }) {
    void client.join(`order:${data.orderId}`);
    return { event: 'subscribed', data: { orderId: data.orderId } };
  }

  broadcastOrderUpdate(orderId: string, payload: OrderResponse) {
    this.server.to(`order:${orderId}`).emit('order.updated', payload);
    this.server.emit('order.updated', payload);
  }
}
```

Registrar en el module como provider:

```typescript
providers: [OrdersService, OrdersGateway],
```

---

## Protocolo 5: TCP (opcional)

Transporte simple de NestJS para comunicacion inter-servicio sin Protobuf. Habilitado en el bootstrap con `enableTCP: true`.

```typescript
// main.ts - ya soportado en bootstrapConfigMicroservice
await bootstrapConfigMicroservice(app, {
  // ...
  enableTCP: true,  // habilita transporte TCP
});
```

Util para comunicacion interna simple donde gRPC seria excesivo.

---

## Variables de entorno

Copiar `.env.example` a `.env` y configurar:

```bash
cp .env.example .env
```

| Variable | Descripcion | Default |
|----------|-------------|---------|
| `PORT` | Puerto HTTP REST + Socket.IO | `5500` |
| `PORT_GRPC` | Puerto servidor gRPC | `50052` |
| `NODE_ENV` | Entorno | `development` |
| `APP_NAME` | Nombre del microservicio | `micro-template` |
| `CORS_ORIGINS` | Origenes CORS (separados por coma) | `''` |
| `MONGO_STRING_CONNECTION` | URI de MongoDB | **requerido** |
| `MONGO_DB_NAME` | Nombre de la base de datos | **requerido** |
| `JWT_SECRET` | Secreto para JWT | **requerido** |
| `REDIS_SERVER_URI` | URI de Redis | `redis://localhost:6379` |
| `REDIS_DB` | Numero de base de datos Redis | `1` |
| `KAFKA_BROKERS` | Brokers de Kafka (separados por coma) | `localhost:9092` |
| `KAFKA_CLIENT_ID` | Client ID para Kafka | `micro-template` |
| `KAFKA_GROUP_ID` | Consumer group de Kafka | `micro-template-group` |
| `GRPC_URL_USER` | URL del gRPC server de users | `localhost:50052` |

## Desarrollo local

### Con Docker Compose (recomendado)

```bash
docker compose up -d
```

Esto levanta: app (hot-reload), MongoDB, Redis, Kafka (KRaft mode).

El `docker-compose.override.yml` expone puertos de mongo/redis/kafka para acceso local.

### Sin Docker

```bash
pnpm install
pnpm start:dev
```

Asegurate de tener MongoDB, Redis y Kafka corriendo localmente.

## URLs disponibles

| Servicio | URL |
|----------|-----|
| REST API | `http://localhost:5500/api/v1/users` |
| Swagger | `http://localhost:5500/api/docs` |
| Healthcheck | `http://localhost:5500/api/healthcheck` |
| Socket.IO | `http://localhost:5500/users` (namespace) |
| gRPC | `localhost:50052` (paquete `user`, servicio `UserService`) |

## Crear un nuevo microservicio

1. Clonar este repositorio
2. Renombrar en `package.json` (`name`, `APP_NAME`)
3. Actualizar `.env.example` con las variables del nuevo micro
4. Renombrar el modulo `users/` por el dominio del micro (ej: `billing/`)
5. Crear schemas propios o usar los del commons
6. Definir un nuevo `.proto` en el commons si necesita gRPC
7. Crear un gateway Socket.IO con el namespace del dominio (ej: `/billing`)
8. Registrar los topics de Kafka que producira/consumira
9. Registrar los clientes gRPC de otros micros que necesite consumir

## Deployment (Kubernetes)

- Cada micro se despliega como un Deployment + Service
- Un solo puerto HTTP sirve REST + Socket.IO (sin puertos adicionales para WS)
- gRPC service discovery: usar el nombre del Service de K8s como URL (ej: `user-service:50052`)
- Kafka brokers: apuntar a los brokers internos del cluster
- Variables de entorno: usar ConfigMaps/Secrets

## Scripts

| Script | Descripcion |
|--------|-------------|
| `pnpm start:dev` | Desarrollo con hot-reload |
| `pnpm build` | Build de produccion |
| `pnpm start:prod` | Ejecutar build de produccion |
| `pnpm test` | Tests unitarios |
| `pnpm test:cov` | Tests con coverage |
| `pnpm test:e2e` | Tests end-to-end |
| `pnpm lint` | Linter con auto-fix |
| `pnpm lint:check` | Linter sin auto-fix (usado en CI) |
