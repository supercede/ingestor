import { Logger } from '@nestjs/common';

export class OperationTimer {
  private startTime: number;
  private readonly logger: Logger;
  private readonly operationName: string;

  constructor(operationName: string, logger?: Logger) {
    this.operationName = operationName;
    this.logger = logger || new Logger('OperationTimer');
    this.start();
  }

  start(): void {
    this.startTime = Date.now();
    this.logger.log(`Starting operation: ${this.operationName}`);
  }

  stop(): number {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    this.logger.log(
      `Operation completed: ${this.operationName} - Duration: ${duration}ms`,
    );
    return duration;
  }

  static async measure<T>(
    operationName: string,
    operation: () => Promise<T> | T,
    logger?: Logger,
  ): Promise<{ result: T; duration: number }> {
    const timer = new OperationTimer(operationName, logger);
    try {
      const result = await operation();
      const duration = timer.stop();
      return { result, duration };
    } catch (error) {
      timer.stop();
      throw error;
    }
  }
}
