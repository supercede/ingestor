import { Injectable } from '@nestjs/common';
import { Transformer } from './transformer.interface';
import { PropertyDto } from 'src/modules/properties/dto/property.dto';

@Injectable()
export class Source1Transformer implements Transformer {
  transform(data: any): PropertyDto {
    return {
      sourceId: data.id,
      sourceType: 'source1',
      price: Number(data.priceForNight),
      isAvailable: data.isAvailable,
      location: {
        city: data.address.city,
        country: data.address.country,
      },
      attributes: {
        name: data.name,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
