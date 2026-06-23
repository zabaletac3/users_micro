import { ApiProperty } from '@nestjs/swagger';

class SubSpecialtyPopulated {
  @ApiProperty({ example: '6a24516a5dd707852d90a39d' })
  _id: string;

  @ApiProperty({ example: 'Cardiología' })
  name: string;
}

class PositionPopulated {
  @ApiProperty({ example: '69ea6a7fd3bac07bfc93ad87' })
  _id: string;

  @ApiProperty({ example: 'Doctor' })
  name: string;
}

class EntityPopulated {
  @ApiProperty({ example: '69d7f5c6adf7a06cac546bf1' })
  _id: string;

  @ApiProperty({ example: 'Cirugía general' })
  name: string;
}

export class EmployeeResponseDto {
  @ApiProperty({ example: '6a076e8dbd4f50a897804854' })
  _id: string;

  @ApiProperty({ example: 'Manuel' })
  name: string;

  @ApiProperty({ example: 'Garcia' })
  lastName: string;

  @ApiProperty({ example: 'SINGLE' })
  maritalStatus: string;

  @ApiProperty({ example: 'Male' })
  gender: string;

  @ApiProperty({ example: 'manuel.garcia@gmail.com' })
  email: string;

  @ApiProperty({ example: 'CC' })
  documentType: string;

  @ApiProperty({ example: '12341234' })
  documentNumber: string;

  @ApiProperty({ example: '3004563456' })
  phone: string;

  @ApiProperty({ example: '2026-05-13T19:09:41.829Z' })
  hiringDate: string;

  @ApiProperty({ type: [PositionPopulated] })
  position: PositionPopulated[];

  @ApiProperty({ type: [EntityPopulated] })
  departmentIds: EntityPopulated[];

  @ApiProperty({ type: [EntityPopulated] })
  areaIds: EntityPopulated[];

  @ApiProperty({
    type: [SubSpecialtyPopulated],
    example: [{ _id: '6a24516c5dd707852d90a3b3', name: 'Nutrición y Dietética' }],
    description: 'Medical specialties (populated with name). Empty array if none.',
  })
  subSpecialtyIds: SubSpecialtyPopulated[];

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 'EMP-4854' })
  serial: string;

  @ApiProperty({ example: 'Manuel Garcia' })
  fullName: string;

  @ApiProperty({ example: '2026-05-15T19:05:49.383Z' })
  createdAt: string;
}

class CursorPagination {
  @ApiProperty({ example: 20, description: 'Items per page requested' })
  pageSize: number;

  @ApiProperty({
    example: '6a076e8dbd4f50a897804854',
    nullable: true,
    description:
      'Cursor for next page of cursor-based pagination. Pass this value as ?cursor= in next request. null = no more pages.',
  })
  nextCursor: string | null;

  @ApiProperty({
    example: 'cursor',
    description: "'cursor' for cursor-based, 'offset' for page-based pagination",
  })
  mode: string;

  @ApiProperty({ example: 1, description: 'Current page (offset mode only)' })
  page?: number;

  @ApiProperty({ example: 3, description: 'Total matched records (offset mode only)' })
  total?: number;

  @ApiProperty({ example: 1, description: 'Total pages (offset mode only)' })
  totalPages?: number;
}

export class EmployeeListResponseDto {
  @ApiProperty({ type: [EmployeeResponseDto] })
  items: EmployeeResponseDto[];

  @ApiProperty({ type: CursorPagination })
  pagination: CursorPagination;
}
