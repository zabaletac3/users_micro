import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Enums } from 'lideris-commoms-microservice';

export class FindAllPatientsDto {
  limit: number;
  skip: number;

  @ApiProperty({ example: '6931b22e9078fac94c48c84c' })
  companyId: string;

  @ApiPropertyOptional({ example: 'Juan' })
  search?: string;

  @ApiPropertyOptional({ example: 'Juan' })
  name?: string;

  @ApiPropertyOptional({ example: 12345678 })
  documentNumber?: number;

  @ApiPropertyOptional({
    enum: Enums.AgreementTypeEnum,
    example: Enums.AgreementTypeEnum.EPS,
    description: 'Filter by agreement type (tipo de convenio).',
  })
  agreementType?: Enums.AgreementTypeEnum;

  @ApiPropertyOptional({
    enum: Enums.PatientDocumentType,
    example: Enums.PatientDocumentType.NN,
    description: 'Filter by document type (e.g. NN to list only unidentified patients).',
  })
  documentType?: Enums.PatientDocumentType;

  @ApiPropertyOptional({
    type: String,
    example: '2026-01-01',
    description: 'Start date (ISO 8601) to filter patients by registration date.',
  })
  startDate?: string;

  @ApiPropertyOptional({
    type: String,
    example: '2026-12-31',
    description: 'End date (ISO 8601) to filter patients by registration date.',
  })
  endDate?: string;

  @ApiPropertyOptional({
    type: String,
    example: '69cc274d6af397f4c9ca714a',
    description: 'Filter patients by payer (EPS) ID.',
  })
  payerId?: string;

  @ApiPropertyOptional({
    enum: Enums.Gender,
    example: Enums.Gender.MALE,
    description: 'Filter patients by gender.',
  })
  gender?: Enums.Gender;
}
