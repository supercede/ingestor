import { Injectable } from '@nestjs/common';
import { Source1Transformer } from './source1.transformer';
import { Source2Transformer } from './source2.transformer';
import { Transformer } from './transformer.interface';

@Injectable()
export class TransformerFactory {
  constructor(
    private readonly source1Transformer: Source1Transformer,
    private readonly source2Transformer: Source2Transformer,
  ) {}

  getTransformer(sourceType: string): Transformer {
    switch (sourceType) {
      case 'source1':
        return this.source1Transformer;
      case 'source2':
        return this.source2Transformer;
      default:
        throw new Error(`Unknown source type: ${sourceType}`);
    }
  }
}
