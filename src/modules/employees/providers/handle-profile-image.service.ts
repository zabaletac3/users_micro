import { Injectable } from '@nestjs/common';
import { UpdateQuery } from 'mongoose';
import { Schemas } from 'lideris-commoms-microservice';

@Injectable()
export class HandleProfileImageService {
  handle(
    action: 'add' | 'remove' | 'replace',
    imageUrl?: string,
    oldImageUrl?: string,
  ): Partial<UpdateQuery<Schemas.UserDocument>> {
    if (action === 'add' && imageUrl) {
      return { $push: { profileImages: imageUrl } };
    }

    if (action === 'remove' && imageUrl) {
      return { $pull: { profileImages: imageUrl } };
    }

    if (action === 'replace' && imageUrl && oldImageUrl) {
      return {
        $pull: { profileImages: oldImageUrl },
        $push: { profileImages: imageUrl },
      };
    }

    return {};
  }
}
