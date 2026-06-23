import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

export enum EmployeeStatusAction {
  ACTIVATE = 'activate',
  DESACTIVATE = 'desactivate',
}

export class HandleEmployeeStatusDto {
  @ApiProperty({
    enum: EmployeeStatusAction,
    description: 'Action to perform on employee status',
    required: true,
    example: EmployeeStatusAction.ACTIVATE,
  })
  action: EmployeeStatusAction;

  @ApiProperty({
    type: String,
    required: true,
    description: 'Justification for the action',
    example: 'Employee was on leave',
  })
  justification: string;

  @ApiProperty({
    type: [String],
    required: false,
    description: 'Documents for the action',
    example: [new Types.ObjectId(), new Types.ObjectId()],
  })
  documents: string[];
}
