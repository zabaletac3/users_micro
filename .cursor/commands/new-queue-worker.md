# Crear nuevo queue worker BullMQ

Agrega un worker de procesamiento asincrono usando BullMQ.

> Prerequisito: el `QueueModule` debe existir con `BullmqService` como provider global.

## Pasos

### 1. Definir la constante del queue name

En el service o en un archivo de constantes del modulo:

```typescript
const MI_QUEUE_NAME = 'rcm-mi-proceso';
```

Convencion de naming: `{prefijo-micro}-{accion}` en kebab-case.

### 2. Definir el tipo de datos del job

```typescript
interface MiProcesoJobData {
  companyId: string;
  entityId: string;
  // datos necesarios para el worker
}
```

### 3. Crear el worker en el service

Usar `OnModuleInit` para registrar el worker al iniciar:

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';

import { BullmqService } from '../../queue/providers/bullmq.service';

@Injectable()
export class MiService implements OnModuleInit {
  constructor(private readonly bullmqService: BullmqService) {}

  async onModuleInit(): Promise<void> {
    this.bullmqService.createWorker<MiProcesoJobData>(
      MI_QUEUE_NAME,
      async (jobData) => {
        await this.processJob(jobData);
      },
      { concurrency: 3 },
    );
  }

  private async processJob(data: MiProcesoJobData): Promise<void> {
    // logica del worker
  }
}
```

### 4. Encolar jobs desde el service o controller

```typescript
async enqueue(entityId: string, companyId: string): Promise<{ queued: boolean }> {
  const queue = this.bullmqService.getQueue(MI_QUEUE_NAME);

  await queue.add(
    `mi-proceso-${entityId}`,
    { companyId, entityId } satisfies MiProcesoJobData,
    { removeOnComplete: true, removeOnFail: false },
  );

  return { queued: true };
}
```

## Opciones del worker

| Opcion | Uso |
|--------|-----|
| `concurrency: N` | Procesar N jobs en paralelo |
| `limiter: { max: N, duration: ms }` | Rate limiting (ej: APIs externas) |

## Reglas

- El `QueueModule` debe estar importado (es global, asi que no necesita import explicito)
- Tipar siempre el `JobData` — NUNCA usar `any`
- Usar `satisfies` al encolar para validar el tipo en compile time
- `removeOnComplete: true` para no acumular jobs completados
- `removeOnFail: false` para poder inspeccionar fallos
