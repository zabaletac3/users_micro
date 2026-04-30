import { ApiProperty } from '@nestjs/swagger';

export class MergePatientDto {
  @ApiProperty({
    type: String,
    required: true,
    example: '6931b22e9078fac94c48c84c',
    description: 'ID of the identified patient that the NN will be merged into.',
  })
  targetPatientId: string;
}
