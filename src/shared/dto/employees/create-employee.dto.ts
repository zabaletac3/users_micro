import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

export class CreateEmployeeDto {
  @ApiProperty({ type: String, required: false, example: 'Manuel' })
  name: string;

  @ApiProperty({ type: String, required: false, example: 'Garcia' })
  lastName: string;

  @ApiProperty({ type: String, required: false, example: 'CC' })
  documentType: string;

  @ApiProperty({ type: String, required: false, example: '1234567890' })
  documentNumber: string;

  @ApiProperty({ type: Date, required: false, example: new Date() })
  birthDate: Date;

  @ApiProperty({ type: String, required: false, example: 'male' })
  gender: string;

  @ApiProperty({
    type: String,
    required: false,
    example: 'single',
  })
  maritalStatus: string;

  @ApiProperty({ type: String, required: false, example: new Types.ObjectId() })
  position: string;

  @ApiProperty({
    type: [String],
    required: true,
    example: ['682b76e69a961be3f38ab49d'],
    description: 'IDs de los departamentos a los que pertenece el empleado',
  })
  departmentIds: string[];

  @ApiProperty({
    type: [String],
    required: false,
    example: ['682b76e69a961be3f38ab49d'],
    description: 'IDs de las áreas a las que pertenece el empleado',
  })
  areaIds?: string[];

  @ApiProperty({ type: Date, required: false, example: new Date() })
  hiringDate: Date;

  @ApiProperty({ type: String, required: false, example: 'manuel.garcia@gmail.com' })
  email: string;

  @ApiProperty({ type: String, required: false, example: '3004563456' })
  phone: string;

  @ApiProperty({ type: String, required: false, example: '3004563456' })
  secondaryPhone: string;

  @ApiProperty({ type: String, required: false, example: 'Calle 123 # 45-67' })
  address: string;

  @ApiProperty({ type: String, required: false, example: 'Barranquilla' })
  city: string;

  @ApiProperty({ type: String, required: false, example: 'Colombia' })
  country: string;

  @ApiProperty({ type: String, required: false, example: 'Atlantico' })
  region: string;

  @ApiProperty({
    type: [String],
    required: false,
    example: [new Types.ObjectId(), new Types.ObjectId()],
  })
  documents: string[];

  @ApiProperty({
    type: [String],
    required: false,
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
  })
  profileImages: string[];
}
