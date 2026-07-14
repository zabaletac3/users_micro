import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ApplicantRelationshipEnum,
  CommunicationChannelEnum,
  CommunicationMediumEnum,
  CommunicationStatusEnum,
  RequirementTypeEnum,
} from '../modules/patients/providers/communication/communication.enums';

// ── Base ──────────────────────────────────────────────────────────────────────

export class BaseCreateCommunicationDto {
  @ApiProperty({
    enum: RequirementTypeEnum,
    example: RequirementTypeEnum.PQRS,
    description: 'Type of communication requirement.',
  })
  requirementType: RequirementTypeEnum;

  @ApiProperty({
    enum: ApplicantRelationshipEnum,
    example: ApplicantRelationshipEnum.SELF,
    description: 'Relationship of the applicant to the patient.',
  })
  applicantRelationship: ApplicantRelationshipEnum;

  @ApiProperty({
    type: String,
    example: 'John Doe',
    description: 'Full name of the applicant.',
  })
  applicantName: string;

  @ApiProperty({
    enum: CommunicationChannelEnum,
    example: CommunicationChannelEnum.PHONE,
    description: 'Channel used to receive the communication.',
  })
  communicationChannel: CommunicationChannelEnum;

  @ApiPropertyOptional({
    type: String,
    example: '3001234567',
    description: 'Contact phone number of the applicant.',
  })
  phone?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'john.doe@email.com',
    description: 'Contact email of the applicant.',
  })
  email?: string;
}

// ── Clinical Record ───────────────────────────────────────────────────────────

export class CreateClinicalRecordCommunicationDto extends BaseCreateCommunicationDto {
  @ApiProperty({
    enum: CommunicationMediumEnum,
    example: CommunicationMediumEnum.EMAIL,
    description: 'Medium through which the clinical record will be sent.',
  })
  communicationMedium: CommunicationMediumEnum;

  @ApiProperty({
    type: [String],
    example: ['6931b22e9078fac94c48c84c'],
    description: 'List of clinical record event IDs to include.',
  })
  clinicalRecordIds: string[];
}

// ── Redirection ───────────────────────────────────────────────────────────────

export class CreateRedirectionCommunicationDto extends BaseCreateCommunicationDto {
  @ApiProperty({
    type: String,
    example: 'Cardiology',
    description: 'Target area or service to redirect the patient to.',
  })
  destinationArea: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Patient requires specialist evaluation.',
    description: 'Reason for the redirection.',
  })
  redirectionReason?: string;
}

// ── Patient Information ───────────────────────────────────────────────────────

export class CreatePatientInformationCommunicationDto extends BaseCreateCommunicationDto {
  @ApiProperty({
    type: String,
    example: 'ORDER_INFORMATION',
    description: 'Reason for the information request.',
  })
  requestReason: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Patient is requesting details about their last medical order.',
    description: 'Additional description for the request.',
  })
  description?: string;
}

// ── PQRS ──────────────────────────────────────────────────────────────────────

export class CreatePqrsCommunicationDto extends BaseCreateCommunicationDto {
  @ApiProperty({
    type: String,
    example: 'COMPLAINT',
    description: 'Type of PQRS (Petition, Complaint, Claim, or Suggestion).',
  })
  pqrsType: string;

  @ApiProperty({
    type: String,
    example: 'Emergency',
    description: 'Area or service related to the PQRS.',
  })
  relatedArea: string;

  @ApiProperty({
    type: String,
    example: 'Delay in care',
    description: 'Subject of the PQRS.',
  })
  subject: string;

  @ApiProperty({
    type: String,
    example: 'Patient waited more than 2 hours without being attended.',
    description: 'Detailed description of the case.',
  })
  caseDescription: string;
}

// ── Update Status ─────────────────────────────────────────────────────────────

export class UpdateCommunicationStatusDto {
  @ApiProperty({
    enum: CommunicationStatusEnum,
    example: CommunicationStatusEnum.COMPLETED,
    description: 'New status for the communication record.',
  })
  status: CommunicationStatusEnum;

  @ApiPropertyOptional({
    type: String,
    example: 'Request was fulfilled and sent via email.',
    description: 'Additional observations when updating the status.',
  })
  observations?: string;
}

// ── Union type used by services ───────────────────────────────────────────────

export type CreateCommunicationDto =
  | CreateClinicalRecordCommunicationDto
  | CreateRedirectionCommunicationDto
  | CreatePatientInformationCommunicationDto
  | CreatePqrsCommunicationDto;
