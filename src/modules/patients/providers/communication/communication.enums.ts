export enum RequirementTypeEnum {
  CLINICAL_RECORD = 'CLINICAL_RECORD',
  REDIRECTION = 'REDIRECTION',
  PATIENT_INFORMATION = 'PATIENT_INFORMATION',
  PQRS = 'PQRS',
}

export enum CommunicationStatusEnum {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  ESCALATED = 'ESCALATED',
}

export enum CommunicationChannelEnum {
  PHONE = 'PHONE',
  EMAIL = 'EMAIL',
  IN_PERSON = 'IN_PERSON',
  VIRTUAL = 'VIRTUAL',
}

export enum ApplicantRelationshipEnum {
  SELF = 'SELF',
  PARENT = 'PARENT',
  SPOUSE = 'SPOUSE',
  GUARDIAN = 'GUARDIAN',
  OTHER = 'OTHER',
}

export enum CommunicationMediumEnum {
  EMAIL = 'EMAIL',
  PHYSICAL = 'PHYSICAL',
  DIGITAL = 'DIGITAL',
}
