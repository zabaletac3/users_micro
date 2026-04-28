import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreatePatientDto } from '@shared/dtos/patients/create-patient.dto';
import { User } from '@shared/schemas/user.schema';

export function ApiCreatePatient() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a patient',
      description: `Creates a new patient linked to a company (IPS).

Supports three registration flows controlled by **documentType**:

**Identified patient** (any documentType except \`NN\` or \`RN\`):
- All personal fields are required (name, lastName, email, bloodType, etc.)
- Affiliation (EPS/regime) is required
- Creates a \`UserAffiliation\` record atomically in the same transaction

**Unidentified patient** (\`documentType = NN\`):
- Only companyId and documentType are required
- Personal fields (name, email, bloodType, etc.) are optional
- Affiliation is optional — can be linked later
- Name is auto-set to \`NN Masculino\`, \`NN Femenino\`, or \`NN\` based on gender
- Serial is auto-generated as \`NN-XXXX\`
- NN-specific fields available: entryCondition, approximateAge, physicalTraits, belongings, companion, entryInfo

**Newborn** (\`documentType = RN\`):
- \`motherId\` is required — must be an existing patient of the same company
- Affiliation (EPS/regime) is required
- Personal fields (name, email, bloodType, etc.) are optional
- Name is auto-set to \`RN Hijo/Hija de {mother name} {CC}{documentNumber}\`
- Serial is auto-generated as \`RN-XXXX\`
- Newborn-specific fields available: birthPlace, birthAddress
- Creates a \`UserAffiliation\` record atomically in the same transaction`,
    }),
    ApiBody({ type: CreatePatientDto }),
    ApiResponse({
      status: 201,
      description: 'Patient created successfully.',
      type: User,
    }),
    ApiResponse({
      status: 404,
      description: `Not Found. Error keys:

| Error Key | Description |
|-----------|-------------|
| \`COMPANY_NOT_FOUND\` | The companyId does not match any existing company |
| \`PAYER_NOT_FOUND\` | The affiliation.payerId does not match any existing payer (identified and RN only — affiliation is optional for NN) |
| \`MOTHER_NOT_FOUND\` | The motherId does not match any patient in the same company (RN only) |`,
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized. Missing or invalid JWT token.',
    }),
  );
}
