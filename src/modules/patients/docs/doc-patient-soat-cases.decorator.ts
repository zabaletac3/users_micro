import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import {
  PatientSoatCaseListResponseDto,
  PatientSoatCaseResponseDto,
} from '@shared/dto/patient-soat-case-response.dto';
import {
  CreatePatientSoatCaseDto,
  UpdatePatientSoatCaseDto,
} from '@shared/dto/patient-soat-case.dto';

import { ApiCompanyIdFromAuthContext } from './doc-company-context.decorator';

export function ApiListPatientSoatCases() {
  return applyDecorators(
    ApiCompanyIdFromAuthContext(),
    ApiOperation({
      summary: 'Listar casos SOAT del paciente',
      description:
        'Devuelve los expedientes SOAT del paciente para la IPS indicada, del más reciente al más antiguo.',
    }),
    ApiParam({ name: 'id', description: 'ID del paciente', example: '6931b22e9078fac94c48c84c' }),
    ApiOkResponse({
      description: 'Lista de casos SOAT.',
      type: PatientSoatCaseListResponseDto,
    }),
    ApiResponse({ status: 404, description: 'Paciente no encontrado.' }),
  );
}

export function ApiGetPatientSoatCaseById() {
  return applyDecorators(
    ApiCompanyIdFromAuthContext(),
    ApiOperation({ summary: 'Obtener un caso SOAT por ID' }),
    ApiParam({ name: 'id', description: 'ID del paciente' }),
    ApiParam({ name: 'soatCaseId', description: 'ID del caso SOAT' }),
    ApiOkResponse({
      description: 'Caso encontrado.',
      type: PatientSoatCaseResponseDto,
    }),
    ApiResponse({ status: 404, description: 'Paciente o caso no encontrado.' }),
  );
}

export function ApiCreatePatientSoatCase() {
  return applyDecorators(
    ApiCompanyIdFromAuthContext(),
    ApiOperation({
      summary: 'Registrar un caso SOAT',
      description:
        'Crea un nuevo expediente SOAT asociado al paciente e IPS. El cuerpo incluye el formulario completo.',
    }),
    ApiParam({ name: 'id', description: 'ID del paciente' }),
    ApiBody({ type: CreatePatientSoatCaseDto }),
    ApiCreatedResponse({
      description: 'Caso creado.',
      type: PatientSoatCaseResponseDto,
    }),
    ApiResponse({ status: 400, description: 'Datos inválidos.' }),
    ApiResponse({ status: 404, description: 'Paciente no encontrado.' }),
  );
}

export function ApiUpdatePatientSoatCase() {
  return applyDecorators(
    ApiCompanyIdFromAuthContext(),
    ApiOperation({
      summary: 'Actualizar un caso SOAT',
      description: 'Actualiza estado y/o reemplaza el formulario completo del caso.',
    }),
    ApiParam({ name: 'id', description: 'ID del paciente' }),
    ApiParam({ name: 'soatCaseId', description: 'ID del caso SOAT' }),
    ApiBody({ type: UpdatePatientSoatCaseDto }),
    ApiOkResponse({
      description: 'Caso actualizado.',
      type: PatientSoatCaseResponseDto,
    }),
    ApiResponse({ status: 404, description: 'Paciente o caso no encontrado.' }),
  );
}
