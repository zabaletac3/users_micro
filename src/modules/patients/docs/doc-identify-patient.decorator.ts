import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FindPatientByIdResponseDto } from '@shared/dto/find-patient-by-id-response.dto';
import { IdentifyPatientDto } from '@shared/dto/identify-patient.dto';

import { ApiCompanyIdFromAuthContext } from './doc-company-context.decorator';

export function ApiIdentifyPatient() {
  return applyDecorators(
    ApiCompanyIdFromAuthContext(),
    ApiOperation({
      summary: 'Identify an NN patient',
      description: `Converts an unidentified (NN) patient into a fully identified patient.

This endpoint is used when the identity of an NN patient has been confirmed and no existing patient record was found via \`GET /patients/search\`.

**What it does:**
- Updates the NN record with the provided identity data (documentType, name, etc.)
- Creates a new affiliation linked to the patient's clinical profile
- Registers an IDENTIFIED event in the patient history

**Prerequisites:**
- The patient must exist and belong to the given company
- The patient must currently have documentType = NN
- The documentType in the body cannot be NN`,
    }),
    ApiBody({ type: IdentifyPatientDto }),
    ApiResponse({
      status: 200,
      description: 'Patient identified successfully.',
      type: FindPatientByIdResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: `Bad Request. Error keys:

| Error Key | Description |
|-----------|-------------|
| \`PATIENT_REQUIRED_OR_INVALID\` | The patient ID in the URL is missing or not a valid ObjectId |
| \`COMPANY_REQUIRED_OR_INVALID\` | IPS ausente o inválida (JWT o cabeceras \`x-company-id\` / \`company-id\`) |
| \`PATIENT_IS_NOT_NN\` | The patient is not of type NN and cannot be identified through this endpoint |
| \`DOCUMENT_TYPE_NN_NOT_ALLOWED\` | documentType in the body cannot be NN |`,
    }),
    ApiResponse({
      status: 404,
      description: `Not Found. Error keys:

| Error Key | Description |
|-----------|-------------|
| \`PATIENT_NOT_FOUND\` | No patient with this ID exists in the given company |
| \`PAYER_NOT_FOUND\` | The affiliation.payerId does not match any existing payer |`,
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized. Missing or invalid JWT token.',
    }),
  );
}
