import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ListPatientsResponseDto } from '@shared/dto/list-patient-response.dto';
import { Enums } from 'lideris-commoms-microservice';

export function ApiListPatients() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all patients',
      description:
        'Returns a paginated and filtered list of patients for a company. Supports search by serial, name, document number, email and affiliation. Also returns dashboard metrics.',
    }),
    ApiQuery({ name: 'companyId', required: true, type: String }),
    ApiQuery({ name: 'search', required: false, type: String }),
    ApiQuery({ name: 'name', required: false, type: String }),
    ApiQuery({ name: 'documentNumber', required: false, type: String }),
    ApiQuery({ name: 'documentType', required: false, type: String }),
    ApiQuery({ name: 'agreementType', required: false, enum: Enums.AgreementTypeEnum }),
    ApiQuery({ name: 'payerId', required: false, type: String }),
    ApiQuery({ name: 'startDate', required: false, type: String }),
    ApiQuery({ name: 'endDate', required: false, type: String }),
    ApiQuery({ name: 'limit', required: false, type: Number }),
    ApiQuery({ name: 'skip', required: false, type: Number }),
    ApiResponse({
      status: 200,
      type: ListPatientsResponseDto,
      description: 'Patients retrieved successfully.',
    }),
    ApiResponse({
      status: 400,
      description: `Bad Request. Error keys:

| Error Key | Description |
|-----------|-------------|
| \`COMPANY_REQUIRED_OR_INVALID\` | companyId is missing or not a valid ObjectId |
`,
    }),
  );
}
