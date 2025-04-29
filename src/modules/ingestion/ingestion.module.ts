import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { IngestionService } from './ingestion.service';
import { IngestionController } from './ingestion.controller';
import { IngestionProcessor } from './processors/ingestion.processor';
import { TransformerFactory } from './transformers/transformer.factory';
import { Source1Transformer } from './transformers/source1.transformer';
import { Source2Transformer } from './transformers/source2.transformer';
import { PropertySchema } from '../properties/schemas/property.schema';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'ingestion-queue',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
      },
    }),
    MongooseModule.forFeature([{ name: 'Property', schema: PropertySchema }]),
    ScheduleModule.forRoot(),
  ],
  controllers: [IngestionController],
  providers: [
    IngestionService,
    IngestionProcessor,
    TransformerFactory,
    Source1Transformer,
    Source2Transformer,
  ],
  exports: [IngestionService],
})
export class IngestionModule {}
