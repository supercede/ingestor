import { Controller, Get, Query } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { FilterPropertiesDto } from './dto/filterProperties.dto';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly proeprtiesService: PropertiesService) {}

  @Get()
  async findAll(@Query() filterDto: FilterPropertiesDto) {
    return this.proeprtiesService.findAll(filterDto);
  }
}
