import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { IngestionService } from './ingestion.service';
import { DataSourceConfig } from '../../config/sources.config';

@Throttle({
  default: {
    limit: 1,
    ttl: 60 * 1000,
  },
})
@Controller('ingestion')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @SkipThrottle()
  @Get('sources')
  getSources(): DataSourceConfig[] {
    return this.ingestionService.getDataSources();
  }

  @Post('trigger/:sourceId')
  async triggerIngestion(@Param('sourceId') sourceId: string) {
    await this.ingestionService.triggerIngestion(sourceId);
    return { message: `Ingestion job triggered for source: ${sourceId}` };
  }

  @Post('trigger-all')
  async triggerAllIngestions() {
    await this.ingestionService.triggerAllIngestions();
    return { message: 'All ingestion jobs triggered' };
  }
}
