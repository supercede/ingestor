import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CacheService } from '../cache/cache.service';
import { FilterPropertiesDto } from './dto/filterProperties.dto';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectModel('Property') private readonly propertyModel: Model<any>,
    private readonly cacheService: CacheService,
  ) {}

  async findAll(filterDto: FilterPropertiesDto): Promise<any[]> {
    const cacheKey = `properties:${JSON.stringify(filterDto)}`;
    const cachedData = await this.cacheService.get(cacheKey);

    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const filters = this.buildFilters(filterDto);
    const listings = await this.propertyModel
      .find(filters)
      .limit(filterDto.limit || 20)
      .skip(filterDto.skip || 0)
      .sort(filterDto.sort || { updatedAt: -1 })
      .exec();

    await this.cacheService.set(cacheKey, JSON.stringify(listings), 600);

    return listings;
  }

  private buildFilters(filterDto: FilterPropertiesDto): any {
    const filters: any = {};
    const defaultFilterOptions = { $options: 'i' };

    if (filterDto.city) {
      filters['location.city'] = {
        $regex: filterDto.city,
        ...defaultFilterOptions,
      };
    }

    if (filterDto.country) {
      filters['location.country'] = {
        $regex: filterDto.country,
        ...defaultFilterOptions,
      };
    }

    if (filterDto.name) {
      filters['attributes.name'] = {
        $regex: filterDto.name,
        ...defaultFilterOptions,
      };
    }

    if (filterDto.attributeSearch) {
      const searchRegex = {
        $regex: filterDto.attributeSearch,
        ...defaultFilterOptions,
      };

      filters.$or = [
        { 'attributes.name': searchRegex },
        { 'attributes.description': searchRegex },
      ];
    }

    if (filterDto.price) {
      filters.price = filterDto.price;
    } else if (
      filterDto.minPrice !== undefined ||
      filterDto.maxPrice !== undefined
    ) {
      filters.price = {};
      if (filterDto.minPrice !== undefined) {
        filters.price.$gte = filterDto.minPrice;
      }
      if (filterDto.maxPrice !== undefined) {
        filters.price.$lte = filterDto.maxPrice;
      }
    }

    if (filterDto.isAvailable !== undefined) {
      filters.isAvailable = filterDto.isAvailable;
    }

    if (filterDto.sourceType) {
      filters.sourceType = filterDto.sourceType;
    }

    if (filterDto.priceSegment) {
      filters['attributes.priceSegment'] = filterDto.priceSegment;
    }

    return filters;
  }

  async searchAttributes(
    searchText: string,
    options: any = {},
  ): Promise<any[]> {
    const searchRegex = { $regex: searchText, $options: 'i' };

    const query = {
      $or: [
        { 'attributes.name': searchRegex },
        { 'attributes.description': searchRegex },
        { 'location.city': searchRegex },
        { 'location.country': searchRegex },
      ],
    };

    const filters = { ...query, ...options.filters };

    return this.propertyModel
      .find(filters)
      .limit(options.limit || 20)
      .skip(options.skip || 0)
      .sort(options.sort || { updatedAt: -1 })
      .exec();
  }

  async invalidateCache(): Promise<void> {
    await this.cacheService.invalidateByPattern('properties:*');
  }
}
