import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SearchPatientResponseItemDto } from '@shared/dto/search-patient.dto';
import { Enums } from 'lideris-commoms-microservice';

import { ApiCompanyIdFromAuthContext } from './api-company-context.docs';

export function ApiSearchPatient() {
  return applyDecorators(
    ApiCompanyIdFromAuthContext(),
    ApiOperation({
      summary: 'Search patient by document',
      description: `Searches for patients matching a given documentType and documentNumber across all companies.

Used in the NN identification flow to determine the next action:

| Result | Next action |
|--------|-------------|
| No match found | **Identify** — fill in data on the existing NN record |
| Match found in the same company | **Merge** — unify the NN with the existing patient |
| Match found in another company | **Import** — link the existing patient to this company |

The \`companies\` array in each result can be compared against the current IPS (cabecera \`x-company-id\` o compañía en JWT) para determinar el caso.`,
    }),
    ApiQuery({
      name: 'documentType',
      required: true,
      enum: Enums.PatientDocumentType,
      description: 'Document type to search by.',
    }),
    ApiQuery({
      name: 'documentNumber',
      required: true,
      type: String,
      description: 'Document number to search by.',
      example: '1020304050',
    }),
    ApiResponse({
      status: 200,
      description: 'Search results. Empty array means no match — proceed with Identify.',
      type: [SearchPatientResponseItemDto],
    }),
    ApiResponse({
      status: 400,
      description: `Bad Request. Error keys:

| Error Key | Description |
|-----------|-------------|
| \`COMPANY_REQUIRED_OR_INVALID\` | IPS ausente o inválida (contexto JWT o cabeceras \`x-company-id\` / \`company-id\`) |
| \`DOCUMENT_TYPE_REQUIRED\` | documentType is missing |
| \`DOCUMENT_NUMBER_REQUIRED\` | documentNumber is missing |`,
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized. Missing or invalid JWT token.',
    }),
  );
}
