# Patient Communication Record — Implementation Spec

> **Status:** Ready to implement  
> **Feature branch:** `feat/patient-communication`  
> **Base commit with scaffolding:** `45eabe213b37b013059ab6e0b68e6aab7d1f1391`

---

## 1. Overview

This feature adds a **Communication Record** sub-resource to patients.
Any staff member can log a communication event for a patient. The event type (`requirementType`) drives which extra fields are required. The list of records is visible in the patient's **"Registro de comunicaciones"** tab in the UI.

The four supported requirement types are:

| Value (enum) | UI label |
|---|---|
| `CLINICAL_RECORD` | Historia clínica |
| `REDIRECTION` | Redirección |
| `PATIENT_INFORMATION` | Información del paciente |
| `PQRS` | PQRS |

---

## 2. Conventions — MUST follow in every file

- All code, comments, variable names, class names, and string literals must be in **English**.
- Follow the existing service pattern: one `@Injectable()` class per file, one public `execute()` method.
- DTOs live in `src/shared/dto/`. Use `@ApiProperty` for required fields and `@ApiPropertyOptional` for optional fields (import from `@nestjs/swagger`). Use `class` declarations (not `interface`).
- Swagger doc decorators live in `src/modules/patients/docs/`. Each group of endpoints gets its own `doc-*.decorator.ts` file that exports named functions using `applyDecorators()`.
- Joi validation is a single `joi-validation.ts` file at `src/modules/patients/joi-validation.ts` — append new named exports there, do **not** create a separate file.
- Import path aliases: `@shared/dto`, `@shared/constants`, `lideris-commoms-microservice`.
- All Mongoose `ObjectId` comparisons must use `new Types.ObjectId(id)` after calling `Types.ObjectId.isValid(id)` first and throwing `BadRequestException` if invalid.
- `companyId` is **always** extracted from auth context via `@Decorators.CurrentCompanyId()` — never accepted in the request body.
- `performedBy` (userId) is extracted from `@Decorators.CurrentAuthzContext()` → `authzContext.principal.userId`.

---

## 3. Files Already Created (scaffolding)

The following files were already pushed and should **not** be created from scratch — only **referenced or modified** as indicated below.

```
src/shared/dto/patient-communication.dto.ts          ← DTOs with ApiProperty decorators
src/modules/patients/providers/communication/
  ├── communication.enums.ts                         ← all enums
  ├── create-communication.dto.ts                    ← barrel re-export from @shared/dto
  ├── communication.joi-validation.ts                ← Joi schema (standalone, not yet integrated)
  ├── create-communication.service.ts                ← create logic
  ├── list-communications.service.ts                 ← list + pagination
  ├── find-communication-by-id.service.ts            ← single record fetch
  ├── update-communication-status.service.ts         ← status update
  └── index.ts                                       ← barrel export
```

---

## 4. Tasks Remaining

### TASK 1 — Add `PatientCommunication` schema to commons package

> **Location:** External package `lideris-commoms-microservice` (separate repo).  
> **This task must be done before any other task that injects the model.**

#### 4.1 Mongoose Schema fields

Create `PatientCommunicationSchema` with the following fields:

```ts
// Required on ALL records
patientId:            ObjectId  // ref: User
companyId:            ObjectId  // ref: Company
applicantRelationship: string   // enum ApplicantRelationshipEnum
applicantName:        string
communicationChannel: string    // enum CommunicationChannelEnum
requirementType:      string    // enum RequirementTypeEnum
status:               string    // enum CommunicationStatusEnum, default: 'PENDING'
createdBy:            ObjectId  // ref: User
createdAt:            Date      // default: Date.now

// Optional on ALL records
phone:                string?
email:                string?
observations:         string?
updatedBy:            ObjectId?
updatedAt:            Date?

// Conditional — only present when requirementType === CLINICAL_RECORD
communicationMedium:  string?   // enum CommunicationMediumEnum
clinicalRecordIds:    ObjectId[]?

// Conditional — only present when requirementType === REDIRECTION
destinationArea:      string?
redirectionReason:    string?

// Conditional — only present when requirementType === PATIENT_INFORMATION
requestReason:        string?
description:          string?

// Conditional — only present when requirementType === PQRS
pqrsType:             string?
relatedArea:          string?
subject:              string?
caseDescription:      string?
```

Export from commons:
- `PatientCommunication` (class)
- `PatientCommunicationDocument` (type = `PatientCommunication & Document`)
- `PatientCommunicationSchema` (Mongoose schema)

---

### TASK 2 — Joi validation: integrate into `joi-validation.ts`

**File:** `src/modules/patients/joi-validation.ts`  
**Action:** Append the following two named exports at the bottom of the existing file.

The validation logic is already written in `src/modules/patients/providers/communication/communication.joi-validation.ts`.  
Copy/move it into `joi-validation.ts` as:

```ts
export const CreateCommunicationSchema = Joi.object({
  // base fields (all required unless marked)
  applicantRelationship: Joi.string()
    .valid(...Object.values(ApplicantRelationshipEnum)).required(),
  applicantName:         Joi.string().required(),
  communicationChannel:  Joi.string()
    .valid(...Object.values(CommunicationChannelEnum)).required(),
  requirementType:       Joi.string()
    .valid(...Object.values(RequirementTypeEnum)).required(),
  phone:                 Joi.string().optional(),
  email:                 Joi.string().email().optional(),

  // CLINICAL_RECORD branch
  communicationMedium: Joi.when('requirementType', {
    is:        RequirementTypeEnum.CLINICAL_RECORD,
    then:      Joi.string().valid(...Object.values(CommunicationMediumEnum)).required(),
    otherwise: Joi.forbidden(),
  }),
  clinicalRecordIds: Joi.when('requirementType', {
    is:        RequirementTypeEnum.CLINICAL_RECORD,
    then:      Joi.array().items(Joi.string()).min(1).required(),
    otherwise: Joi.forbidden(),
  }),

  // REDIRECTION branch
  destinationArea: Joi.when('requirementType', {
    is:        RequirementTypeEnum.REDIRECTION,
    then:      Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),
  redirectionReason: Joi.when('requirementType', {
    is:        RequirementTypeEnum.REDIRECTION,
    then:      Joi.string().optional(),
    otherwise: Joi.forbidden(),
  }),

  // PATIENT_INFORMATION branch
  requestReason: Joi.when('requirementType', {
    is:        RequirementTypeEnum.PATIENT_INFORMATION,
    then:      Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),
  description: Joi.when('requirementType', {
    is:        RequirementTypeEnum.PATIENT_INFORMATION,
    then:      Joi.string().optional(),
    otherwise: Joi.forbidden(),
  }),

  // PQRS branch
  pqrsType: Joi.when('requirementType', {
    is:        RequirementTypeEnum.PQRS,
    then:      Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),
  relatedArea: Joi.when('requirementType', {
    is:        RequirementTypeEnum.PQRS,
    then:      Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),
  subject: Joi.when('requirementType', {
    is:        RequirementTypeEnum.PQRS,
    then:      Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),
  caseDescription: Joi.when('requirementType', {
    is:        RequirementTypeEnum.PQRS,
    then:      Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),
});

export const UpdateCommunicationStatusSchema = Joi.object({
  status:       Joi.string().valid(...Object.values(CommunicationStatusEnum)).required(),
  observations: Joi.string().optional(),
});
```

Import the enums at the top of `joi-validation.ts`:
```ts
import {
  ApplicantRelationshipEnum,
  CommunicationChannelEnum,
  CommunicationMediumEnum,
  CommunicationStatusEnum,
  RequirementTypeEnum,
} from './providers/communication/communication.enums';
```

---

### TASK 3 — Response DTO

**File to create:** `src/shared/dto/patient-communication-response.dto.ts`

Follow the exact same pattern as `src/shared/dto/judicial-authority-notice-response.dto.ts`.

```ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ApplicantRelationshipEnum,
  CommunicationChannelEnum,
  CommunicationMediumEnum,
  CommunicationStatusEnum,
  RequirementTypeEnum,
} from '../modules/patients/providers/communication/communication.enums';

export class PatientCommunicationResponseDto {
  @ApiProperty({ type: String }) id: string;
  @ApiProperty({ type: String }) patientId: string;
  @ApiProperty({ type: String }) companyId: string;
  @ApiProperty({ enum: RequirementTypeEnum }) requirementType: RequirementTypeEnum;
  @ApiProperty({ enum: ApplicantRelationshipEnum }) applicantRelationship: ApplicantRelationshipEnum;
  @ApiProperty({ type: String }) applicantName: string;
  @ApiProperty({ enum: CommunicationChannelEnum }) communicationChannel: CommunicationChannelEnum;
  @ApiProperty({ enum: CommunicationStatusEnum }) status: CommunicationStatusEnum;
  @ApiProperty({ type: String }) createdBy: string;
  @ApiProperty({ type: Date }) createdAt: Date;
  @ApiPropertyOptional({ type: String }) phone?: string;
  @ApiPropertyOptional({ type: String }) email?: string;
  @ApiPropertyOptional({ type: String }) observations?: string;
  @ApiPropertyOptional({ type: String }) updatedBy?: string;
  @ApiPropertyOptional({ type: Date }) updatedAt?: Date;
  // CLINICAL_RECORD
  @ApiPropertyOptional({ enum: CommunicationMediumEnum }) communicationMedium?: CommunicationMediumEnum;
  @ApiPropertyOptional({ type: [String] }) clinicalRecordIds?: string[];
  // REDIRECTION
  @ApiPropertyOptional({ type: String }) destinationArea?: string;
  @ApiPropertyOptional({ type: String }) redirectionReason?: string;
  // PATIENT_INFORMATION
  @ApiPropertyOptional({ type: String }) requestReason?: string;
  @ApiPropertyOptional({ type: String }) description?: string;
  // PQRS
  @ApiPropertyOptional({ type: String }) pqrsType?: string;
  @ApiPropertyOptional({ type: String }) relatedArea?: string;
  @ApiPropertyOptional({ type: String }) subject?: string;
  @ApiPropertyOptional({ type: String }) caseDescription?: string;
}

export class PatientCommunicationListResponseDto {
  @ApiProperty({ type: [PatientCommunicationResponseDto] })
  data: PatientCommunicationResponseDto[];

  @ApiProperty({ type: Number }) total: number;
  @ApiProperty({ type: Number }) page: number;
  @ApiProperty({ type: Number }) limit: number;
}
```

Also **export it from** `src/shared/dto/index.ts` by appending:
```ts
export * from './patient-communication.dto';
export * from './patient-communication-response.dto';
```

---

### TASK 4 — Swagger doc decorator

**File to create:** `src/modules/patients/docs/doc-patient-communication.decorator.ts`

Follow the pattern in `doc-judicial-authority-notice.decorator.ts` exactly.

```ts
import { applyDecorators } from '@nestjs/common';
import {
  ApiBody, ApiCreatedResponse, ApiOkResponse,
  ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags,
} from '@nestjs/swagger';
import {
  PatientCommunicationResponseDto,
  PatientCommunicationListResponseDto,
} from '@shared/dto/patient-communication-response.dto';
import {
  CreateClinicalRecordCommunicationDto,
  CreatePqrsCommunicationDto,
  UpdateCommunicationStatusDto,
} from '@shared/dto/patient-communication.dto';
import { ApiCompanyIdFromAuthContext } from './doc-company-context.decorator';

export function ApiListPatientCommunications() {
  return applyDecorators(
    ApiCompanyIdFromAuthContext(),
    ApiTags('patients', 'communications'),
    ApiOperation({
      summary: 'List patient communication records',
      description: 'Returns paginated communication records for the given patient and company.',
    }),
    ApiParam({ name: 'id', description: 'Patient ID' }),
    ApiQuery({ name: 'page',   required: false, type: Number }),
    ApiQuery({ name: 'limit',  required: false, type: Number }),
    ApiQuery({ name: 'search', required: false, type: String }),
    ApiOkResponse({ type: PatientCommunicationListResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid patient or company ID.' }),
  );
}

export function ApiGetPatientCommunicationById() {
  return applyDecorators(
    ApiCompanyIdFromAuthContext(),
    ApiTags('patients', 'communications'),
    ApiOperation({ summary: 'Get a communication record by ID' }),
    ApiParam({ name: 'id',              description: 'Patient ID' }),
    ApiParam({ name: 'communicationId', description: 'Communication record ID' }),
    ApiOkResponse({ type: PatientCommunicationResponseDto }),
    ApiResponse({ status: 404, description: 'Record not found.' }),
  );
}

export function ApiCreatePatientCommunication() {
  return applyDecorators(
    ApiCompanyIdFromAuthContext(),
    ApiTags('patients', 'communications'),
    ApiOperation({
      summary: 'Create a patient communication record',
      description:
        'The body shape changes based on `requirementType`. ' +
        'See discriminated union in patient-communication.dto.ts. ' +
        'Example shown is for PQRS; other types follow same base fields.',
    }),
    ApiParam({ name: 'id', description: 'Patient ID' }),
    ApiBody({ type: CreatePqrsCommunicationDto }),
    ApiCreatedResponse({ type: PatientCommunicationResponseDto }),
    ApiResponse({ status: 400, description: 'Validation error or invalid ID.' }),
    ApiResponse({ status: 404, description: 'Patient not found.' }),
  );
}

export function ApiUpdatePatientCommunicationStatus() {
  return applyDecorators(
    ApiCompanyIdFromAuthContext(),
    ApiTags('patients', 'communications'),
    ApiOperation({ summary: 'Update communication record status' }),
    ApiParam({ name: 'id',              description: 'Patient ID' }),
    ApiParam({ name: 'communicationId', description: 'Communication record ID' }),
    ApiBody({ type: UpdateCommunicationStatusDto }),
    ApiOkResponse({ type: PatientCommunicationResponseDto }),
    ApiResponse({ status: 404, description: 'Record not found.' }),
  );
}
```

Then **add the exports** to `src/modules/patients/docs/index.ts`:
```ts
export * from './doc-patient-communication.decorator';
```

---

### TASK 5 — Register model in `patients.module.ts`

**File:** `src/modules/patients/patients.module.ts`

#### 5.1 Add to `MongooseModule.forFeature([...])` array:
```ts
{ name: Schemas.PatientCommunication.name, schema: Schemas.PatientCommunicationSchema },
```

#### 5.2 Add imports at the top:
```ts
import * as COMMUNICATION_SERVICES from './providers/communication';
```

#### 5.3 Add to `providers` array:
```ts
COMMUNICATION_SERVICES.CreateCommunicationService,
COMMUNICATION_SERVICES.ListCommunicationsService,
COMMUNICATION_SERVICES.FindCommunicationByIdService,
COMMUNICATION_SERVICES.UpdateCommunicationStatusService,
```

Final `patients.module.ts` providers block should look like:
```ts
providers: [
  PatientStreamStore,
  PatientStreamService,
  PatientStreamGateway,
  ...Object.values(PATIENT_SERVICES),
  CreatePatientSoatCaseService,
  ListPatientSoatCasesService,
  FindPatientSoatCaseByIdService,
  UpdatePatientSoatCaseService,
  CreateJudicialAuthorityNoticeService,
  ListJudicialAuthorityNoticesService,
  FindJudicialAuthorityNoticeByIdService,
  UpdateJudicialAuthorityNoticeService,
  COMMUNICATION_SERVICES.CreateCommunicationService,
  COMMUNICATION_SERVICES.ListCommunicationsService,
  COMMUNICATION_SERVICES.FindCommunicationByIdService,
  COMMUNICATION_SERVICES.UpdateCommunicationStatusService,
],
```

---

### TASK 6 — Controller endpoints

**File:** `src/modules/patients/controllers/patients.controller.ts`

#### 6.1 Add constructor injections (inside `constructor(...)`):
```ts
private readonly createCommunicationService:       COMMUNICATION_SERVICES.CreateCommunicationService,
private readonly listCommunicationsService:         COMMUNICATION_SERVICES.ListCommunicationsService,
private readonly findCommunicationByIdService:      COMMUNICATION_SERVICES.FindCommunicationByIdService,
private readonly updateCommunicationStatusService:  COMMUNICATION_SERVICES.UpdateCommunicationStatusService,
```

#### 6.2 Add import at the top of the file:
```ts
import * as COMMUNICATION_SERVICES from '../providers/communication';
```

#### 6.3 Add four route handlers — exact signatures:

```ts
// ── LIST ──────────────────────────────────────────────────────────────────
@Version('1')
@DOCS.ApiListPatientCommunications()
@Get(':id/communications')
async listPatientCommunications(
  @Param('id') id: string,
  @Decorators.CurrentCompanyId() companyId: string,
  @Query('page')   page?: number,
  @Query('limit')  limit?: number,
  @Query('search') search?: string,
) {
  return this.listCommunicationsService.execute({
    patientId: id,
    companyId,
    page:  page  ? Number(page)  : 1,
    limit: limit ? Number(limit) : 100,
    search,
  });
}

// ── GET BY ID ─────────────────────────────────────────────────────────────
@Version('1')
@DOCS.ApiGetPatientCommunicationById()
@Get(':id/communications/:communicationId')
async getPatientCommunicationById(
  @Param('id')              id: string,
  @Param('communicationId') communicationId: string,
  @Decorators.CurrentCompanyId() companyId: string,
) {
  return this.findCommunicationByIdService.execute(communicationId, id, companyId);
}

// ── CREATE ────────────────────────────────────────────────────────────────
@Version('1')
@DOCS.ApiCreatePatientCommunication()
@HttpCode(HttpStatus.CREATED)
@UsePipes(new Pipes.JoiValidationPipe(JOI_SCHEMAS.CreateCommunicationSchema))
@Post(':id/communications')
async createPatientCommunication(
  @Param('id') id: string,
  @Decorators.CurrentCompanyId() companyId: string,
  @Body() dto: PATIENT_DTOS.CreateCommunicationDto,
  @Decorators.CurrentAuthzContext()
  authzContext: { principal: { userId: string } },
) {
  const { userId } = authzContext.principal;
  if (!userId) throw new UnauthorizedException(I18nKeys.COMMON_ERROR_INVALID_USER_CONTEXT);
  return this.createCommunicationService.execute(id, companyId, dto, userId);
}

// ── UPDATE STATUS ─────────────────────────────────────────────────────────
@Version('1')
@DOCS.ApiUpdatePatientCommunicationStatus()
@UsePipes(new Pipes.JoiValidationPipe(JOI_SCHEMAS.UpdateCommunicationStatusSchema))
@Patch(':id/communications/:communicationId/status')
async updatePatientCommunicationStatus(
  @Param('id')              id: string,
  @Param('communicationId') communicationId: string,
  @Decorators.CurrentCompanyId() companyId: string,
  @Body() dto: PATIENT_DTOS.UpdateCommunicationStatusDto,
  @Decorators.CurrentAuthzContext()
  authzContext: { principal: { userId: string } },
) {
  const { userId } = authzContext.principal;
  if (!userId) throw new UnauthorizedException(I18nKeys.COMMON_ERROR_INVALID_USER_CONTEXT);
  return this.updateCommunicationStatusService.execute(
    communicationId, id, companyId, dto, userId,
  );
}
```

> **Placement:** Insert all four handlers **before** `@Get(':id')` (the `findPatientById` handler), so the specific sub-routes are matched first.

#### 6.4 Add `CreateCommunicationDto` and `UpdateCommunicationStatusDto` to `PATIENT_DTOS` re-exports
These are already exported from `src/shared/dto/index.ts` (TASK 3), so `* as PATIENT_DTOS from '@shared/dto'` will pick them up automatically — no extra import needed.

---

### TASK 7 — Delete the standalone Joi validation file

**File to DELETE:** `src/modules/patients/providers/communication/communication.joi-validation.ts`

Reason: Its contents were migrated to `joi-validation.ts` in TASK 2. Keeping it would cause confusion.

---

## 5. Endpoint Summary

| Method | URL | Auth | Description |
|---|---|---|---|
| `GET` | `/v1/patients/:id/communications` | Bearer + companyId | List records (paginated) |
| `GET` | `/v1/patients/:id/communications/:communicationId` | Bearer + companyId | Get single record |
| `POST` | `/v1/patients/:id/communications` | Bearer + companyId | Create record |
| `PATCH` | `/v1/patients/:id/communications/:communicationId/status` | Bearer + companyId | Update status |

---

## 6. Business Rules

1. `patientId` + `companyId` pair must exist in `User.companies` — throw `NotFoundException('PATIENT_NOT_FOUND')` otherwise.
2. `requirementType === CLINICAL_RECORD` → `communicationMedium` and `clinicalRecordIds` (min 1) are **required**.
3. `requirementType === REDIRECTION` → `destinationArea` is **required**.
4. `requirementType === PATIENT_INFORMATION` → `requestReason` is **required**.
5. `requirementType === PQRS` → `pqrsType`, `relatedArea`, `subject`, `caseDescription` are all **required**.
6. Fields of other types are **forbidden** (Joi `.forbidden()`) to avoid dirty data.
7. Initial `status` is always `PENDING`. The only way to change it is via the `PATCH .../status` endpoint.
8. `companyId` is **never** in the request body — always from auth context.

---

## 7. Enum Values Reference

```ts
// communication.enums.ts (already in repo)
enum RequirementTypeEnum    { CLINICAL_RECORD, REDIRECTION, PATIENT_INFORMATION, PQRS }
enum CommunicationStatusEnum { PENDING, COMPLETED, ESCALATED }
enum CommunicationChannelEnum { PHONE, EMAIL, IN_PERSON, VIRTUAL }
enum ApplicantRelationshipEnum { SELF, PARENT, SPOUSE, GUARDIAN, OTHER }
enum CommunicationMediumEnum { EMAIL, PHYSICAL, DIGITAL }
```

---

## 8. Dependency Order

Follow this order strictly to avoid compilation errors:

```
1. commons package  → PatientCommunication schema + types
2. TASK 2           → joi-validation.ts (no model dependency)
3. TASK 3           → response DTO + shared/dto/index.ts
4. TASK 4           → swagger doc decorator + docs/index.ts
5. TASK 5           → patients.module.ts (needs schema from step 1)
6. TASK 6           → patients.controller.ts (needs all of the above)
7. TASK 7           → delete standalone joi file
```

---

## 9. Files NOT to touch

- Any file inside `src/modules/patients/providers/patients/`
- `src/modules/patients/providers/soat-case/`
- `src/modules/patients/providers/judicial-notice/`
- `src/shared/dto/judicial-authority-notice*.ts`
- `src/shared/dto/patient-soat-case*.ts`
