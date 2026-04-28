import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Enums, Schemas } from 'lideris-commoms-microservice';

export class CreatePatientSoatCaseDto {
  @ApiPropertyOptional({
    enum: Enums.PatientSoatCaseStatusEnum,
    example: Enums.PatientSoatCaseStatusEnum.DRAFT,
    description: 'Si se omite, se guarda como borrador.',
  })
  status?: Enums.PatientSoatCaseStatusEnum;

  @ApiProperty({ type: Schemas.SOATData, description: 'Payload completo del formulario SOAT.' })
  form: Schemas.SOATData;
}

export class UpdatePatientSoatCaseDto {
  @ApiPropertyOptional({
    enum: Enums.PatientSoatCaseStatusEnum,
    example: Enums.PatientSoatCaseStatusEnum.SUBMITTED,
  })
  status?: Enums.PatientSoatCaseStatusEnum;

  @ApiPropertyOptional({
    type: Schemas.SOATData,
    description: 'Reemplaza el formulario completo si se envía.',
  })
  form?: Schemas.SOATData;
}
