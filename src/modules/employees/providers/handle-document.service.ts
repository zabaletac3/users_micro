import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, UpdateQuery } from 'mongoose';
import { Schemas } from 'lideris-commoms-microservice';
import { I18nKeys } from '@shared/constants/i18n-keys.constants';

@Injectable()
export class HandleDocumentService {
  constructor(
    @InjectModel(Schemas.Document.name)
    private readonly documentModel: Model<Schemas.DocumentDocument>,
  ) {}

  async handle(
    action: 'add' | 'remove',
    documentIds: string[],
  ): Promise<Partial<UpdateQuery<Schemas.UserDocument>>> {
    if (!documentIds?.length) return {};

    if (action === 'add') {
      const docsExist = await this.documentModel.exists({
        _id: { $in: documentIds.map((id) => new Types.ObjectId(id)) },
      });

      if (!docsExist) {
        throw new NotFoundException(`${I18nKeys.DOCUMENT_NOT_FOUND}: ${documentIds.join(', ')}`);
      }

      return {
        $addToSet: {
          documents: { $each: documentIds.map((id) => new Types.ObjectId(id)) },
        },
      };
    }

    if (action === 'remove') {
      return {
        $pull: {
          documents: { $in: documentIds.map((id) => new Types.ObjectId(id)) },
        },
      };
    }

    return {};
  }
}
