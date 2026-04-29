import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FindPatientByIdResponseDto } from '@shared/dto/find-patient-by-id-response.dto';
import { UpdatePatientDto } from '@shared/dto/update-patient.dto';

import { ApiCompanyIdFromAuthContext } from './api-company-context.docs';

export function ApiUpdatePatient() {
  return applyDecorators(
    ApiCompanyIdFromAuthContext(),
    ApiOperation({
      summary: 'Update a patient',
      description: `Updates an existing patient. All fields are optional — only the provided fields will be modified.

The update is split into four independent steps:

**Step 1 — Basic info** (any flat field: name, email, phone, address, bloodType, etc.)
- Any provided field is applied via \`$set\` on the patient document.

**Step 2 — Affiliation** (field: \`affiliation\`)
- If the patient already has a current affiliation, it is updated in place.
- If no affiliation exists yet, a new \`UserAffiliation\` is created and linked. Requires \`agreementType\`.

**Step 3 — Documents** (field: \`addOrRemoveDocuments\`)
- \`addOrRemoveDocuments.action = add\`: validates existence and appends the given document IDs.
- \`addOrRemoveDocuments.action = remove\`: removes the given document IDs from the patient.

**Step 4 — Secondary contacts** (field: \`addOrRemoveSecondaryContacts\`)
- \`addOrRemoveSecondaryContacts.action = add\`: appends the given contacts.
- \`addOrRemoveSecondaryContacts.action = remove\`: removes contacts matching the given phones.
- \`addOrRemoveSecondaryContacts.action = update\`: replaces each contact identified by \`oldPhone\` with the new data.

All four steps can be sent in a single request.`,
    }),
    ApiBody({ type: UpdatePatientDto }),
    ApiResponse({
      status: 200,
      description: 'Patient updated successfully.',
      type: FindPatientByIdResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: `Bad Request. Error keys:

| Error Key | Description |
|-----------|-------------|
| \`PATIENT_REQUIRED_OR_INVALID\` | The patient ID in the URL is missing or not a valid ObjectId |
| \`COMPANY_REQUIRED_OR_INVALID\` | IPS ausente o inválida (JWT o cabeceras \`x-company-id\` / \`company-id\`) |
| \`DOCUMENT_UPDATE_NOT_ALLOWED\` | documentType or documentNumber can only be updated for RN (newborn) patients |
| \`AGREEMENT_TYPE_REQUIRED_TO_CREATE_AFFILIATION\` | agreementType is required when creating a new affiliation |
| \`PHONE_REQUIRED_TO_REMOVE_SECONDARY_CONTACT\` | None of the contacts sent for removal has a phone field |
| \`OLD_PHONE_REQUIRED_TO_UPDATE_SECONDARY_CONTACT\` | A contact sent for update is missing the oldPhone field |`,
    }),
    ApiResponse({
      status: 404,
      description: `Not Found. Error keys:

| Error Key | Description |
|-----------|-------------|
| \`PATIENT_NOT_FOUND\` | No patient with this ID exists in the given company |
| \`PAYER_NOT_FOUND\` | The affiliation.payerId does not match any existing payer |
| \`DOCUMENTS_NOT_FOUND\` | One or more documentIds do not exist in the database |`,
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized. Missing or invalid JWT token.',
    }),
  );
}
