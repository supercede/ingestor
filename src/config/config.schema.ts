import * as Joi from 'joi';
import { Environment } from './app.config';

export const validationSchema = Joi.object({
  APP_NAME: Joi.string().default('nest-ingestion-demo'),
  NODE_ENV: Joi.string()
    .valid(...Object.values(Environment))
    .default(Environment.Development),
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().optional(),
  DB_URL: Joi.string().uri().required(),
  SERVER_PORT: Joi.number().default(3000),
});
