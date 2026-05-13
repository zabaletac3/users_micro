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
  @ApiProperty({ example: '69cd1b0203115e55f538d59e' })
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
}

export class PatientHistoryEventDto {
  @ApiProperty({ example: 'CREATED' })
  eventType: string;

  @ApiProperty({ example: '2026-04-01T13:17:54.025Z' })
  timestamp: string;

  @ApiProperty({ example: '6773006875657d822d01394a' })
  performedBy: string;

  @ApiProperty({ example: 'Patient created' })
  description: string;
}

export class FindPatientByIdResponseDto {
  @ApiProperty({ example: '69cd1b0203115e55f538d59c' })
  _id: string;

  @ApiPropertyOptional({
    example: 'waiting',
    description: 'Patient attention status from real-time stream',
  })
  status?: string;

  @ApiProperty({ type: [String], example: ['67fd2a95f8f66b591dc9b20d'] })
  companies: string[];

  @ApiProperty({ example: '67fd2a95f8f66b591dc9b20d' })
  companySelected: string;

  @ApiProperty({ example: 'Diana' })
  name: string;

  @ApiProperty({ example: 'Carolina' })
  middleName: string;

  @ApiProperty({ example: 'Ortega' })
  lastName: string;

  @ApiProperty({ example: 'Mendoza' })
  secondLastName: string;

  @ApiProperty({ example: '+573001111130' })
  phone: string;

  @ApiProperty({ example: 'diana.ortega@email.com' })
  email: string;

  @ApiProperty({ example: 'CC' })
  documentType: string;

  @ApiProperty({ example: '1000000020' })
  documentNumber: string;

  @ApiProperty({ example: '1994-04-08T00:00:00.000Z' })
  birthDate: string;

  @ApiPropertyOptional({ example: 31, description: 'Age in years.' })
  age?: number;

  @ApiProperty({ example: 'SINGLE' })
  maritalStatus: string;

  @ApiProperty({ example: 'Colombia' })
  country: string;

  @ApiProperty({ example: 'Barranquilla' })
  city: string;

  @ApiProperty({ example: 'Atlántico' })
  region: string;

  @ApiProperty({ example: 'Colombia' })
  birthCountry: string;

  @ApiProperty({ example: 'Atlántico' })
  birthDepartment: string;

  @ApiProperty({ example: 'Barranquilla' })
  birthCity: string;

  @ApiProperty({ example: 'urban' })
  residenceZone: string;

  @ApiProperty({ example: 'Riomar' })
  neighborhood: string;

  @ApiProperty({ example: '6' })
  socioeconomicLevel: string;

  @ApiProperty({ example: false })
  vulnerabilityCondition: boolean;

  @ApiProperty({ example: true })
  dataTreatmentAccepted: boolean;

  @ApiProperty({ example: 'Carrera 25 #35-45' })
  address: string;

  @ApiProperty({ example: 'female' })
  gender: string;

  @ApiProperty({ example: 'A+' })
  bloodType: string;

  @ApiProperty({ example: 'Pedro' })
  emergencyContactName: string;

  @ApiPropertyOptional({ example: 'Ortega' })
  emergencyContactLastName?: string;

  @ApiProperty({ example: '+573002222241' })
  emergencyContactPhone: string;

  @ApiProperty({ example: 'Padre' })
  emergencyContactRelation: string;

  @ApiPropertyOptional({ example: 'pedro.ortega@email.com' })
  emergencyContactEmail?: string;

  @ApiProperty({ example: 'Diseñadora' })
  occupation: string;

  @ApiProperty({ example: 'Mestizo' })
  ethnicity: string;

  @ApiProperty({ example: 'Ninguna' })
  disability: string;

  @ApiProperty({ type: [String], example: [] })
  profileImages: string[];

  @ApiProperty({ example: 0 })
  otpAttempts: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ type: [String], example: [] })
  documents: string[];

  @ApiProperty({ type: [PatientHistoryEventDto] })
  patientHistory: PatientHistoryEventDto[];

  @ApiProperty({ example: '2026-04-01T13:17:54.026Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-04-01T13:17:54.026Z' })
  updatedAt: string;

  @ApiProperty({ example: 'EMP-D59C' })
  serial: string;

  @ApiProperty({ example: 'Diana Carolina Ortega Mendoza' })
  fullName: string;

  @ApiPropertyOptional({ type: AffiliationPopulatedDto })
  affiliation?: AffiliationPopulatedDto;

  @ApiProperty({ example: 1 })
  patientHistoryTotal: number;

  @ApiProperty({ example: 1 })
  patientHistoryPages: number;

  // ── NN patient fields ──────────────────────────────────────────────────────

  @ApiPropertyOptional({ example: 'Inestable' })
  entryCondition?: string;

  @ApiPropertyOptional({ example: '40 años' })
  approximateAge?: string;

  @ApiPropertyOptional({
    example: 'Contextura media, 1.75m aprox. Camisa negra, tatuaje en brazo izquierdo',
  })
  physicalTraits?: string;

  @ApiPropertyOptional({ example: 'Anillo plateado, chaqueta verde' })
  belongings?: string;

  @ApiPropertyOptional({
    example: { name: 'Juan', lastName: 'Figueroa', phone: '3007859564', email: 'juan@email.com' },
  })
  companion?: {
    name?: string;
    lastName?: string;
    phone?: string;
    email?: string;
  };

  @ApiPropertyOptional({
    example: {
      entryDate: '2025-10-19',
      entryTime: '14:46',
      originPlace: 'Vía 40 Km 3',
      transportedBy: 'Ambulancia particular',
      ambulancePlate: 'ADV787',
      registrationCity: 'Puerto Colombia',
      entryReason: 'Accidente de tránsito',
      additionalObservations: 'Paciente consciente a la llegada',
    },
  })
  entryInfo?: {
    entryDate?: Date;
    entryTime?: string;
    originPlace?: string;
    transportedBy?: string;
    ambulancePlate?: string;
    registrationCity?: string;
    entryReason?: string;
    additionalObservations?: string;
  };

  // ── Newborn fields ─────────────────────────────────────────────────────────

  @ApiPropertyOptional({ example: '6931b22e9078fac94c48c84c' })
  motherId?: string;

  @ApiPropertyOptional({
    enum: Enums.BirthPlaceEnum,
    example: Enums.BirthPlaceEnum.SEDE_BARRANQUILLA,
  })
  birthPlace?: Enums.BirthPlaceEnum;

  @ApiPropertyOptional({ example: 'Cl. 1 #2-34A' })
  birthAddress?: string;

  @ApiPropertyOptional({
    example: '14:30',
    description: 'Birth time (HH:mm). Only for RN patients.',
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
    example: '025588',
    description: 'Department code (código del departamento).',
  })
  departmentCode?: string;

  @ApiPropertyOptional({
    example: [
      {
        name: 'Laura',
        lastName: 'Marcela',
        phone: '+573001234567',
        email: 'laura@email.com',
        relationship: 'Hermana',
      },
    ],
    description: 'Secondary contacts (canales secundarios de contacto).',
  })
  secondaryContacts?: {
    name?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    relationship?: string;
  }[];
}
