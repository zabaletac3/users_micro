# Revisar contexto del proyecto

Lee los siguientes archivos en orden para entener el estado actual del microservicio:

1. `package.json` — nombre, dependencias, scripts
2. `src/app.module.ts` — modulos registrados, variables de entorno (Joi schema)
3. `src/constants.ts` — variables de entorno disponibles en runtime
4. `src/main.ts` — bootstrap config (apiPrefix, swagger, cors)

## Despues de leerlos, confirma:

- Que modulos existen en `src/modules/`
- Que schemas Mongoose existen (locales en `src/shared/schemas/` o desde `lideris-commoms-microservice`)
- Que variables de entorno estan configuradas
- Que integraciones externas hay (queues, APIs, gRPC, Kafka)

## Estructura esperada de un modulo

```
src/modules/{nombre}/
├── controllers/
│   └── {nombre}.controller.ts        # REST controller
├── providers/
│   ├── {nombre}.service.ts            # Logica de negocio
│   └── {nombre}.repository.ts         # Acceso a datos (opcional)
├── gateways/                          # Socket.IO (opcional)
│   └── {nombre}.gateway.ts
├── {nombre}.module.ts                 # NestJS module
├── {nombre}.types.ts                  # Interfaces y tipos del modulo
└── joi-validations.ts                 # Schemas Joi para body/query
```

## Convenciones criticas

- Paginacion: `skip` + `limit` (NO `page` + `limit`)
- Validacion body: `@UsePipes(new Pipes.JoiValidationPipe(schema))`
- Validacion query: `@UsePipes(new JoiQueryValidationPipe(schema))` con `@Query()` DTO tipado
- CompanyId: `@Decorators.CurrentCompanyId()` de `lideris-commoms-microservice`
- Schemas compartidos: `Schemas.User`, `Schemas.UserSchema` de `lideris-commoms-microservice`
- NO usar `any` — preferir `unknown` con type guards
- NO usar `class-validator` — usar Joi
