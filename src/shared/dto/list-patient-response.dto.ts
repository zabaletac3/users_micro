import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Enums } from 'lideris-commoms-microservice';

export class PayerPopulatedDto {
  @ApiProperty({ example: '69cc274d6af397f4c9ca714a' })
  _id: string;

  @ApiProperty({ example: 'SURA EPS S.A.' })
  legalName: string;

  @ApiProperty({ example: 'Sura EPS' })
  displayName: string;

  @ApiProperty({ example: 'EPS' })
  type: string;
}

export class AffiliationPopulatedDto {
  @ApiProperty({ example: '69cc329665c348f676b149dd' })
  _id: string;

  @ApiProperty({ enum: Enums.AgreementTypeEnum, example: Enums.AgreementTypeEnum.EPS })
  agreementType: Enums.AgreementTypeEnum;

  @ApiPropertyOptional({ type: PayerPopulatedDto })
  payerId?: PayerPopulatedDto;

  @ApiProperty({ example: 'CONTRIBUTIVE' })
  regime: string;

  @ApiPropertyOptional({
    enum: Enums.AffiliationTypeEnum,
    example: Enums.AffiliationTypeEnum.CONTRIBUTOR,
  })
  affiliationType?: Enums.AffiliationTypeEnum;

  @ApiPropertyOptional({ example: new Date() })
  startDate?: Date;
}

export class PatientItemResponseDto {
  @ApiProperty({ example: '69cc329665c348f676b149db' })
  _id: string;

  @ApiProperty({ example: 'Juan Carlos Pérez Gómez', required: false })
  fullName?: string;

  @ApiProperty({ example: 'Juan', required: false })
  name?: string;

  @ApiProperty({ example: 'Carlos', required: false })
  middleName?: string;

  @ApiProperty({ example: 'Pérez', required: false })
  lastName?: string;

  @ApiProperty({ example: 'Gómez', required: false })
  secondLastName?: string;

  @ApiProperty({ example: 'juan.perez@email.com' })
  email: string;

  @ApiProperty({ example: 'CC', required: false })
  documentType?: string;

  @ApiProperty({ example: '1020304050', required: false })
  documentNumber?: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 'EMP-49DB' })
  serial: string;

  @ApiProperty({ type: AffiliationPopulatedDto })
  affiliation: AffiliationPopulatedDto;
}

export class PatientMetricsDto {
  @ApiProperty({ example: 128, description: 'Total registered patients in the company.' })
  totalPatients: number;

  @ApiProperty({ example: 42, description: 'Total unidentified (NN) patients.' })
  totalNN: number;

  @ApiProperty({
    example: 0,
    description:
      'Total patients currently in clinic (admission). Always 0 until admission module is implemented.',
  })
  totalInClinic: number;
}

export class ListPatientsResponseDto {
  @ApiProperty({ type: [PatientItemResponseDto] })
  items: PatientItemResponseDto[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 10 })
  totalPages: number;

  @ApiProperty({ type: PatientMetricsDto })
  metrics: PatientMetricsDto;
}
