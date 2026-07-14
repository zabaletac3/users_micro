import {
  ApplicantRelationshipEnum,
  CommunicationChannelEnum,
  CommunicationMediumEnum,
  RequirementTypeEnum,
} from './communication.enums';

export interface BaseCreateCommunicationDto {
  patientId: string;
  companyId: string;
  applicantRelationship: ApplicantRelationshipEnum;
  applicantName: string;
  communicationChannel: CommunicationChannelEnum;
  requirementType: RequirementTypeEnum;
  phone?: string;
  email?: string;
}

export interface CreateClinicalRecordCommunicationDto extends BaseCreateCommunicationDto {
  requirementType: RequirementTypeEnum.CLINICAL_RECORD;
  communicationMedium: CommunicationMediumEnum;
  clinicalRecordIds: string[];
}

export interface CreateRedirectionCommunicationDto extends BaseCreateCommunicationDto {
  requirementType: RequirementTypeEnum.REDIRECTION;
  destinationArea: string;
  redirectionReason?: string;
}

export interface CreatePatientInformationCommunicationDto extends BaseCreateCommunicationDto {
  requirementType: RequirementTypeEnum.PATIENT_INFORMATION;
  requestReason: string;
  description?: string;
}

export interface CreatePqrsCommunicationDto extends BaseCreateCommunicationDto {
  requirementType: RequirementTypeEnum.PQRS;
  pqrsType: string;
  relatedArea: string;
  subject: string;
  caseDescription: string;
}

export type CreateCommunicationDto =
  | CreateClinicalRecordCommunicationDto
  | CreateRedirectionCommunicationDto
  | CreatePatientInformationCommunicationDto
  | CreatePqrsCommunicationDto;
