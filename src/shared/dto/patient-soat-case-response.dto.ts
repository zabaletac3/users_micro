import { ApiProperty } from '@nestjs/swagger';
import { Enums, Schemas } from 'lideris-commoms-microservice';

/** Respuesta de un expediente SOAT (listado, detalle, creación, actualización). */
export class PatientSoatCaseResponseDto {
  @ApiProperty({ example: '6931b22e9078fac94c48c84c' })
  _id: string;

  @ApiProperty({ example: '6931b22e9078fac94c48c84c' })
  companyId: string;

  @ApiProperty({ example: '6931b22e9078fac94c48c84c' })
  patientId: string;

  @ApiProperty({
    enum: Enums.PatientSoatCaseStatusEnum,
    example: Enums.PatientSoatCaseStatusEnum.DRAFT,
  })
  status: Enums.PatientSoatCaseStatusEnum;

  @ApiProperty({ type: Schemas.SOATData })
  form: Schemas.SOATData;

  @ApiProperty({ example: '2025-04-21T12:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2025-04-21T12:00:00.000Z' })
  updatedAt: string;
}

/** Respuesta del listado de casos SOAT. */
export class PatientSoatCaseListResponseDto {
  @ApiProperty({ type: [PatientSoatCaseResponseDto] })
  items: PatientSoatCaseResponseDto[];
}
