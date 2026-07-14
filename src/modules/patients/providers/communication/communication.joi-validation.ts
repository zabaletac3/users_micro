import * as Joi from 'joi';
import {
  ApplicantRelationshipEnum,
  CommunicationChannelEnum,
  CommunicationMediumEnum,
  RequirementTypeEnum,
} from './communication.enums';

const baseFields = {
  patientId: Joi.string().required(),
  companyId: Joi.string().required(),
  applicantRelationship: Joi.string()
    .valid(...Object.values(ApplicantRelationshipEnum))
    .required(),
  applicantName: Joi.string().required(),
  communicationChannel: Joi.string()
    .valid(...Object.values(CommunicationChannelEnum))
    .required(),
  requirementType: Joi.string()
    .valid(...Object.values(RequirementTypeEnum))
    .required(),
  phone: Joi.string().optional(),
  email: Joi.string().email().optional(),
};

export const createCommunicationSchema = Joi.object({
  ...baseFields,

  // ── CLINICAL_RECORD ─────────────────────────────────────────────────────
  communicationMedium: Joi.when('requirementType', {
    is: RequirementTypeEnum.CLINICAL_RECORD,
    then: Joi.string()
      .valid(...Object.values(CommunicationMediumEnum))
      .required(),
    otherwise: Joi.forbidden(),
  }),
  clinicalRecordIds: Joi.when('requirementType', {
    is: RequirementTypeEnum.CLINICAL_RECORD,
    then: Joi.array().items(Joi.string()).min(1).required(),
    otherwise: Joi.forbidden(),
  }),

  // ── REDIRECTION ──────────────────────────────────────────────────────────
  destinationArea: Joi.when('requirementType', {
    is: RequirementTypeEnum.REDIRECTION,
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),
  redirectionReason: Joi.when('requirementType', {
    is: RequirementTypeEnum.REDIRECTION,
    then: Joi.string().optional(),
    otherwise: Joi.forbidden(),
  }),

  // ── PATIENT_INFORMATION ──────────────────────────────────────────────────
  requestReason: Joi.when('requirementType', {
    is: RequirementTypeEnum.PATIENT_INFORMATION,
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),
  description: Joi.when('requirementType', {
    is: RequirementTypeEnum.PATIENT_INFORMATION,
    then: Joi.string().optional(),
    otherwise: Joi.forbidden(),
  }),

  // ── PQRS ─────────────────────────────────────────────────────────────────
  pqrsType: Joi.when('requirementType', {
    is: RequirementTypeEnum.PQRS,
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),
  relatedArea: Joi.when('requirementType', {
    is: RequirementTypeEnum.PQRS,
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),
  subject: Joi.when('requirementType', {
    is: RequirementTypeEnum.PQRS,
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),
  caseDescription: Joi.when('requirementType', {
    is: RequirementTypeEnum.PQRS,
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),
});
