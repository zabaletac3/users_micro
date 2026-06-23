import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type StatusChangeHistoryDocument = HydratedDocument<StatusChangeHistory>;

@Schema({ timestamps: true, collection: 'status_change_histories' })
export class StatusChangeHistory {
  @Prop({ type: String, required: true })
  action: string;

  @Prop({ required: true })
  justification: string;

  @Prop({ type: [SchemaTypes.ObjectId], ref: 'Document', required: false })
  documents?: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  changedBy: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  changedAt: Date;

  @Prop({ type: Boolean, required: true })
  previousStatus: boolean;

  @Prop({ type: Boolean, required: true })
  newStatus: boolean;

  @Prop({ type: String, default: 'StatusChangeHistory' })
  historyType: string;
}

export const StatusChangeHistorySchema = SchemaFactory.createForClass(StatusChangeHistory);
