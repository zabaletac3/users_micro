import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Enums } from 'lideris-commoms-microservice';

export class SearchPatientQueryDto {
  @ApiProperty({
    type: String,
    required: true,
    example: '6931b22e9078fac94c48c84c',
    description: 'Company (IPS) ID used to determine if the patient belongs to this company.',
  })
  companyId: string;

  @ApiProperty({
    enum: Enums.PatientDocumentType,
    required: false,
    example: Enums.PatientDocumentType.CITIZENSHIP_CARD,
    description: 'Document type to search by.',
  })
  documentType?: Enums.PatientDocumentType;

  @ApiProperty({
    type: String,
    required: true,
    example: '1020304050',
    description: 'Document number to search by.',
  })
  documentNumber: string;
}

export class SearchPatientResponseItemDto {
  @ApiPropertyOptional({ type: String, example: '6831b22e9078fac94c48c84a' })
  _id?: string;

  @ApiPropertyOptional({ type: String, example: 'PAC-0001' })
  serial?: string;

  @ApiPropertyOptional({ type: String, example: 'Juan' })
  name?: string;

  @ApiPropertyOptional({ type: String, example: 'Carlos' })
  middleName?: string;

  @ApiPropertyOptional({ type: String, example: 'Pérez' })
  lastName?: string;

  @ApiPropertyOptional({ type: String, example: 'Gómez' })
  secondLastName?: string;

  @ApiPropertyOptional({ type: String, example: 'Juan Carlos Pérez Gómez' })
  fullName?: string;

  @ApiProperty({
    enum: Enums.PatientDocumentType,
    example: Enums.PatientDocumentType.CITIZENSHIP_CARD,
  })
  documentType: Enums.PatientDocumentType;

  @ApiPropertyOptional({ type: String, example: '1020304050' })
  documentNumber?: string;

  @ApiProperty({
    type: [String],
    example: ['6931b22e9078fac94c48c84c'],
    description: 'List of company IDs this patient belongs to.',
  })
  companies: string[];
}
