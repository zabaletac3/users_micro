import { ApiProperty } from '@nestjs/swagger';

export class ImportPatientDto {
  @ApiProperty({
    type: String,
    required: true,
    example: '6931b22e9078fac94c48c84c',
    description: 'ID of the identified patient from another IPS to import into this company.',
  })
  targetPatientId: string;
}
