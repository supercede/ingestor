import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import appConfig from './config/app.config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import redisConfig from './config/redis.config';
import databaseConfig from './config/database.config';
import serverConfig from './config/server.config';
import { validationSchema } from './config/config.schema';
import { PropertiesModule } from './modules/properties/properties.module';
import sourcesConfig from './config/sources.config';
import { IngestionModule } from './modules/ingestion/ingestion.module';

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
          // Add retry strategy to handle connection failures gracefully
          retryStrategy: (times) => {
            return Math.min(times * 50, 2000);
          },
        },
      }),
    }),
    ScheduleModule.forRoot(),
    IngestionModule,
    PropertiesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
