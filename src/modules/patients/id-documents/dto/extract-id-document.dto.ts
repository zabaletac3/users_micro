import { ApiProperty } from '@nestjs/swagger';

export class ExtractIdDocumentDto {
  @ApiProperty({
    type: String,
    example: 'https://example.com/cedula.jpg',
    description: 'URL pública de la imagen o PDF del documento de identidad.',
  })
  documentUrl: string;
}

export class ExtractIdDocumentResponseDto {
  @ApiProperty({ type: String, example: 'CC', description: 'Tipo de documento detectado.' })
  documentType: string;

  @ApiProperty({ type: String, example: '1020304050', description: 'Número de documento.' })
  documentNumber: string;

  @ApiProperty({ type: String, example: 'Juan', required: false })
  firstName?: string;

  @ApiProperty({ type: String, example: 'Carlos', required: false })
  middleName?: string;

  @ApiProperty({ type: String, example: 'Pérez', required: false })
  firstLastName?: string;

  @ApiProperty({ type: String, example: 'Gómez', required: false })
  secondLastName?: string;

  @ApiProperty({ type: String, example: '1990-05-15', required: false })
  birthDate?: string;

  @ApiProperty({ type: String, example: 'male', required: false })
  gender?: string;

  @ApiProperty({ type: String, example: 'O+', required: false })
  bloodType?: string;

  @ApiProperty({ type: String, example: 'Colombia', required: false })
  birthCountry?: string;

  @ApiProperty({ type: String, example: 'Atlántico', required: false })
  birthDepartment?: string;

  @ApiProperty({ type: String, example: 'Barranquilla', required: false })
  birthCity?: string;

  @ApiProperty({ type: String, example: '2018-03-10', required: false })
  expeditionDate?: string;

  @ApiProperty({ type: String, example: 'Barranquilla', required: false })
  expeditionPlace?: string;

  @ApiProperty({ type: Number, example: 175, required: false })
  height?: number;
}
