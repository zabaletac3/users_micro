import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type PurchaseWorkflowHistoryDocument = HydratedDocument<PurchaseWorkflowHistory>;

@Schema({
  timestamps: true,
  collection: 'purchase_workflow_histories',
})
export class PurchaseWorkflowHistory {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  entityId: Types.ObjectId;

  @Prop({ type: String, required: true })
  entityType: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true })
  type: string;

  @Prop({ type: String, required: true })
  status: string;

  @Prop({ type: String, required: true })
  event: string;

  @Prop({ type: Date, required: true })
  timestamp: Date;
}

export const PurchaseWorkflowHistorySchema = SchemaFactory.createForClass(PurchaseWorkflowHistory);
