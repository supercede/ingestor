import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.use(compression());
  app.enableCors();

  const configService = app.get(ConfigService);
  const appName = configService.get('app.name');
  const port = configService.get('server.port');

  await app.listen(port, () => {
    console.log(
      `Application ${appName} is running on: http://localhost:${port}`,
    );
  });
}

void bootstrap();
