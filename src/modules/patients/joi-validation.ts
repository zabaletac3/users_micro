import * as Joi from 'joi';
import { Enums } from 'lideris-commoms-microservice';

const ObjectIdValidation = Joi.string()
  .regex(/^[0-9a-fA-F]{24}$/)
  .messages({
    'string.pattern.base': 'Invalid ObjectId format',
  });

// Condiciones reutilizables
const isNewborn = Joi.string().valid(Enums.PatientDocumentType.NEWBORN);
const isNNOrNewborn = Joi.string().valid(
  Enums.PatientDocumentType.NN,
  Enums.PatientDocumentType.NEWBORN,
);

const isSoat = Joi.string().valid(Enums.AgreementTypeEnum.SOAT);
const isParticularOrSoat = Joi.string().valid(
  Enums.AgreementTypeEnum.PARTICULAR,
  Enums.AgreementTypeEnum.SOAT,
);

export const PatientAffiliationSchema = Joi.object({
  agreementType: Joi.string()
    .required()
    .valid(...Object.values(Enums.AgreementTypeEnum)),
  payerId: Joi.when('agreementType', {
    is: isParticularOrSoat,
    then: ObjectIdValidation.optional(),
    otherwise: ObjectIdValidation.required(),
  }),
  regime: Joi.when('agreementType', {
    is: isSoat,
    then: Joi.string()
      .valid(...Object.values(Enums.RegimeEnum))
      .optional(),
    otherwise: Joi.string()
      .valid(...Object.values(Enums.RegimeEnum))
      .required(),
  }),
  affiliationType: Joi.when('agreementType', {
    is: isParticularOrSoat,
    then: Joi.string()
      .valid(...Object.values(Enums.AffiliationTypeEnum))
      .optional(),
    otherwise: Joi.string()
      .valid(...Object.values(Enums.AffiliationTypeEnum))
      .required(),
  }),
  startDate: Joi.date().optional(),
});

const NNCompanionSchema = Joi.object({
  name: Joi.string().optional(),
  lastName: Joi.string().optional(),
  phone: Joi.string().optional(),
  email: Joi.string().email().optional(),
});

const NNEntryInfoSchema = Joi.object({
  entryDate: Joi.date().optional(),
  entryTime: Joi.string().optional(),
  originPlace: Joi.string().optional(),
  transportedBy: Joi.string().optional(),
  ambulancePlate: Joi.string().optional(),
  registrationCity: Joi.string().optional(),
  entryReason: Joi.string().optional(),
  additionalObservations: Joi.string().optional(),
});

export const CreatePatientSchema = Joi.object({
  // Tenant Association
  companyId: ObjectIdValidation.required(),

  // Document type drives all conditional validation
  documentType: Joi.string()
    .required()
    .valid(...Object.values(Enums.PatientDocumentType)),

  // ── Fields: required for identified, optional for NN and NEWBORN ──────────

  documentNumber: Joi.when('documentType', {
    is: isNNOrNewborn,
    then: Joi.string().optional(),
    otherwise: Joi.string().required(),
  }),

  name: Joi.when('documentType', {
    is: isNNOrNewborn,
    then: Joi.string().optional(),
    otherwise: Joi.string().required(),
  }),

  lastName: Joi.when('documentType', {
    is: isNNOrNewborn,
    then: Joi.string().optional(),
    otherwise: Joi.string().required(),
  }),

  email: Joi.when('documentType', {
    is: isNNOrNewborn,
    then: Joi.string().email().optional(),
    otherwise: Joi.string().email().required(),
  }),

  bloodType: Joi.when('documentType', {
    is: isNNOrNewborn,
    then: Joi.string()
      .valid(...Object.values(Enums.BloodTypeEnum))
      .optional(),
    otherwise: Joi.string()
      .valid(...Object.values(Enums.BloodTypeEnum))
      .required(),
  }),

  maritalStatus: Joi.when('documentType', {
    is: isNNOrNewborn,
    then: Joi.string()
      .valid(...Object.values(Enums.MaritalStatusEnum))
      .optional(),
    otherwise: Joi.string()
      .valid(...Object.values(Enums.MaritalStatusEnum))
      .required(),
  }),

  occupation: Joi.when('documentType', {
    is: isNNOrNewborn,
    then: Joi.string().optional(),
    otherwise: Joi.string().required(),
  }),

  ethnicity: Joi.when('documentType', {
    is: isNNOrNewborn,
    then: Joi.string().optional(),
    otherwise: Joi.string().required(),
  }),

  disability: Joi.when('documentType', {
    is: isNNOrNewborn,
    then: Joi.string().optional(),
    otherwise: Joi.string().required(),
  }),

  emergencyContactName: Joi.when('documentType', {
    is: isNNOrNewborn,
    then: Joi.string().optional(),
    otherwise: Joi.string().required(),
  }),

  emergencyContactLastName: Joi.string().optional(),

  emergencyContactPhone: Joi.when('documentType', {
    is: isNNOrNewborn,
    then: Joi.string().optional(),
    otherwise: Joi.string().required(),
  }),

  emergencyContactRelation: Joi.when('documentType', {
    is: isNNOrNewborn,
    then: Joi.string().optional(),
    otherwise: Joi.string().required(),
  }),

  emergencyContactEmail: Joi.string().email().optional(),

  dataTreatmentAccepted: Joi.when('documentType', {
    is: isNNOrNewborn,
    then: Joi.boolean().optional(),
    otherwise: Joi.boolean().required(),
  }),

  // Affiliation: optional for NN and NEWBORN, required for identified
  affiliation: Joi.when('documentType', {
    is: isNNOrNewborn,
    then: PatientAffiliationSchema.optional(),
    otherwise: PatientAffiliationSchema.required(),
  }),

  // Documents
  documents: Joi.array().items(ObjectIdValidation).optional(),

  // ── Always optional fields ─────────────────────────────────────────────────

  middleName: Joi.string().optional(),
  secondLastName: Joi.string().optional(),
  birthDate: Joi.date().optional(),
  age: Joi.number().integer().min(0).optional(),
  gender: Joi.string()
    .optional()
    .valid(...Object.values(Enums.Gender)),
  phone: Joi.string().optional(),
  secondaryPhone: Joi.string().optional(),
  mainContactMethod: Joi.string()
    .optional()
    .valid(...Object.values(Enums.ContactMethodEnum)),
  address: Joi.string().optional(),
  city: Joi.string().optional(),
  region: Joi.string().optional(),
  country: Joi.string().optional(),
  neighborhood: Joi.string().optional(),
  residenceZone: Joi.string()
    .optional()
    .valid(...Object.values(Enums.ResidenceZoneEnum)),
  socioeconomicLevel: Joi.string()
    .optional()
    .valid(...Object.values(Enums.SocioeconomicLevelEnum)),
  vulnerabilityCondition: Joi.boolean().optional(),
  birthCountry: Joi.string().optional(),
  birthDepartment: Joi.string().optional(),
  birthCity: Joi.string().optional(),

  // ── NN-specific fields ─────────────────────────────────────────────────────

  entryCondition: Joi.string().optional(),
  approximateAge: Joi.string().optional(),
  physicalTraits: Joi.string().optional(),
  belongings: Joi.string().optional(),
  companion: NNCompanionSchema.optional(),
  entryInfo: NNEntryInfoSchema.optional(),

  // ── Newborn-specific fields ────────────────────────────────────────────────

  motherId: Joi.when('documentType', {
    is: isNewborn,
    then: ObjectIdValidation.required(),
    otherwise: ObjectIdValidation.optional(),
  }),

  birthPlace: Joi.when('documentType', {
    is: isNewborn,
    then: Joi.string()
      .valid(...Object.values(Enums.BirthPlaceEnum))
      .required(),
    otherwise: Joi.string()
      .valid(...Object.values(Enums.BirthPlaceEnum))
      .optional(),
  }),
  birthAddress: Joi.string().optional(),
  birthTime: Joi.when('documentType', {
    is: isNewborn,
    then: Joi.string().required(),
    otherwise: Joi.string().optional(),
  }),

  // ── Additional patient fields ──────────────────────────────────────────────

  educationLevel: Joi.string()
    .optional()
    .valid(...Object.values(Enums.EducationLevelEnum)),
  departmentCode: Joi.string().optional(),
  secondaryContacts: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().optional(),
        lastName: Joi.string().optional(),
        phone: Joi.string().optional(),
        email: Joi.string().email().optional(),
        relationship: Joi.string().optional(),
      }),
    )
    .optional(),
});

const SecondaryContactItemSchema = Joi.object({
  oldPhone: Joi.string().optional(),
  name: Joi.string().optional(),
  lastName: Joi.string().optional(),
  phone: Joi.string().optional(),
  email: Joi.string().email().optional(),
  relationship: Joi.string().optional(),
});

export const MergePatientSchema = Joi.object({
  targetPatientId: ObjectIdValidation.required(),
});

export const ImportPatientSchema = Joi.object({
  targetPatientId: ObjectIdValidation.required(),
});

export const IdentifyPatientSchema = Joi.object({
  // ── Required ───────────────────────────────────────────────────────────────
  documentType: Joi.string()
    .required()
    .valid(
      ...Object.values(Enums.PatientDocumentType).filter((v) => v !== Enums.PatientDocumentType.NN),
    ),
  documentNumber: Joi.string().required(),
  name: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  bloodType: Joi.string()
    .required()
    .valid(...Object.values(Enums.BloodTypeEnum)),
  maritalStatus: Joi.string()
    .required()
    .valid(...Object.values(Enums.MaritalStatusEnum)),
  occupation: Joi.string().required(),
  ethnicity: Joi.string().required(),
  disability: Joi.string().required(),
  emergencyContactName: Joi.string().required(),
  emergencyContactPhone: Joi.string().required(),
  emergencyContactRelation: Joi.string().required(),
  dataTreatmentAccepted: Joi.boolean().required(),
  affiliation: PatientAffiliationSchema.required(),

  // ── Optional ───────────────────────────────────────────────────────────────
  middleName: Joi.string().optional(),
  secondLastName: Joi.string().optional(),
  birthDate: Joi.date().optional(),
  age: Joi.number().integer().min(0).optional(),
  gender: Joi.string()
    .optional()
    .valid(...Object.values(Enums.Gender)),
  phone: Joi.string().optional(),
  secondaryPhone: Joi.string().optional(),
  mainContactMethod: Joi.string()
    .optional()
    .valid(...Object.values(Enums.ContactMethodEnum)),
  address: Joi.string().optional(),
  city: Joi.string().optional(),
  region: Joi.string().optional(),
  country: Joi.string().optional(),
  neighborhood: Joi.string().optional(),
  residenceZone: Joi.string()
    .optional()
    .valid(...Object.values(Enums.ResidenceZoneEnum)),
  socioeconomicLevel: Joi.string()
    .optional()
    .valid(...Object.values(Enums.SocioeconomicLevelEnum)),
  vulnerabilityCondition: Joi.boolean().optional(),
  birthCountry: Joi.string().optional(),
  birthDepartment: Joi.string().optional(),
  birthCity: Joi.string().optional(),
  emergencyContactLastName: Joi.string().optional(),
  emergencyContactEmail: Joi.string().email().optional(),
  educationLevel: Joi.string()
    .optional()
    .valid(...Object.values(Enums.EducationLevelEnum)),
  departmentCode: Joi.string().optional(),
});

export const UpdatePatientSchema = Joi.object({
  // ── Step 1: Basic info ─────────────────────────────────────────────────────
  documentType: Joi.string()
    .optional()
    .valid(...Object.values(Enums.PatientDocumentType)),
  documentNumber: Joi.string().optional(),
  name: Joi.string().optional(),
  middleName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  secondLastName: Joi.string().optional(),
  birthDate: Joi.date().optional(),
  age: Joi.number().integer().min(0).optional(),
  gender: Joi.string()
    .optional()
    .valid(...Object.values(Enums.Gender)),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  secondaryPhone: Joi.string().optional(),
  mainContactMethod: Joi.string()
    .optional()
    .valid(...Object.values(Enums.ContactMethodEnum)),
  address: Joi.string().optional(),
  city: Joi.string().optional(),
  region: Joi.string().optional(),
  country: Joi.string().optional(),
  neighborhood: Joi.string().optional(),
  residenceZone: Joi.string()
    .optional()
    .valid(...Object.values(Enums.ResidenceZoneEnum)),
  socioeconomicLevel: Joi.string()
    .optional()
    .valid(...Object.values(Enums.SocioeconomicLevelEnum)),
  vulnerabilityCondition: Joi.boolean().optional(),
  bloodType: Joi.string()
    .optional()
    .valid(...Object.values(Enums.BloodTypeEnum)),
  maritalStatus: Joi.string()
    .optional()
    .valid(...Object.values(Enums.MaritalStatusEnum)),
  occupation: Joi.string().optional(),
  ethnicity: Joi.string().optional(),
  disability: Joi.string().optional(),
  birthCountry: Joi.string().optional(),
  birthDepartment: Joi.string().optional(),
  birthCity: Joi.string().optional(),
  dataTreatmentAccepted: Joi.boolean().optional(),
  emergencyContactName: Joi.string().optional(),
  emergencyContactLastName: Joi.string().optional(),
  emergencyContactPhone: Joi.string().optional(),
  emergencyContactRelation: Joi.string().optional(),
  emergencyContactEmail: Joi.string().email().optional(),
  educationLevel: Joi.string()
    .optional()
    .valid(...Object.values(Enums.EducationLevelEnum)),
  departmentCode: Joi.string().optional(),
  birthTime: Joi.string().optional(),

  // ── Step 2: Affiliation ────────────────────────────────────────────────────
  affiliation: Joi.object({
    agreementType: Joi.string()
      .optional()
      .valid(...Object.values(Enums.AgreementTypeEnum)),
    payerId: ObjectIdValidation.optional(),
    regime: Joi.string()
      .optional()
      .valid(...Object.values(Enums.RegimeEnum)),
    affiliationType: Joi.string()
      .optional()
      .valid(...Object.values(Enums.AffiliationTypeEnum)),
    startDate: Joi.date().optional(),
  }).optional(),

  // ── Step 3: Documents ──────────────────────────────────────────────────────
  addOrRemoveDocuments: Joi.object({
    action: Joi.string().required().valid('add', 'remove'),
    documentIds: Joi.array().items(ObjectIdValidation).min(1).required(),
  }).optional(),

  // ── Step 4: Secondary contacts ─────────────────────────────────────────────
  addOrRemoveSecondaryContacts: Joi.object({
    action: Joi.string().required().valid('add', 'remove', 'update'),
    contacts: Joi.array().items(SecondaryContactItemSchema).min(1).required(),
  }).optional(),
});

const SoatVehicleOwnerJoiSchema = Joi.object({
  documentType: Joi.string()
    .required()
    .valid(...Object.values(Enums.PatientDocumentType)),
  documentNumber: Joi.string().required(),
  lastName: Joi.string().required(),
  secondLastName: Joi.string().optional(),
  name: Joi.string().required(),
  middleName: Joi.string().optional(),
  birthDate: Joi.date().required(),
  gender: Joi.string()
    .required()
    .valid(...Object.values(Enums.Gender)),
  phone: Joi.string().required(),
  email: Joi.string().email().required(),
  primaryContactMethod: Joi.string()
    .required()
    .valid(...Object.values(Enums.ContactMethodEnum)),
  residenceDepartment: Joi.string().required(),
  residenceMunicipality: Joi.string().required(),
  residenceZone: Joi.string()
    .required()
    .valid(...Object.values(Enums.ResidenceZoneEnum)),
  residenceAddress: Joi.string().required(),
  residenceDaneCode: Joi.string().required(),
});

const SoatVictimTransportCoverageJoiSchema = Joi.object({
  transportType: Joi.string()
    .required()
    .valid(...Object.values(Enums.VictimTransportTypeEnum)),
  transportVehicleBrand: Joi.string().required(),
  transportLicensePlate: Joi.string().required(),
  victimPickupLocation: Joi.string().required(),
  victimTransportDestination: Joi.string().required(),
  victimPickupZoneType: Joi.string()
    .required()
    .valid(...Object.values(Enums.ResidenceZoneEnum)),
});

const SoatFormJoiSchema = Joi.object({
  accidentRole: Joi.string().required(),
  daneCode: Joi.string().required(),
  eventNature: Joi.string()
    .required()
    .valid(...Object.values(Enums.EventNatureEnum)),
  occurrenceAddress: Joi.string().required(),
  eventDate: Joi.date().required(),
  approximateEventTime: Joi.string().required(),
  department: Joi.string().required(),
  municipality: Joi.string().required(),
  zone: Joi.string()
    .required()
    .valid(...Object.values(Enums.ResidenceZoneEnum)),
  eventDescription: Joi.string().optional().allow('', null),
  vehicleUse: Joi.string()
    .required()
    .valid(...Object.values(Enums.VehicleUseEnum)),
  involvedVehicleType: Joi.string()
    .required()
    .valid(...Object.values(Enums.InvolvedVehicleTypeEnum)),
  licensePlate: Joi.string().required(),
  vehicleBrand: Joi.string().required(),
  vehicleSOATStatus: Joi.string()
    .required()
    .valid(...Object.values(Enums.VehicleSOATStatusEnum)),
  authorityIntervention: Joi.string()
    .required()
    .valid(...Object.values(Enums.AuthorityInterventionEnum)),
  policyNumber: Joi.string().required(),
  soatValidityStartDate: Joi.date().optional().allow(null),
  soatValidityEndDate: Joi.date().optional().allow(null),
  insurerCode: Joi.string().required(),
  policyExcessCharge: Joi.string()
    .required()
    .valid(...Object.values(Enums.PolicyExcessChargeEnum)),
  isPatientVehicleOwner: Joi.boolean().optional(),
  vehicleOwner: SoatVehicleOwnerJoiSchema.optional(),
  vehicleDriver: SoatVehicleOwnerJoiSchema.optional(),
  victimTransportCoverage: SoatVictimTransportCoverageJoiSchema.optional(),
});

export const CreatePatientSoatCaseSchema = Joi.object({
  status: Joi.string()
    .optional()
    .valid(...Object.values(Enums.PatientSoatCaseStatusEnum)),
  form: SoatFormJoiSchema.required(),
});

export const UpdatePatientSoatCaseSchema = Joi.object({
  status: Joi.string()
    .optional()
    .valid(...Object.values(Enums.PatientSoatCaseStatusEnum)),
  form: SoatFormJoiSchema.optional(),
}).or('status', 'form');

const JudicialReferringIpsJoiSchema = Joi.object({
  name: Joi.string().optional().allow('', null),
  address: Joi.string().optional().allow('', null),
  phone: Joi.string().optional().allow('', null),
  email: Joi.string().email().optional().allow('', null),
});

/** IPS remitente: obligatorio cuando hay remisión desde otra IPS. */
const JudicialReferringIpsWhenRemissionJoiSchema = Joi.object({
  name: Joi.string().trim().required(),
  address: Joi.string().trim().required(),
  phone: Joi.string().trim().required(),
  email: Joi.string().email().required(),
});

const JudicialAuthorityNoticeBodyJoiSchema = Joi.object({
  soatCaseId: ObjectIdValidation.optional().allow(null),
  patientAdmissionDate: Joi.date().optional().allow(null),
  patientAdmissionTime: Joi.string().optional().allow('', null),
  victimReferredFromAnotherIps: Joi.boolean().optional(),
  // Si víctima con remisión, el bloque referringIps es obligatorio con datos completos.
  referringIps: Joi.when('victimReferredFromAnotherIps', {
    is: true,
    then: JudicialReferringIpsWhenRemissionJoiSchema.required(),
    otherwise: JudicialReferringIpsJoiSchema.optional().allow(null),
  }),
  careDetails: Joi.string().optional().allow('', null),
  injuriesOrConditionDescription: Joi.string().optional().allow('', null),
  treatmentsPerformed: Joi.string().optional().allow('', null),
  policeContactEmail: Joi.string().email().optional().allow('', null),
  prosecutorContactEmail: Joi.string().email().optional().allow('', null),
  noticeResponsibleName: Joi.string().optional().allow('', null),
  noticeResponsiblePosition: Joi.string().optional().allow('', null),
  ipsSignatureAndSeal: Joi.string().optional().allow('', null),
});

export const CreateJudicialAuthorityNoticeSchema = JudicialAuthorityNoticeBodyJoiSchema;

export const UpdateJudicialAuthorityNoticeSchema = JudicialAuthorityNoticeBodyJoiSchema.custom(
  (value, helpers) => {
    if (value == null || typeof value !== 'object' || Object.keys(value).length === 0) {
      return helpers.error('any.custom', {
        message: 'Debe enviar al menos un campo para actualizar el aviso judicial.',
      });
    }

    return value;
  },
);
