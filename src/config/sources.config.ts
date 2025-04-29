import { registerAs } from '@nestjs/config';

export interface DataSourceConfig {
  id: string;
  url: string;
  description?: string;
  schedule?: string;
}

export default registerAs('sources', (): DataSourceConfig[] => {
  return [
    {
      id: 'source1',
      url: 'https://buenro-tech-assessment-materials.s3.eu-north-1.amazonaws.com/structured_generated_data.json',
      description: 'Structured property data with country information',
      schedule: '0 12 * * *',
    },
    // {
    //   id: 'source2',
    //   url: 'https://buenro-tech-assessment-materials.s3.eu-north-1.amazonaws.com/large_generated_data.json',
    //   description: 'Large dataset of simplified properties',
    //   schedule: '0 12 * * *',
    // },
    // Add new sources here
  ];
});
