import { PropertyDto } from 'src/modules/properties/dto/property.dto';

export interface Transformer {
  transform(data: any): PropertyDto;
}
