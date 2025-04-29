import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { extractS3BucketAndKeyFromUrl } from '../../common/utils/s3.utils';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { DataSourceConfig } from '../../config/sources.config';

@Injectable()
export class IngestionService implements OnModuleInit {
  private readonly logger = new Logger(IngestionService.name);
  private readonly dataSources: DataSourceConfig[];

  constructor(
    @InjectQueue('ingestion-queue') private readonly ingestionQueue: Queue,
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    this.dataSources =
      this.configService.get<DataSourceConfig[]>('sources') || [];
  }

  async onModuleInit() {
    this.dataSources.forEach((source) => {
      if (source.schedule) {
        const job = new CronJob(source.schedule, () => {
          this.logger.log(`Scheduled ingestion triggered for ${source.id}`);
          this.triggerIngestion(source.id);
        });

        this.schedulerRegistry.addCronJob(`ingest-${source.id}`, job);
        job.start();

        this.logger.log(
          `Scheduled ingestion for ${source.id}: ${source.schedule}`,
        );
      }
    });

    // Process ingestion sources at startup
    this.logger.log('Processing all ingestion sources at startup');
    try {
      await this.triggerAllIngestions();
      this.logger.log('Successfully triggered all ingestions at startup');
    } catch (error) {
      this.logger.error(
        `Failed to trigger ingestions at startup: ${error.message}`,
      );
    }
  }

  getDataSources(): DataSourceConfig[] {
    return this.dataSources;
  }

  async triggerIngestion(id: string): Promise<void> {
    const source = this.dataSources.find((s) => s.id === id);

    if (!source) {
      throw new Error(`Source not found: ${id}`);
    }

    const { bucket, key } = extractS3BucketAndKeyFromUrl(source.url);

    this.logger.log(`Triggering ingestion for ${id} from ${key}`);

    await this.ingestionQueue.add('process-file', {
      sourceType: source.id,
      key,
      bucket,
    });
  }

  async triggerAllIngestions(): Promise<void> {
    this.logger.log('Triggering all ingestions');

    for (const source of this.dataSources) {
      await this.triggerIngestion(source.id);
    }
  }
}
