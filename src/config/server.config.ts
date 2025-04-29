import { registerAs } from '@nestjs/config';

export default registerAs('server', () => ({
  port: Number(process.env.SERVER_PORT) || 3000,
}));
