import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job } from 'bull';
import { S3 } from 'aws-sdk';
import * as JSONStream from 'jsonstream';
import { TransformerFactory } from '../transformers/transformer.factory';
import { OperationTimer } from 'src/common/utils/timer.utils';
import { PropertyDto } from 'src/modules/properties/dto/property.dto';

@Processor('ingestion-queue')
export class IngestionProcessor {
  private readonly logger = new Logger(IngestionProcessor.name);
  private readonly s3Client: S3;
  private totalRecords = 0;

  constructor(
    @InjectModel('Property') private readonly propertyModel: Model<any>,
    private readonly transformerFactory: TransformerFactory,
  ) {
    this.logger.log('IngestionProcessor initialized');
    this.s3Client = new S3();
  }

  @Process({ name: 'process-file', concurrency: 4 })
  async processFile(
    job: Job<{ sourceType: string; key: string; bucket: string }>,
  ) {
    this.logger.log(
      `Processing job: ${job.id}, attempt ${job.attemptsMade + 1}`,
    );

    const { sourceType, key, bucket } = job.data;
    this.logger.log(`Processing file ${key} from ${bucket} as ${sourceType}`);

    const timer = new OperationTimer(
      `Ingestion of ${sourceType} - ${key}`,
      this.logger,
    );

    try {
      const transformer = this.transformerFactory.getTransformer(sourceType);
      const s3Stream = this.s3Client
        .makeUnauthenticatedRequest('getObject', { Bucket: bucket, Key: key })
        .createReadStream();

      const jsonStream = JSONStream.parse('*');

      const batchSize = 1000;
      let batch: PropertyDto[] = [];
      let processed = 0;
      let total = 0;

      return new Promise((resolve, reject) => {
        const handleData = async (data: any) => {
          try {
            jsonStream.pause();

            const { result: transformedData } = await OperationTimer.measure(
              `Transform data item (${sourceType})`,
              () => transformer.transform(data),
              this.logger,
            );

            batch.push(transformedData);
            processed++;

            if (batch.length >= batchSize) {
              const currentBatch = [...batch];
              batch = [];

              total += currentBatch.length;

              await OperationTimer.measure(
                `Save batch of ${currentBatch.length} items`,
                () => this.saveBatchToDb(currentBatch),
                this.logger,
              );

              await job.progress(processed);
              this.logger.log(`Progress updated: ${processed} items processed`);
            }

            jsonStream.resume();
          } catch (error) {
            this.logger.error(`Error processing data item: ${error.message}`);
            jsonStream.destroy(error);
          }
        };

        s3Stream
          .pipe(jsonStream)
          .on('data', (data) => {
            handleData(data).catch((error) => {
              this.logger.error(`Error in data handler: ${error.message}`);
              jsonStream.destroy(error);
            });
          })
          .on('error', (error) => {
            this.logger.error(`Error processing file: ${error.message}`);
            timer.stop();
            reject(error);
          })
          .on('end', async () => {
            try {
              if (batch.length > 0) {
                total += batch.length;
                await OperationTimer.measure(
                  `Save final batch of ${batch.length} items`,
                  () => this.saveBatchToDb([...batch]),
                  this.logger,
                );
              }

              this.logger.log(
                `Total of ${total} records processed from ${key}`,
              );

              await job.progress(processed);

              const duration = timer.stop();
              this.logger.log(
                `Finished processing ${processed} records from ${key} in ${duration}ms (${processed / (duration / 1000)} records/sec)`,
              );

              resolve(true);
            } catch (error) {
              this.logger.error(`Error finalizing job: ${error.message}`);
              reject(error);
            }
          });
      });
    } catch (error) {
      timer.stop();
      this.logger.error(`Failed to process file: ${error.message}`);
      throw error;
    }
  }
  private async saveBatchToDb(batch: any[]): Promise<void> {
    try {
      this.totalRecords += batch.length;

      this.logger.log(
        `Saving batch of ${batch.length} records to database. Total records: ${this.totalRecords}`,
      );
      const result = await this.propertyModel.bulkWrite(
        batch.map((item) => ({
          updateOne: {
            filter: { sourceId: item.sourceId, sourceType: item.sourceType },
            update: { $set: item },
            upsert: true,
          },
        })),
        { ordered: false },
      );

      this.logger.log(
        `Saved batch of ${batch.length} records to database, upserted: ${result.upsertedCount}, modified: ${result.modifiedCount}`,
      );
    } catch (error) {
      this.logger.error(
        `Error saving batch to database: ${error.message}`,
        error.stack,
      );

      if (error.writeErrors) {
        this.logger.error(`${error.writeErrors.length} write errors occurred`);

        if (error.writeErrors.length > 0) {
          this.logger.error(
            `Sample error: ${JSON.stringify(error.writeErrors[0]).substring(0, 200)}`,
          );
        }
      }
    }
  }
}
