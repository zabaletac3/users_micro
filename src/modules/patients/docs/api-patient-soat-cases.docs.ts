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

export function ApiListPatientSoatCases() {
  return applyDecorators(
    ApiOperation({
      summary: 'Listar casos SOAT del paciente',
      description:
        'Devuelve los expedientes SOAT del paciente para la IPS indicada, del más reciente al más antiguo.',
    }),
    ApiParam({ name: 'id', description: 'ID del paciente', example: '6931b22e9078fac94c48c84c' }),
    ApiQuery({
      name: 'companyId',
      required: true,
      type: String,
      description: 'ID de la empresa (IPS) a la que pertenece el paciente.',
    }),
    ApiOkResponse({
      description: 'Lista de casos SOAT.',
      type: PatientSoatCaseListResponseDto,
    }),
    ApiResponse({ status: 404, description: 'Paciente no encontrado.' }),
  );
}

export function ApiGetPatientSoatCaseById() {
  return applyDecorators(
    ApiOperation({ summary: 'Obtener un caso SOAT por ID' }),
    ApiParam({ name: 'id', description: 'ID del paciente' }),
    ApiParam({ name: 'soatCaseId', description: 'ID del caso SOAT' }),
    ApiQuery({ name: 'companyId', required: true, type: String, description: 'ID de la IPS.' }),
    ApiOkResponse({
      description: 'Caso encontrado.',
      type: PatientSoatCaseResponseDto,
    }),
    ApiResponse({ status: 404, description: 'Paciente o caso no encontrado.' }),
  );
}

export function ApiCreatePatientSoatCase() {
  return applyDecorators(
    ApiOperation({
      summary: 'Registrar un caso SOAT',
      description:
        'Crea un nuevo expediente SOAT asociado al paciente e IPS. El cuerpo incluye el formulario completo.',
    }),
    ApiParam({ name: 'id', description: 'ID del paciente' }),
    ApiQuery({ name: 'companyId', required: true, type: String, description: 'ID de la IPS.' }),
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
    ApiOperation({
      summary: 'Actualizar un caso SOAT',
      description: 'Actualiza estado y/o reemplaza el formulario completo del caso.',
    }),
    ApiParam({ name: 'id', description: 'ID del paciente' }),
    ApiParam({ name: 'soatCaseId', description: 'ID del caso SOAT' }),
    ApiQuery({ name: 'companyId', required: true, type: String, description: 'ID de la IPS.' }),
    ApiBody({ type: UpdatePatientSoatCaseDto }),
    ApiOkResponse({
      description: 'Caso actualizado.',
      type: PatientSoatCaseResponseDto,
    }),
    ApiResponse({ status: 404, description: 'Paciente o caso no encontrado.' }),
  );
}
