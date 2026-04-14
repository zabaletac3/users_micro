import * as Joi from 'joi';

export const createUserSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).required(),
  userName: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  phone: Joi.string().optional().allow(''),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
});

export const updateUserSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().optional().allow(''),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
}).min(1);
