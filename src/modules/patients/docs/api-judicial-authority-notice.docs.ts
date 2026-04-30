import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  JudicialAuthorityNoticeListResponseDto,
  JudicialAuthorityNoticeResponseDto,
} from '@shared/dto/judicial-authority-notice-response.dto';
import {
  CreateJudicialAuthorityNoticeDto,
  UpdateJudicialAuthorityNoticeDto,
} from '@shared/dto/judicial-authority-notice.dto';

import { ApiCompanyIdFromAuthContext } from './api-company-context.docs';

export function ApiListJudicialAuthorityNotices() {
  return applyDecorators(
    ApiCompanyIdFromAuthContext(),
    ApiTags('patients', 'judicial-authority-notices'),
    ApiOperation({
      summary: 'Listar avisos a la autoridad judicial del paciente',
      description:
        'Devuelve los registros de aviso judicial para el paciente e IPS. Opcionalmente filtra por expediente SOAT (`soatCaseId`).',
    }),
    ApiParam({ name: 'id', description: 'ID del paciente' }),
    ApiQuery({
      name: 'soatCaseId',
      required: false,
      type: String,
      description: 'Si se envía, solo avisos vinculados a ese caso SOAT.',
    }),
    ApiOkResponse({ type: JudicialAuthorityNoticeListResponseDto }),
    ApiResponse({ status: 404, description: 'Paciente no encontrado.' }),
  );
}

export function ApiGetJudicialAuthorityNoticeById() {
  return applyDecorators(
    ApiCompanyIdFromAuthContext(),
    ApiTags('patients', 'judicial-authority-notices'),
    ApiOperation({ summary: 'Obtener un aviso judicial por ID' }),
    ApiParam({ name: 'id', description: 'ID del paciente' }),
    ApiParam({ name: 'noticeId', description: 'ID del aviso judicial' }),
    ApiOkResponse({ type: JudicialAuthorityNoticeResponseDto }),
    ApiResponse({ status: 404, description: 'Paciente o aviso no encontrado.' }),
  );
}

export function ApiCreateJudicialAuthorityNotice() {
  return applyDecorators(
    ApiCompanyIdFromAuthContext(),
    ApiTags('patients', 'judicial-authority-notices'),
    ApiOperation({
      summary: 'Registrar aviso a la autoridad judicial',
      description:
        'Crea un nuevo aviso. Todos los campos del cuerpo son opcionales salvo reglas de negocio futuras. `soatCaseId` debe ser un caso SOAT del mismo paciente e IPS si se envía.',
    }),
    ApiParam({ name: 'id', description: 'ID del paciente' }),
    ApiBody({ type: CreateJudicialAuthorityNoticeDto }),
    ApiCreatedResponse({ type: JudicialAuthorityNoticeResponseDto }),
    ApiResponse({ status: 400, description: 'IDs inválidos o SOAT no coincide con paciente/IPS.' }),
    ApiResponse({ status: 404, description: 'Paciente no encontrado.' }),
  );
}

export function ApiUpdateJudicialAuthorityNotice() {
  return applyDecorators(
    ApiCompanyIdFromAuthContext(),
    ApiTags('patients', 'judicial-authority-notices'),
    ApiOperation({
      summary: 'Actualizar aviso judicial',
      description:
        'Actualiza campos enviados. Debe incluirse al menos un campo. `soatCaseId` null desvincula el caso SOAT.',
    }),
    ApiParam({ name: 'id', description: 'ID del paciente' }),
    ApiParam({ name: 'noticeId', description: 'ID del aviso judicial' }),
    ApiBody({ type: UpdateJudicialAuthorityNoticeDto }),
    ApiOkResponse({ type: JudicialAuthorityNoticeResponseDto }),
    ApiResponse({ status: 400, description: 'Datos inválidos o SOAT no coincide.' }),
    ApiResponse({ status: 404, description: 'Paciente o aviso no encontrado.' }),
  );
}
