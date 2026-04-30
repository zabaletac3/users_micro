import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FindPatientByIdDto {
  @ApiProperty({ example: '6931b22e9078fac94c48c84c' })
  companyId: string;

  @ApiPropertyOptional({ example: 10 })
  patientHistoryLimit?: number;

  @ApiPropertyOptional({ example: 0 })
  patientHistorySkip?: number;

  @ApiPropertyOptional({ example: 'Consulta' })
  patientHistorySearch?: string;

  @ApiPropertyOptional({ example: 0 })
  documentSkip?: number;

  @ApiPropertyOptional({ example: 10 })
  documentLimit?: number;

  @ApiPropertyOptional({ example: 'Consulta' })
  documentSearch?: string;
}
