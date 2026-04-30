import { applyDecorators } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';

/**
 * La IPS se resuelve con `CurrentCompanyId` (commons): `authzContext.principal.companyIdSelected`
 * o cabeceras `x-company-id` / `company-id`.
 */
export function ApiCompanyIdFromAuthContext() {
  return applyDecorators(
    ApiHeader({
      name: 'x-company-id',
      required: false,
      description:
        'ObjectId de la IPS. Obligatorio si el JWT no define la compañía seleccionada (`companyIdSelected`). Alternativa equivalente: cabecera `company-id`.',
      schema: { type: 'string', example: '6931b22e9078fac94c48c84c' },
    }),
  );
}
