import { ApiProperty } from '@nestjs/swagger';
import { Enums } from 'lideris-commoms-microservice';

export class AddOrRemoveDocumentDto {
  @ApiProperty({ type: String, required: true, enum: Enums.AddOrRemoveQuery })
  action: Enums.AddOrRemoveQuery;
  @ApiProperty({ type: String, required: true, example: ['682b76e69a961be3f38ab49d'] })
  documentIds: string[];
}
