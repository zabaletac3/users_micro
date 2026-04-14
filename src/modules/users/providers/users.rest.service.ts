import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Schemas, Utils } from 'lideris-commoms-microservice';
import { Model, Types } from 'mongoose';

const ACTIVE_FILTER = { isActive: true, deletedAt: null };

@Injectable()
export class UsersService {
  constructor(@InjectModel(Schemas.User.name) private userModel: Model<Schemas.User>) {}

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.userModel.find(ACTIVE_FILTER).skip(skip).limit(limit).select('-password').lean().exec(),
      this.userModel.countDocuments(ACTIVE_FILTER).exec(),
    ]);

    return { users, total, page, limit };
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }

    const user = await this.userModel
      .findOne({ _id: id, ...ACTIVE_FILTER })
      .select('-password')
      .lean()
      .exec();

    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }

    return user;
  }

  async findByEmail(email: string) {
    const user = await this.userModel
      .findOne({ email, ...ACTIVE_FILTER })
      .select('-password')
      .lean()
      .exec();

    if (!user) {
      throw new NotFoundException(`User with email "${email}" not found`);
    }

    return user;
  }

  async create(data: {
    fullName: string;
    userName: string;
    email: string;
    password: string;
    phone?: string;
    gender?: string;
  }) {
    const hashedPassword = await Utils.hashPassword(data.password);

    try {
      const user = new this.userModel({ ...data, password: hashedPassword });
      const saved = await user.save();

      return this.findById(saved._id.toString());
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code: number }).code === 11000
      ) {
        throw new ConflictException('A user with this email already exists');
      }
      throw err;
    }
  }

  async update(id: string, data: Partial<{ fullName: string; phone: string; gender: string }>) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }

    const user = await this.userModel
      .findOneAndUpdate({ _id: id, ...ACTIVE_FILTER }, { $set: data }, { new: true })
      .select('-password')
      .lean()
      .exec();

    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }

    return user;
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }

    const user = await this.userModel
      .findOneAndUpdate(
        { _id: id, ...ACTIVE_FILTER },
        { $set: { deletedAt: new Date(), isActive: false } },
        { new: true },
      )
      .select('-password')
      .lean()
      .exec();

    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }

    return user;
  }
}
