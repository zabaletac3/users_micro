import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

export enum ProfileImageActionType {
  ADD = 'add',
  REMOVE = 'remove',
  REPLACE = 'replace',
}

export class AddOrRemoveDocumentDto {
  @ApiProperty({ type: String, required: true })
  action: string;
  @ApiProperty({ type: String, required: true, example: ['682b76e69a961be3f38ab49d'] })
  documentIds: string[];
}

export class HandleProfileImagesDto {
  @ApiProperty({
    type: String,
    required: true,
    example: 'https://example.com/images/profile.jpg',
    description: 'Image URL to add or the new image URL when replacing',
  })
  imageUrl: string;
  @ApiProperty({
    type: String,
    enum: ProfileImageActionType,
    required: true,
    example: ProfileImageActionType.ADD,
    description: 'Action to perform: add, remove, or replace',
  })
  action: ProfileImageActionType;
  @ApiProperty({
    type: String,
    required: false,
    example: 'https://example.com/images/old-profile.jpg',
    description: 'Old image URL to replace (required when action is "replace")',
  })
  oldImageUrl?: string;
}

export class HandlePositionDto {
  @ApiProperty({ type: String, required: true })
  action: string;

  @ApiProperty({ type: String, required: false, example: new Types.ObjectId() })
  positionId: string;

  @ApiProperty({ type: String, required: false, example: new Types.ObjectId() })
  oldPositionId: string;
}

export class UpdateEmployeeDto {
  @ApiProperty({ type: String, required: false })
  name: string;
  @ApiProperty({ type: String, required: false })
  lastName: string;
  @ApiProperty({ type: String, required: false })
  documentType: string;
  @ApiProperty({ type: String, required: false })
  documentNumber: string;
  @ApiProperty({ type: String, required: false })
  birthDate: string;
  @ApiProperty({ type: String, required: false })
  gender: string;
  @ApiProperty({ type: String, required: false })
  maritalStatus: string;
  @ApiProperty({ type: String, required: false })
  hiringDate: string;
  @ApiProperty({ type: String, required: false })
  email: string;
  @ApiProperty({ type: String, required: false })
  phone: string;
  @ApiProperty({ type: String, required: false })
  secondaryPhone: string;
  @ApiProperty({ type: String, required: false })
  address: string;
  @ApiProperty({ type: String, required: false })
  city: string;
  @ApiProperty({ type: String, required: false })
  country: string;
  @ApiProperty({ type: String, required: false })
  region: string;
  @ApiProperty({ type: [AddOrRemoveDocumentDto], required: false })
  addOrRemoveDocuments?: AddOrRemoveDocumentDto[];
  @ApiProperty({ type: HandleProfileImagesDto, required: false })
  handleProfileImages?: HandleProfileImagesDto;
  @ApiProperty({ type: HandlePositionDto, required: false })
  handlePosition?: HandlePositionDto;
  @ApiProperty({
    type: [String],
    required: false,
    example: ['682b76e69a961be3f38ab49d'],
    description: 'IDs de departamentos a agregar al empleado',
  })
  addDepartmentIds?: string[];

  @ApiProperty({
    type: [String],
    required: false,
    example: ['682b76e69a961be3f38ab49d'],
    description: 'IDs de departamentos a remover del empleado',
  })
  removeDepartmentIds?: string[];

  @ApiProperty({
    type: [String],
    required: false,
    example: ['682b76e69a961be3f38ab49d'],
    description: 'IDs de áreas a agregar al empleado',
  })
  addAreaIds?: string[];

  @ApiProperty({
    type: [String],
    required: false,
    example: ['682b76e69a961be3f38ab49d'],
    description: 'IDs de áreas a remover del empleado',
  })
  removeAreaIds?: string[];
}
