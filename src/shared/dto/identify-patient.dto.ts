import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Enums } from 'lideris-commoms-microservice';

export class IdentifyPatientAffiliationDto {
  @ApiProperty({
    enum: Enums.AgreementTypeEnum,
    example: Enums.AgreementTypeEnum.EPS,
    description: 'Agreement type (tipo de convenio).',
  })
  agreementType: Enums.AgreementTypeEnum;

  @ApiPropertyOptional({
    type: String,
    example: '6931b22e9078fac94c48c84c',
    description: 'Payer ID. Required for all agreement types except PARTICULAR and SOAT.',
  })
  payerId?: string;

  @ApiPropertyOptional({
    enum: Enums.RegimeEnum,
    example: Enums.RegimeEnum.CONTRIBUTIVE,
    description: 'Health regime. Not required for SOAT.',
  })
  regime?: Enums.RegimeEnum;

  @ApiPropertyOptional({
    enum: Enums.AffiliationTypeEnum,
    example: Enums.AffiliationTypeEnum.CONTRIBUTOR,
    description: 'Affiliation type. Not required for PARTICULAR or SOAT.',
  })
  affiliationType?: Enums.AffiliationTypeEnum;

  @ApiPropertyOptional({
    type: Date,
    example: '2025-01-01',
    description: 'Affiliation start date.',
  })
  startDate?: Date;
}

export class IdentifyPatientDto {
  // ── Required fields ────────────────────────────────────────────────────────

  @ApiProperty({
    enum: Enums.PatientDocumentType,
    example: Enums.PatientDocumentType.CITIZENSHIP_CARD,
    description: 'Document type of the identified patient. Cannot be NN.',
  })
  documentType: Enums.PatientDocumentType;

  @ApiProperty({
    type: String,
    example: '1020304050',
    description: 'Document number of the identified patient.',
  })
  documentNumber: string;

  @ApiProperty({ type: String, example: 'Juan' })
  name: string;

  @ApiProperty({ type: String, example: 'Pérez' })
  lastName: string;

  @ApiProperty({ type: String, example: 'juan.perez@email.com' })
  email: string;

  @ApiProperty({ enum: Enums.BloodTypeEnum, example: Enums.BloodTypeEnum.O_POSITIVE })
  bloodType: Enums.BloodTypeEnum;

  @ApiProperty({ enum: Enums.MaritalStatusEnum, example: Enums.MaritalStatusEnum.SINGLE })
  maritalStatus: Enums.MaritalStatusEnum;

  @ApiProperty({ type: String, example: 'Ingeniero' })
  occupation: string;

  @ApiProperty({ type: String, example: 'Mestizo' })
  ethnicity: string;

  @ApiProperty({ type: String, example: 'Ninguna' })
  disability: string;

  @ApiProperty({ type: String, example: 'María' })
  emergencyContactName: string;

  @ApiProperty({ type: String, example: '+573001234567' })
  emergencyContactPhone: string;

  @ApiProperty({ type: String, example: 'Hermana' })
  emergencyContactRelation: string;

  @ApiProperty({ type: Boolean, example: true })
  dataTreatmentAccepted: boolean;

  @ApiProperty({
    type: IdentifyPatientAffiliationDto,
    description: 'Health insurance affiliation.',
  })
  affiliation: IdentifyPatientAffiliationDto;

  // ── Optional fields ────────────────────────────────────────────────────────

  @ApiPropertyOptional({ type: String, example: 'Carlos' })
  middleName?: string;

  @ApiPropertyOptional({ type: String, example: 'Gómez' })
  secondLastName?: string;

  @ApiPropertyOptional({ type: Date, example: '1990-05-15' })
  birthDate?: Date;

  @ApiPropertyOptional({ type: Number, example: 35 })
  age?: number;

  @ApiPropertyOptional({ enum: Enums.Gender, example: Enums.Gender.MALE })
  gender?: Enums.Gender;

  @ApiPropertyOptional({ type: String, example: '+573001234567' })
  phone?: string;

  @ApiPropertyOptional({ type: String, example: '+573009876543' })
  secondaryPhone?: string;

  @ApiPropertyOptional({ enum: Enums.ContactMethodEnum, example: Enums.ContactMethodEnum.WHATSAPP })
  mainContactMethod?: Enums.ContactMethodEnum;

  @ApiPropertyOptional({ type: String, example: 'Calle 123 #45-67' })
  address?: string;

  @ApiPropertyOptional({ type: String, example: 'Barranquilla' })
  city?: string;

  @ApiPropertyOptional({ type: String, example: 'Atlántico' })
  region?: string;

  @ApiPropertyOptional({ type: String, example: 'Colombia' })
  country?: string;

  @ApiPropertyOptional({ type: String, example: 'El Prado' })
  neighborhood?: string;

  @ApiPropertyOptional({ enum: Enums.ResidenceZoneEnum, example: Enums.ResidenceZoneEnum.URBAN })
  residenceZone?: Enums.ResidenceZoneEnum;

  @ApiPropertyOptional({
    enum: Enums.SocioeconomicLevelEnum,
    example: Enums.SocioeconomicLevelEnum.THREE,
  })
  socioeconomicLevel?: Enums.SocioeconomicLevelEnum;

  @ApiPropertyOptional({ type: Boolean, example: false })
  vulnerabilityCondition?: boolean;

  @ApiPropertyOptional({ type: String, example: 'Colombia' })
  birthCountry?: string;

  @ApiPropertyOptional({ type: String, example: 'Atlántico' })
  birthDepartment?: string;

  @ApiPropertyOptional({ type: String, example: 'Barranquilla' })
  birthCity?: string;

  @ApiPropertyOptional({ type: String, example: 'Pérez' })
  emergencyContactLastName?: string;

  @ApiPropertyOptional({ type: String, example: 'maria.perez@email.com' })
  emergencyContactEmail?: string;

  @ApiPropertyOptional({
    enum: Enums.EducationLevelEnum,
    example: Enums.EducationLevelEnum.PROFESSIONAL,
  })
  educationLevel?: Enums.EducationLevelEnum;

  @ApiPropertyOptional({ type: String, example: '025588' })
  departmentCode?: string;
}
