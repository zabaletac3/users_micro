# Crear nuevo schema Mongoose

Crea un schema Mongoose local para este microservicio.

> Los schemas compartidos entre micros van en `lideris-commoms-microservice`.
> Los schemas especificos de este micro van en `src/shared/schemas/` (import barrel: `@shared/schemas`).

## Pasos

### 1. Crear `src/shared/schemas/{prefijo}-{nombre}.schema.ts`

Usar el prefijo del micro (ej: `rcm_` para micro-rcm) como `collection` name.

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type {Nombre}Document = HydratedDocument<{Nombre}>;

@Schema({
  collection: '{prefijo}_{nombre}',
  timestamps: true,
  versionKey: false,
})
export class {Nombre} {
  _id: Types.ObjectId;

  @Prop({ required: true, index: true })
  companyId: string;

  @Prop({ required: true })
  // campos del schema...

  createdAt: Date;
  updatedAt: Date;
}

export const {Nombre}Schema = SchemaFactory.createForClass({Nombre});

// Indices compuestos
{Nombre}Schema.index({ companyId: 1, createdAt: -1 });
```

### 2. Registrar en `src/shared/schemas/index.ts`

Agregar export al barrel file:

```typescript
export { {Nombre}, {Nombre}Schema, {Nombre}Document } from './{prefijo}-{nombre}.schema';
```

Si existe un array de definiciones (`MODEL_DEFINITIONS`), agregarlo tambien.

### 3. Registrar en el modulo que lo consume

En el `*.module.ts` correspondiente:

```typescript
MongooseModule.forFeature([{ name: {Nombre}.name, schema: {Nombre}Schema }])
```

## Convenciones

- Nombre de coleccion: `{prefijo}_{snake_case}` (ej: `rcm_claim`, `rcm_company_config`)
- Clase del schema: PascalCase con prefijo del micro (ej: `RcmClaim`, `RcmCompanyConfig`)
- `timestamps: true` siempre — Mongoose gestiona `createdAt` y `updatedAt`
- `versionKey: false` — no necesitamos `__v`
- Indices en campos frecuentes de busqueda
- Tipos anidados como subdocumentos sin `_id` propio: usar `@Prop({ type: Object })`
- Enums y tipos de soporte compartidos del micro: `src/types/` o equivalente acordado por el equipo (no mezclar con schemas)
