import * as Joi from 'joi';
import { Enums } from 'lideris-commoms-microservice';

export const createEmployeeSchema = Joi.object({
  name: Joi.string().required(),
  lastName: Joi.string().required(),
  middleName: Joi.string().optional().allow('', null),
  secondLastName: Joi.string().optional().allow('', null),
  email: Joi.string().email().required(),
  documentType: Joi.string().required(),
  documentNumber: Joi.string().required(),
  birthDate: Joi.date().iso().optional().allow(null),
  gender: Joi.string()
    .valid(...Object.values(Enums.Gender))
    .optional()
    .allow('', null),
  maritalStatus: Joi.string()
    .valid(...Object.values(Enums.MaritalStatusEnum))
    .optional()
    .allow('', null),
  phone: Joi.string().optional().allow('', null),
  secondaryPhone: Joi.string().optional().allow('', null),
  address: Joi.string().optional().allow('', null),
  city: Joi.string().optional().allow('', null),
  country: Joi.string().optional().allow('', null),
  region: Joi.string().optional().allow('', null),
  hiringDate: Joi.date().iso().optional().allow(null),
  position: Joi.string().hex().length(24).optional().allow('', null),
  positionIds: Joi.array().items(Joi.string().hex().length(24)).optional(),
  departmentIds: Joi.array().items(Joi.string().hex().length(24)).min(1).required(),
  areaIds: Joi.array().items(Joi.string().hex().length(24)).optional(),
  documents: Joi.array().items(Joi.string().hex().length(24)).optional(),
  profileImages: Joi.array().items(Joi.string()).optional(),
});

export const updateEmployeeSchema = Joi.object({
  name: Joi.string().optional(),
  lastName: Joi.string().optional(),
  middleName: Joi.string().optional().allow('', null),
  secondLastName: Joi.string().optional().allow('', null),
  documentType: Joi.string().optional(),
  documentNumber: Joi.string().optional(),
  birthDate: Joi.date().iso().optional().allow(null),
  gender: Joi.string().valid('male', 'female', 'other').optional().allow('', null),
  maritalStatus: Joi.string()
    .valid('single', 'married', 'divorced', 'widowed', 'separated', 'couple')
    .optional()
    .allow('', null),
  hiringDate: Joi.date().iso().optional().allow(null),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional().allow('', null),
  secondaryPhone: Joi.string().optional().allow('', null),
  address: Joi.string().optional().allow('', null),
  city: Joi.string().optional().allow('', null),
  country: Joi.string().optional().allow('', null),
  region: Joi.string().optional().allow('', null),
  addOrRemoveDocuments: Joi.array()
    .items(
      Joi.object({
        action: Joi.string().valid('add', 'remove').required(),
        documentIds: Joi.array().items(Joi.string().hex().length(24)).required(),
      }),
    )
    .optional(),
  handleProfileImages: Joi.object({
    action: Joi.string().valid('add', 'remove', 'replace').required(),
    imageUrl: Joi.string().required(),
    oldImageUrl: Joi.string().optional(),
  }).optional(),
  handlePosition: Joi.object({
    action: Joi.string().valid('add', 'remove', 'replace').required(),
    positionId: Joi.string().hex().length(24).required(),
    oldPositionId: Joi.string().hex().length(24).optional(),
  }).optional(),
  addDepartmentIds: Joi.array().items(Joi.string().hex().length(24)).optional(),
  removeDepartmentIds: Joi.array().items(Joi.string().hex().length(24)).optional(),
  addAreaIds: Joi.array().items(Joi.string().hex().length(24)).optional(),
  removeAreaIds: Joi.array().items(Joi.string().hex().length(24)).optional(),
});

export const handleEmployeeStatusSchema = Joi.object({
  action: Joi.string().valid('activate', 'desactivate').required(),
  justification: Joi.string().required(),
  documents: Joi.array().items(Joi.string().hex().length(24)).optional(),
});

export const listEmployeesSchema = Joi.object({
  page: Joi.alternatives().try(Joi.number().integer().min(1), Joi.string()).optional(),
  pageSize: Joi.alternatives().try(Joi.number().integer().min(1).max(100), Joi.string()).optional(),
  cursor: Joi.string().optional(),
  sort: Joi.string().optional(),
  q: Joi.string().optional().allow(''),
  name: Joi.string().optional().allow(''),
  lastName: Joi.string().optional().allow(''),
  email: Joi.string().optional().allow(''),
  documentNumber: Joi.string().optional().allow(''),
  documentType: Joi.string().optional().allow(''),
  isActive: Joi.alternatives().try(Joi.boolean(), Joi.string()).optional(),
  gender: Joi.string().optional().allow(''),
  maritalStatus: Joi.string().optional().allow(''),
  position: Joi.string().optional().allow(''),
  departmentIds: Joi.string().optional().allow(''),
  areaIds: Joi.string().optional().allow(''),
  serial: Joi.string().optional().allow(''),
  positionTypes: Joi.string().optional().allow(''),
  hiringDateFrom: Joi.string().optional().allow(''),
  hiringDateTo: Joi.string().optional().allow(''),
});
