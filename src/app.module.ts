import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import appConfig from './config/app.config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import redisConfig from './config/redis.config';
import databaseConfig from './config/database.config';
import serverConfig from './config/server.config';
import { validationSchema } from './config/config.schema';
import { PropertiesModule } from './modules/properties/properties.module';
import sourcesConfig from './config/sources.config';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [
        appConfig,
        redisConfig,
        databaseConfig,
        serverConfig,
        sourcesConfig,
      ],
      isGlobal: true,
      validationSchema,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get('db.url'),
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('redis.host'),
          port: configService.get('redis.port'),

          connectTimeout: 10000,
          maxRetriesPerRequest: 10,
          enableReadyCheck: false,
          retryStrategy: (times) => {
            return Math.min(times * 50, 2000);
          },
        },
      }),
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 0,
          limit: 0,
        },
      ],
    }),
    IngestionModule,
    PropertiesModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
