import { registerAs } from '@nestjs/config';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export default registerAs('app', () => ({
  name: process.env.APP_NAME,
  env: (process.env.NODE_ENV as Environment) || Environment.Development,
}));
