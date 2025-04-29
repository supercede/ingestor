import { Injectable } from '@nestjs/common';
import { Transformer } from './transformer.interface';

@Injectable()
export class Source2Transformer implements Transformer {
  transform(data: any): any {
    return {
      sourceId: data.id,
      sourceType: 'source2',
      price: Number(data.pricePerNight),
      isAvailable: data.availability,
      location: {
        city: data.city,
      },
      attributes: {
        priceSegment: data.priceSegment,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
