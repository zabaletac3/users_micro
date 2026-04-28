import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { FindPatientByIdResponseDto } from '@shared/dto/find-patient-by-id-response.dto';
import { ImportPatientDto } from '@shared/dto/import-patient.dto';

export function ApiImportPatient() {
  return applyDecorators(
    ApiOperation({
      summary: 'Import a patient from another IPS',
      description: `Links an identified patient from another IPS into the current company.

Used when \`GET /patients/search\` returns a match in a different IPS, or when a duplicate profile is detected across companies.

**What it does:**
- Adds the current \`companyId\` to the target patient's \`companies\` array
- Copies the target patient's current affiliation and creates a new one for this company
- Creates a new clinical profile linking the patient to this company
- Copies the source patient's history into the target patient's history
- Registers an IMPORTED event in the target patient's history with a reference to the source profile (via \`metadata.sourcePatientId\`)
- Sets the source patient as inactive (\`isActive: false\`). This cannot be undone.

**Prerequisites:**
- The patient in \`:id\` must exist and belong to the given company
- The \`targetPatientId\` must exist in the system but NOT in the current company
- The target patient must not be of type NN`,
    }),
    ApiQuery({
      name: 'companyId',
      required: true,
      type: String,
      description: 'Company (IPS) ID where the NN patient is registered.',
      example: '6931b22e9078fac94c48c84c',
    }),
    ApiBody({ type: ImportPatientDto }),
    ApiResponse({
      status: 200,
      description: 'Import successful. Returns the target patient now linked to this company.',
      type: FindPatientByIdResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: `Bad Request. Error keys:

| Error Key | Description |
|-----------|-------------|
| \`PATIENT_REQUIRED_OR_INVALID\` | The NN patient ID in the URL is missing or not a valid ObjectId |
| \`COMPANY_REQUIRED_OR_INVALID\` | The companyId query param is missing or not a valid ObjectId |
| \`TARGET_PATIENT_REQUIRED_OR_INVALID\` | targetPatientId is missing or not a valid ObjectId |
| \`CANNOT_IMPORT_PATIENT_WITH_ITSELF\` | The NN patient ID and targetPatientId are the same |
| \`TARGET_PATIENT_IS_NN\` | The target patient is of type NN — cannot import into an unidentified patient |
| \`TARGET_PATIENT_ALREADY_IN_COMPANY\` | The target patient already belongs to this company — use Merge instead |`,
    }),
    ApiResponse({
      status: 404,
      description: `Not Found. Error keys:

| Error Key | Description |
|-----------|-------------|
| \`PATIENT_NOT_FOUND\` | No NN patient with this ID exists in the given company |
| \`TARGET_PATIENT_NOT_FOUND\` | No patient with targetPatientId exists in the system |`,
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized. Missing or invalid JWT token.',
    }),
  );
}
