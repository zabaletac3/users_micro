# Crear nueva integracion externa

Crea un adaptador de integracion con un servicio externo siguiendo el patron mock/real.

## Estructura del modulo de integracion

```
src/modules/{nombre}-integration/
├── providers/
│   ├── {nombre}-client.service.ts      # Cliente HTTP real
│   ├── mock-{nombre}.service.ts        # Mock para desarrollo/testing
│   └── {nombre}-poller.service.ts      # Cron job (opcional)
├── {nombre}-integration.module.ts
├── {nombre}.constants.ts               # Tokens y nombres de queue
└── {nombre}.types.ts                   # Interfaces del contrato
```

## Pasos

### 1. Definir tipos e interface del contrato

```typescript
// {nombre}.types.ts
export interface {Nombre}ClientConfig {
  baseUrl: string;
  apiKey: string;
}

export interface {Nombre}ClientInterface {
  getData(config: {Nombre}ClientConfig, id: string): Promise<Record<string, unknown>>;
}
```

### 2. Definir constantes y tokens

```typescript
// {nombre}.constants.ts
export const {NOMBRE}_CLIENT_TOKEN = '{NOMBRE}_CLIENT_TOKEN';
```

### 3. Crear el cliente real

```typescript
// providers/{nombre}-client.service.ts
import { Injectable } from '@nestjs/common';
import { {Nombre}ClientConfig, {Nombre}ClientInterface } from '../{nombre}.types';

@Injectable()
export class {Nombre}ClientService implements {Nombre}ClientInterface {
  async getData(config: {Nombre}ClientConfig, id: string): Promise<Record<string, unknown>> {
    const response = await fetch(`${config.baseUrl}/resource/${id}`, {
      headers: { Authorization: `Bearer ${config.apiKey}` },
    });
    return (await response.json()) as Record<string, unknown>;
  }
}
```

### 4. Crear el mock

```typescript
// providers/mock-{nombre}.service.ts
import { Injectable } from '@nestjs/common';
import { {Nombre}ClientConfig, {Nombre}ClientInterface } from '../{nombre}.types';

@Injectable()
export class Mock{Nombre}Service implements {Nombre}ClientInterface {
  async getData(_config: {Nombre}ClientConfig, id: string): Promise<Record<string, unknown>> {
    return { id, mockData: true, generatedAt: new Date().toISOString() };
  }
}
```

### 5. Crear el modulo con factory provider

```typescript
// {nombre}-integration.module.ts
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { {NOMBRE}_CLIENT_TOKEN } from './{nombre}.constants';
import { {Nombre}ClientService } from './providers/{nombre}-client.service';
import { Mock{Nombre}Service } from './providers/mock-{nombre}.service';

@Module({
  providers: [
    {Nombre}ClientService,
    Mock{Nombre}Service,
    {
      provide: {NOMBRE}_CLIENT_TOKEN,
      inject: [ConfigService, {Nombre}ClientService, Mock{Nombre}Service],
      useFactory: (
        config: ConfigService,
        real: {Nombre}ClientService,
        mock: Mock{Nombre}Service,
      ) => {
        const mode = (config.get<string>('{NOMBRE}_MODE') ?? 'mock').toLowerCase();
        return mode === 'real' ? real : mock;
      },
    },
  ],
  exports: [{NOMBRE}_CLIENT_TOKEN],
})
export class {Nombre}IntegrationModule {}
```

### 6. Consumir en otro modulo

```typescript
import { Inject } from '@nestjs/common';
import { {NOMBRE}_CLIENT_TOKEN } from '../{nombre}-integration/{nombre}.constants';
import { {Nombre}ClientInterface } from '../{nombre}-integration/{nombre}.types';

@Injectable()
export class MiService {
  constructor(
    @Inject({NOMBRE}_CLIENT_TOKEN)
    private readonly {nombre}Client: {Nombre}ClientInterface,
  ) {}
}
```

### 7. Registrar variables de entorno

En `app.module.ts` agregar al `Joi.object`:
```typescript
{NOMBRE}_MODE: Joi.string().valid('mock', 'real').default('mock'),
{NOMBRE}_API_URL: Joi.string().allow('').default(''),
{NOMBRE}_API_KEY: Joi.string().allow('').default(''),
```

En `constants.ts`:
```typescript
{NOMBRE}_MODE: process.env.{NOMBRE}_MODE || 'mock',
{NOMBRE}_API_URL: process.env.{NOMBRE}_API_URL || '',
{NOMBRE}_API_KEY: process.env.{NOMBRE}_API_KEY || '',
```

## Reglas

- SIEMPRE crear mock + real — el mock permite desarrollar sin dependencias externas
- La seleccion mock/real se controla con variable de entorno `{NOMBRE}_MODE`
- El token de inyeccion es un string constante, no un Symbol
- La interface del contrato DEBE ser identica entre mock y real
- Registrar el modulo en `app.module.ts`
