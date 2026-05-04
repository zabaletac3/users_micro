import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FindPatientByIdResponseDto } from '@shared/dto/find-patient-by-id-response.dto';
import { MergePatientDto } from '@shared/dto/merge-patient.dto';

import { ApiCompanyIdFromAuthContext } from './doc-company-context.decorator';

export function ApiMergePatient() {
  return applyDecorators(
    ApiCompanyIdFromAuthContext(),
    ApiOperation({
      summary: 'Merge an NN patient into an identified patient',
      description: `Unifies an unidentified (NN) patient with an existing identified patient in the same company.

Used when \`GET /patients/search\` returns a match within the same IPS, meaning the NN and the identified patient are the same person.

**What it does:**
- Copies the NN patient's full history (\`patientHistory\`) into the target patient's history
- Registers a MERGED event in the target patient's history with a reference to the NN profile (accessible via \`metadata.nnPatientId\`)
- Sets the NN patient as inactive (\`isActive: false\`). This cannot be undone.
- The target patient's affiliation is preserved as-is.

**Prerequisites:**
- The patient in \`:id\` must exist, belong to the given company, and have documentType = NN
- The \`targetPatientId\` must exist, belong to the same company, and NOT be of type NN`,
    }),
    ApiBody({ type: MergePatientDto }),
    ApiResponse({
      status: 200,
      description: 'Merge successful. Returns the updated target patient.',
      type: FindPatientByIdResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: `Bad Request. Error keys:

| Error Key | Description |
|-----------|-------------|
| \`PATIENT_REQUIRED_OR_INVALID\` | The NN patient ID in the URL is missing or not a valid ObjectId |
| \`COMPANY_REQUIRED_OR_INVALID\` | IPS ausente o inválida (JWT o cabeceras \`x-company-id\` / \`company-id\`) |
| \`TARGET_PATIENT_REQUIRED_OR_INVALID\` | targetPatientId is missing or not a valid ObjectId |
| \`CANNOT_MERGE_PATIENT_WITH_ITSELF\` | The NN patient ID and targetPatientId are the same |
| \`PATIENT_IS_NOT_NN\` | The patient in :id is not of type NN |
| \`TARGET_PATIENT_IS_NN\` | The target patient is also of type NN — cannot merge two NN patients |`,
    }),
    ApiResponse({
      status: 404,
      description: `Not Found. Error keys:

| Error Key | Description |
|-----------|-------------|
| \`PATIENT_NOT_FOUND\` | No NN patient with this ID exists in the given company |
| \`TARGET_PATIENT_NOT_FOUND\` | No identified patient with targetPatientId exists in the given company |`,
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized. Missing or invalid JWT token.',
    }),
  );
}
