import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Enums } from 'lideris-commoms-microservice';

export class SecondaryContactDto {
  @ApiPropertyOptional({ type: String, example: 'Laura' })
  name?: string;

  @ApiPropertyOptional({ type: String, example: 'Marcela' })
  lastName?: string;

  @ApiPropertyOptional({ type: String, example: '+573001234567' })
  phone?: string;

  @ApiPropertyOptional({ type: String, example: 'laura@email.com' })
  email?: string;

  @ApiPropertyOptional({ type: String, example: 'Hermana' })
  relationship?: string;
}

export class PatientAffiliationDto {
  @ApiProperty({
    enum: Enums.AgreementTypeEnum,
    example: Enums.AgreementTypeEnum.EPS,
    description: `Agreement type (tipo de convenio).
    - EPS → EPS
    - ARL → ARL
    - SOAT → SOAT
    - ASEGURADORA → Aseguradora
    - MEDICINA_PREPAGADA → Medicina prepagada
    - ENTE_TERRITORIAL → Ente territorial
    - CONVENIO → Convenio
    - PARTICULAR → Particular`,
  })
  agreementType: Enums.AgreementTypeEnum;

  @ApiPropertyOptional({
    type: String,
    description: 'Payer ID. Required for all agreement types except PARTICULAR.',
    example: '6931b22e9078fac94c48c84c',
  })
  payerId?: string;

  @ApiPropertyOptional({
    enum: Enums.RegimeEnum,
    example: Enums.RegimeEnum.CONTRIBUTIVE,
    description: `Health regime (Colombia). Not required for SOAT.
    - CONTRIBUTIVE → contributivo
    - SUBSIDIZED → subsidiado
    - SPECIAL → especial
    - LINKED → vinculado`,
  })
  regime?: Enums.RegimeEnum;

  @ApiPropertyOptional({
    enum: Enums.AffiliationTypeEnum,
    example: Enums.AffiliationTypeEnum.CONTRIBUTOR,
    description: `Affiliation type (tipo de afiliación). Optional when agreementType is PARTICULAR.
    - CONTRIBUTOR → cotizante
    - BENEFICIARY → beneficiario`,
  })
  affiliationType?: Enums.AffiliationTypeEnum;

  @ApiPropertyOptional({
    type: Date,
    example: '2025-01-01',
    description: 'Affiliation start date.',
  })
  startDate?: Date;
}

export class NNCompanionDto {
  @ApiPropertyOptional({ type: String, example: 'Juan', description: 'Companion first name.' })
  name?: string;

  @ApiPropertyOptional({ type: String, example: 'Figueroa', description: 'Companion last name.' })
  lastName?: string;

  @ApiPropertyOptional({ type: String, example: '3007859564', description: 'Companion phone.' })
  phone?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'juan@email.com',
    description: 'Companion email.',
  })
  email?: string;
}

export class NNEntryInfoDto {
  @ApiPropertyOptional({ type: Date, example: '2025-10-19', description: 'Entry date.' })
  entryDate?: Date;

  @ApiPropertyOptional({ type: String, example: '14:46', description: 'Entry time (HH:mm).' })
  entryTime?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Vía 40 Km 3',
    description: 'Place where the patient was found or transferred from.',
  })
  originPlace?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Ambulancia particular',
    description: 'Who transported the patient (police, ambulance, particular, etc.).',
  })
  transportedBy?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'ADV787',
    description: 'Ambulance plate (if applicable).',
  })
  ambulancePlate?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Puerto Colombia',
    description: 'Registration city of the ambulance (if applicable).',
  })
  registrationCity?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Accidente de tránsito',
    description: 'Reason for admission.',
  })
  entryReason?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Paciente consciente a la llegada',
    description: 'Additional observations.',
  })
  additionalObservations?: string;
}

export class CreatePatientDto {
  @ApiProperty({
    type: String,
    description: 'Company (Tenant/IPS) ID.',
    example: '6931b22e9078fac94c48c84c',
  })
  companyId: string;

  @ApiProperty({
    enum: Enums.PatientDocumentType,
    example: Enums.PatientDocumentType.CITIZENSHIP_CARD,
    description: 'Document type. Use NN for unidentified patients.',
  })
  documentType: Enums.PatientDocumentType;

  // ── Fields required for identified patients, optional for NN ──────────────

  @ApiPropertyOptional({
    type: String,
    example: '1020304050',
    description: 'Document number. Not required for NN.',
  })
  documentNumber?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Juan',
    description: 'First name. Not required for NN (auto-set).',
  })
  name?: string;

  @ApiPropertyOptional({ type: String, example: 'Carlos', description: 'Middle name.' })
  middleName?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Pérez',
    description: 'Last name. Not required for NN.',
  })
  lastName?: string;

  @ApiPropertyOptional({ type: String, example: 'Gómez', description: 'Second last name.' })
  secondLastName?: string;

  @ApiPropertyOptional({ type: Date, example: '1990-05-15', description: 'Date of birth.' })
  birthDate?: Date;

  @ApiPropertyOptional({
    type: Number,
    example: 35,
    description: 'Age in years. Calculated automatically from birthDate by the client.',
  })
  age?: number;

  @ApiPropertyOptional({
    enum: Enums.Gender,
    example: Enums.Gender.MALE,
    description: 'Gender. Required for NN to auto-generate the name.',
  })
  gender?: Enums.Gender;

  @ApiPropertyOptional({
    type: String,
    example: 'juan.perez@email.com',
    description: 'Email address. Not required for NN.',
  })
  email?: string;

  @ApiPropertyOptional({
    type: String,
    example: '+573001234567',
    description: 'Primary phone number.',
  })
  phone?: string;

  @ApiPropertyOptional({
    type: String,
    example: '+573009876543',
    description: 'Secondary phone number.',
  })
  secondaryPhone?: string;

  @ApiPropertyOptional({
    enum: Enums.ContactMethodEnum,
    example: Enums.ContactMethodEnum.WHATSAPP,
    description: 'Preferred contact method.',
  })
  mainContactMethod?: Enums.ContactMethodEnum;

  @ApiPropertyOptional({
    type: String,
    example: 'Calle 123 #45-67',
    description: 'Street address.',
  })
  address?: string;

  @ApiPropertyOptional({ type: String, example: 'Barranquilla', description: 'City of residence.' })
  city?: string;

  @ApiPropertyOptional({ type: String, example: 'Atlántico', description: 'Department/Region.' })
  region?: string;

  @ApiPropertyOptional({ type: String, example: 'Colombia', description: 'Country of residence.' })
  country?: string;

  @ApiPropertyOptional({ type: String, example: 'El Prado', description: 'Neighborhood.' })
  neighborhood?: string;

  @ApiPropertyOptional({
    enum: Enums.ResidenceZoneEnum,
    example: Enums.ResidenceZoneEnum.URBAN,
    description: 'Residence zone (urban, rural).',
  })
  residenceZone?: Enums.ResidenceZoneEnum;

  @ApiPropertyOptional({
    enum: Enums.SocioeconomicLevelEnum,
    example: Enums.SocioeconomicLevelEnum.THREE,
    description: 'Socioeconomic level (1-6) for Colombia.',
  })
  socioeconomicLevel?: Enums.SocioeconomicLevelEnum;

  @ApiPropertyOptional({
    type: Boolean,
    example: false,
    description: 'Whether the patient has a vulnerability condition.',
  })
  vulnerabilityCondition?: boolean;

  @ApiPropertyOptional({
    enum: Enums.BloodTypeEnum,
    example: Enums.BloodTypeEnum.O_POSITIVE,
    description: 'Blood type. Not required for NN.',
  })
  bloodType?: Enums.BloodTypeEnum;

  @ApiPropertyOptional({
    enum: Enums.MaritalStatusEnum,
    example: Enums.MaritalStatusEnum.SINGLE,
    description: 'Marital status. Not required for NN.',
  })
  maritalStatus?: Enums.MaritalStatusEnum;

  @ApiPropertyOptional({
    type: String,
    example: 'Ingeniero',
    description: 'Occupation. Not required for NN.',
  })
  occupation?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Mestizo',
    description: 'Ethnicity. Not required for NN.',
  })
  ethnicity?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Ninguna',
    description: 'Disability status. Not required for NN.',
  })
  disability?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'María',
    description: 'Emergency contact first name. Not required for NN.',
  })
  emergencyContactName?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Pérez',
    description: 'Emergency contact last name. Not required for NN.',
  })
  emergencyContactLastName?: string;

  @ApiPropertyOptional({
    type: String,
    example: '+573001234567',
    description: 'Emergency contact phone. Not required for NN.',
  })
  emergencyContactPhone?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Hermana',
    description: 'Relationship to patient. Not required for NN.',
  })
  emergencyContactRelation?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'maria.perez@email.com',
    description: 'Emergency contact email. Not required for NN.',
  })
  emergencyContactEmail?: string;

  @ApiPropertyOptional({ type: String, example: 'Colombia', description: 'Country of birth.' })
  birthCountry?: string;

  @ApiPropertyOptional({ type: String, example: 'Atlántico', description: 'Department of birth.' })
  birthDepartment?: string;

  @ApiPropertyOptional({ type: String, example: 'Barranquilla', description: 'City of birth.' })
  birthCity?: string;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: 'Data treatment policy acceptance. Not required for NN.',
  })
  dataTreatmentAccepted?: boolean;

  @ApiPropertyOptional({
    type: PatientAffiliationDto,
    description: 'Health insurance affiliation. Not required for NN or RN (newborn).',
  })
  affiliation?: PatientAffiliationDto;

  @ApiPropertyOptional({
    type: [String],
    example: ['6931b22e9078fac94c48c84c'],
    description: 'Documents IDs.',
  })
  documents?: string[];

  // ── NN-specific fields ─────────────────────────────────────────────────────

  @ApiPropertyOptional({
    type: String,
    example: 'Inestable',
    description: 'Patient condition on arrival. Only for NN patients.',
  })
  entryCondition?: string;

  @ApiPropertyOptional({
    type: String,
    example: '40 años',
    description: 'Approximate age (free text). Only for NN patients.',
  })
  approximateAge?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Contextura media, 1.75m aprox. Camisa negra, tatuaje en brazo izquierdo',
    description: 'Distinctive physical traits to help identify the patient. Only for NN patients.',
  })
  physicalTraits?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Anillo plateado, chaqueta verde',
    description: 'Personal belongings brought in with the patient. Only for NN patients.',
  })
  belongings?: string;

  @ApiPropertyOptional({
    type: NNCompanionDto,
    description: 'Companion data (if patient arrived with someone). Only for NN patients.',
  })
  companion?: NNCompanionDto;

  @ApiPropertyOptional({
    type: NNEntryInfoDto,
    description: 'Admission and transfer data. Only for NN patients.',
  })
  entryInfo?: NNEntryInfoDto;

  // ── Newborn-specific fields ────────────────────────────────────────────────

  @ApiPropertyOptional({
    type: String,
    example: '6931b22e9078fac94c48c84c',
    description: 'Mother patient ID. Required for newborn (RN) patients.',
  })
  motherId?: string;

  @ApiPropertyOptional({
    enum: Enums.BirthPlaceEnum,
    example: Enums.BirthPlaceEnum.SEDE_BARRANQUILLA,
    description: `Birth facility. Required for newborn (RN) patients.

    Options:
    - ${Enums.BirthPlaceEnum.SEDE_BARRANQUILLA}
    - ${Enums.BirthPlaceEnum.SEDE_BARANOA}
    `,
  })
  birthPlace?: Enums.BirthPlaceEnum;

  @ApiPropertyOptional({
    type: String,
    example: 'Cl. 1 #2-34A',
    description: 'Birth address. Only for newborn patients.',
  })
  birthAddress?: string;

  @ApiPropertyOptional({
    type: String,
    example: '14:30',
    description: 'Birth time (HH:mm). Required for RN (newborn) patients.',
  })
  birthTime?: string;

  // ── Additional patient fields ──────────────────────────────────────────────

  @ApiPropertyOptional({
    enum: Enums.EducationLevelEnum,
    example: Enums.EducationLevelEnum.PROFESSIONAL,
    description: `Education level (nivel educativo).

    Mapping:
    - NONE → Ninguno
    - PRIMARY → Primaria
    - SECONDARY → Secundaria
    - TECHNICAL → Técnico/Tecnólogo
    - PROFESSIONAL → Profesional
    - POSTGRADUATE → Posgrado
    `,
  })
  educationLevel?: Enums.EducationLevelEnum;

  @ApiPropertyOptional({
    type: String,
    example: '025588',
    description: 'Department code (código del departamento).',
  })
  departmentCode?: string;

  @ApiPropertyOptional({
    type: [SecondaryContactDto],
    description: 'Secondary contacts (canales secundarios de contacto).',
  })
  secondaryContacts?: SecondaryContactDto[];
}
