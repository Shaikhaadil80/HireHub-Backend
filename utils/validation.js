const Joi = require('joi');
const validator = require('validator');

// Common validation patterns
const patterns = {
  mobileNo: /^\d{10}$/,
  userName: /^[a-zA-Z0-9_]+$/,
  uid: /^user_[\w]+_[\w]+$/
};

// User registration validation
const registerValidation = (data) => {
  const schema = Joi.object({
    userName: Joi.string()
      .min(3)
      .max(20)
      .pattern(patterns.userName)
      .required()
      .messages({
        'string.pattern.base': 'Username can only contain letters, numbers, and underscores',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username cannot exceed 20 characters',
        'any.required': 'Username is required'
      }),

    email: Joi.string()
      .email()
      .max(50)
      .required()
      .custom((value, helpers) => {
        if (!validator.isEmail(value)) {
          return helpers.error('any.invalid');
        }
        return value;
      }, 'Email validation')
      .messages({
        'string.email': 'Please provide a valid email',
        'string.max': 'Email cannot exceed 50 characters',
        'any.required': 'Email is required'
      }),

    // password: Joi.string()
    //   .min(6)
    //   .required()
    //   .messages({
    //     'string.min': 'Password must be at least 6 characters long',
    //     'any.required': 'Password is required'
    //   }),

    // confirmPassword: Joi.string()
    //   .valid(Joi.ref('password'))
    //   .required()
    //   .messages({
    //     'any.only': 'Passwords do not match',
    //     'any.required': 'Please confirm your password'
    //   }),

    userType: Joi.string()
      .valid('candidate', 'employer', 'admin')
      .required()
      .messages({
        'any.only': 'User type must be candidate, employer, or admin',
        'any.required': 'User type is required'
      }),

    mobileNo: Joi.string()
      .pattern(patterns.mobileNo)
      .required()
      .messages({
        'string.pattern.base': 'Mobile number must be exactly 10 digits',
        'any.required': 'Mobile number is required'
      })
  });

  return schema.validate(data, { abortEarly: false });
};

// User login validation
const loginValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  return schema.validate(data, { abortEarly: false });
};

// User update validation
const updateUserValidation = (data) => {
  const schema = Joi.object({
    userName: Joi.string()
      .min(3)
      .max(20)
      .pattern(patterns.userName)
      .messages({
        'string.pattern.base': 'Username can only contain letters, numbers, and underscores'
      }),

    email: Joi.string()
      .email()
      .max(50)
      .custom((value, helpers) => {
        if (!validator.isEmail(value)) {
          return helpers.error('any.invalid');
        }
        return value;
      }),

    mobileNo: Joi.string()
      .pattern(patterns.mobileNo)
      .messages({
        'string.pattern.base': 'Mobile number must be exactly 10 digits'
      }),

    userType: Joi.string()
      .valid('candidate', 'employer', 'admin'),

    profileImageUrl: Joi.string()
      .uri()
      .allow(''),

    profileImageThumbUrl: Joi.string()
      .uri()
      .allow(''),

    subscriptionTillDate: Joi.date()
      .greater('now')
      .messages({
        'date.greater': 'Subscription date must be in the future'
      }),

    subscriptionId: Joi.string()
      .max(50),

    isActive: Joi.boolean()
  });

  return schema.validate(data, { abortEarly: false });
};

module.exports = {
  registerValidation,
  loginValidation,
  updateUserValidation,
  patterns
};