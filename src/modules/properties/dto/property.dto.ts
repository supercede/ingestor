import {
  IsString,
  IsNumber,
  IsBoolean,
  IsDate,
  IsOptional,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Schema } from '@nestjs/mongoose';

@Schema()
export class LocationDto {
  @IsString()
  city: string;

  @IsString()
  @IsOptional()
  country?: string;
}

export class PropertyDto {
  @IsString()
  sourceId: string;

  @IsString()
  sourceType: string;

  @IsNumber()
  price: number;

  @IsBoolean()
  isAvailable: boolean;

  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @IsObject()
  @IsOptional()
  attributes?: Record<string, any>;

  @IsDate()
  @IsOptional()
  createdAt?: Date;

  @IsDate()
  @IsOptional()
  updatedAt?: Date;
}
