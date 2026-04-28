import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Enums } from 'lideris-commoms-microservice';

import { AddOrRemoveDocumentDto } from './add-or-remove-document.dto';
// ── Secondary contacts ─────────────────────────────────────────────────────────

export class SecondaryContactItemDto {
  @ApiPropertyOptional({
    type: String,
    example: '+573001234567',
    description: 'Required when action is "update". Identifies the contact to replace.',
  })
  oldPhone?: string;

  @ApiPropertyOptional({ type: String, example: 'Laura' })
  name?: string;

  @ApiPropertyOptional({ type: String, example: 'Marcela' })
  lastName?: string;

  @ApiPropertyOptional({ type: String, example: '+573009999999' })
  phone?: string;

  @ApiPropertyOptional({ type: String, example: 'laura@email.com' })
  email?: string;

  @ApiPropertyOptional({ type: String, example: 'Hermana' })
  relationship?: string;
}

export class AddOrRemoveSecondaryContactsDto {
  @ApiProperty({
    type: String,
    required: true,
    enum: Enums.AddOrRemoveQuery,
    example: Enums.AddOrRemoveQuery.ADD,
    description: `Action to perform on secondary contacts.
    - add: appends the contacts to the list
    - remove: removes contacts matching the given phones
    - update: replaces a contact identified by oldPhone`,
  })
  action: Enums.AddOrRemoveQuery;

  @ApiProperty({
    type: [SecondaryContactItemDto],
    description:
      'Contacts to add, remove or update. For "update", each item must include oldPhone.',
  })
  contacts: SecondaryContactItemDto[];
}

// ── Affiliation ────────────────────────────────────────────────────────────────

export class UpdatePatientAffiliationDto {
  @ApiPropertyOptional({
    enum: Enums.AgreementTypeEnum,
    example: Enums.AgreementTypeEnum.EPS,
    description: 'Agreement type.',
  })
  agreementType?: Enums.AgreementTypeEnum;

  @ApiPropertyOptional({
    type: String,
    example: '6931b22e9078fac94c48c84c',
    description: 'Payer ID. Required for all types except PARTICULAR and SOAT.',
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

// ── Main DTO ───────────────────────────────────────────────────────────────────

export class UpdatePatientDto {
  // ── Step 1: Basic info ─────────────────────────────────────────────────────

  @ApiPropertyOptional({
    enum: Enums.PatientDocumentType,
    example: Enums.PatientDocumentType.CIVIL_REGISTRY,
    description: 'Document type. Only allowed for RN (newborn) patients.',
  })
  documentType?: Enums.PatientDocumentType;

  @ApiPropertyOptional({
    type: String,
    example: '1020304050',
    description: 'Document number. Only allowed for RN (newborn) patients.',
  })
  documentNumber?: string;

  @ApiPropertyOptional({ type: String, example: 'Juan' })
  name?: string;

  @ApiPropertyOptional({ type: String, example: 'Carlos' })
  middleName?: string;

  @ApiPropertyOptional({ type: String, example: 'Pérez' })
  lastName?: string;

  @ApiPropertyOptional({ type: String, example: 'Gómez' })
  secondLastName?: string;

  @ApiPropertyOptional({ type: Date, example: '1990-05-15' })
  birthDate?: Date;

  @ApiPropertyOptional({
    type: Number,
    example: 35,
    description: 'Age in years. Calculated automatically from birthDate by the client.',
  })
  age?: number;

  @ApiPropertyOptional({ enum: Enums.Gender, example: Enums.Gender.MALE })
  gender?: Enums.Gender;

  @ApiPropertyOptional({ type: String, example: 'juan.perez@email.com' })
  email?: string;

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

  @ApiPropertyOptional({ enum: Enums.BloodTypeEnum, example: Enums.BloodTypeEnum.O_POSITIVE })
  bloodType?: Enums.BloodTypeEnum;

  @ApiPropertyOptional({ enum: Enums.MaritalStatusEnum, example: Enums.MaritalStatusEnum.SINGLE })
  maritalStatus?: Enums.MaritalStatusEnum;

  @ApiPropertyOptional({ type: String, example: 'Ingeniero' })
  occupation?: string;

  @ApiPropertyOptional({ type: String, example: 'Mestizo' })
  ethnicity?: string;

  @ApiPropertyOptional({ type: String, example: 'Ninguna' })
  disability?: string;

  @ApiPropertyOptional({ type: String, example: 'Colombia' })
  birthCountry?: string;

  @ApiPropertyOptional({ type: String, example: 'Atlántico' })
  birthDepartment?: string;

  @ApiPropertyOptional({ type: String, example: 'Barranquilla' })
  birthCity?: string;

  @ApiPropertyOptional({ type: Boolean, example: true })
  dataTreatmentAccepted?: boolean;

  @ApiPropertyOptional({ type: String, example: 'María' })
  emergencyContactName?: string;

  @ApiPropertyOptional({ type: String, example: 'Pérez' })
  emergencyContactLastName?: string;

  @ApiPropertyOptional({ type: String, example: '+573001234567' })
  emergencyContactPhone?: string;

  @ApiPropertyOptional({ type: String, example: 'Hermana' })
  emergencyContactRelation?: string;

  @ApiPropertyOptional({ type: String, example: 'maria.perez@email.com' })
  emergencyContactEmail?: string;

  @ApiPropertyOptional({
    enum: Enums.EducationLevelEnum,
    example: Enums.EducationLevelEnum.PROFESSIONAL,
    description: 'Education level.',
  })
  educationLevel?: Enums.EducationLevelEnum;

  @ApiPropertyOptional({ type: String, example: '025588', description: 'Department code.' })
  departmentCode?: string;

  @ApiPropertyOptional({
    type: String,
    example: '14:30',
    description: 'Birth time (HH:mm). Only for RN patients.',
  })
  birthTime?: string;

  // ── Step 2: Affiliation ────────────────────────────────────────────────────

  @ApiPropertyOptional({
    type: UpdatePatientAffiliationDto,
    description: 'Updates the current affiliation. Creates a new one if none exists.',
  })
  affiliation?: UpdatePatientAffiliationDto;

  // ── Step 3: Documents ──────────────────────────────────────────────────────

  @ApiPropertyOptional({
    type: AddOrRemoveDocumentDto,
    description: 'Add or remove documents from the patient.',
  })
  addOrRemoveDocuments?: AddOrRemoveDocumentDto;

  // ── Step 4: Secondary contacts ─────────────────────────────────────────────

  @ApiPropertyOptional({
    type: AddOrRemoveSecondaryContactsDto,
    description: 'Add, remove or update secondary contacts.',
  })
  addOrRemoveSecondaryContacts?: AddOrRemoveSecondaryContactsDto;
}
