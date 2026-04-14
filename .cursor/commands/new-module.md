# Crear nuevo modulo NestJS

Crea un modulo siguiendo estrictamente la estructura del micro-template.

## Pasos

### 1. Crear la estructura de carpetas

```
src/modules/{nombre}/
├── controllers/
│   └── {nombre}.controller.ts
├── providers/
│   └── {nombre}.service.ts
├── {nombre}.module.ts
├── {nombre}.types.ts
└── joi-validations.ts
```

### 2. Crear `{nombre}.types.ts`

Define las interfaces del modulo. Si tiene listado, extender de `PaginationDto`:

```typescript
import { PaginationDto } from '../../common/dto/pagination.dto';

export interface {Nombre}Filter extends PaginationDto {
  companyId: string;
  // filtros especificos del modulo
}
```

### 3. Crear `joi-validations.ts`

Schemas Joi para validacion de body y query:

```typescript
import * as Joi from 'joi';

export interface List{Nombre}QueryDto {
  skip: number;
  limit: number;
  // filtros especificos
}

export const list{Nombre}QuerySchema = Joi.object<List{Nombre}QueryDto>({
  skip: Joi.number().integer().min(0).default(0),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export const create{Nombre}Schema = Joi.object({
  // campos requeridos para crear
});
```

### 4. Crear `controllers/{nombre}.controller.ts`

```typescript
import { Controller, Get, Post, Body, Query, UsePipes } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Decorators, Pipes } from 'lideris-commoms-microservice';

import { JoiQueryValidationPipe } from '../../../common/pipes/joi-query-validation.pipe';

import { {Nombre}Service } from '../providers/{nombre}.service';
import { List{Nombre}QueryDto, list{Nombre}QuerySchema, create{Nombre}Schema } from '../joi-validations';

@ApiTags('{Nombre}')
@Controller({ path: '{nombre}', version: '1' })
export class {Nombre}Controller {
  constructor(private readonly {nombre}Service: {Nombre}Service) {}

  @Get()
  @UsePipes(new JoiQueryValidationPipe(list{Nombre}QuerySchema))
  @ApiOperation({ summary: 'List with pagination' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async list(
    @Decorators.CurrentCompanyId() companyId: string,
    @Query() query: List{Nombre}QueryDto,
  ) {
    return this.{nombre}Service.list({ companyId, ...query });
  }

  @Post()
  @UsePipes(new Pipes.JoiValidationPipe(create{Nombre}Schema))
  @ApiOperation({ summary: 'Create' })
  async create(
    @Decorators.CurrentCompanyId() companyId: string,
    @Body() body: { /* campos tipados */ },
  ) {
    return this.{nombre}Service.create(companyId, body);
  }
}
```

### 5. Crear `providers/{nombre}.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { normalizePagination, PaginatedResult } from '../../../common/dto/pagination.dto';

@Injectable()
export class {Nombre}Service {
  constructor(
    @InjectModel(/* Schema.name */)
    private readonly model: Model</* DocumentType */>,
  ) {}

  async list(filter: {Nombre}Filter): Promise<PaginatedResult</* Type */>> {
    const { skip, limit } = normalizePagination(filter);
    const where: Record<string, unknown> = { /* filtros */ };

    const [data, total] = await Promise.all([
      this.model.find(where).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
      this.model.countDocuments(where).exec(),
    ]);

    return { data, total, skip, limit };
  }
}
```

### 6. Crear `{nombre}.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { {Nombre}Controller } from './controllers/{nombre}.controller';
import { {Nombre}Service } from './providers/{nombre}.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: /* Schema */.name, schema: /* SchemaObj */ }]),
  ],
  controllers: [{Nombre}Controller],
  providers: [{Nombre}Service],
  exports: [{Nombre}Service],
})
export class {Nombre}Module {}
```

### 7. Registrar en `app.module.ts`

Agregar el import y registrarlo en el array `imports` del `@Module`.

## Reglas NO negociables

- Archivos siempre en ingles, kebab-case
- Paginacion: `skip` + `limit` — NUNCA `page`
- Validacion con Joi — NUNCA `class-validator`
- CompanyId desde `Decorators.CurrentCompanyId()` — NUNCA header manual
- Controllers: solo presentacion, CERO logica de negocio
- Services/Providers: logica de negocio y acceso a datos
- NO inventar componentes — buscar primero en el proyecto y en `lideris-commoms-microservice`
