# Property Data Ingestor

A NestJS application that ingests property data from multiple sources and provides a unified API to query the data.

## Modules

### Properties Module
- Handles property data querying and filtering
- Provides REST API endpoints for property data
- Implements MongoDB-based filtering with caching
- Supports flexible search criteria:
  - Location-based (city, country)
  - Price range filters
  - Availability status
  - Source type filtering
  - Price segment categorization
  - Full-text search across properties

### Ingestion Module
- Handles data ingestion from multiple sources
- Features:
  - Scheduled ingestion using cron expressions
  - Manual trigger endpoints (rate-limited)
  - Source-specific data transformers

### Cache Module
- Redis-based caching implementation
- Features:
  - Pattern-based invalidation
  - Configurable TTL per cache entry

## API Endpoints

### Properties
```
GET /properties
    Query Parameters:
    - city: string
    - country: string
    - minPrice: number
    - maxPrice: number
    - price: number
    - isAvailable: boolean
    - sourceType: string
    - priceSegment: string
    - name: string
    - limit: number
    - skip: number
    - sort: object
    - attributeSearch: string
```

### Ingestion
```
GET /ingestion/sources
    Returns list of configured data sources

POST /ingestion/trigger/:sourceId
    Triggers ingestion for specific source
    Rate limited: 1 request per minute

POST /ingestion/trigger-all
    Triggers ingestion for all sources
    Rate limited: 1 request per minute
```


## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run start:dev

# Run tests
npm run test

# Build for production
npm run build
```

### Docker
To make use of just the infrastructure (MongoDB database, redis), you can run:

```
docker compose -f docker-compose.infra.yml up -d
```

This will start the MongoDB and Redis containers. You can then run the application locally or using the Dockerfile provided in the project.

The docker-compose.dev.yml file is used to run the application in a containerized environment. It includes the application service as well as the MongoDB and Redis services. To run the application using this file, you can use the following command:

```bash
docker compose -f docker-compose.dev.yml up -d
```

To stop the services, you can use:

```bash
docker compose -f docker-compose.dev.yml down
```


## Environment Variables

Create/configure .env file with your credentials. A sample .env.example file has been provided. Make a duplicate of .env.example and rename to .env, then configure your credentials (ensure to provide the correct details)


## Adding a New Data Source

1. Create source configuration in `src/config/sources.config.ts`:
```typescript
{
  id: 'new-source',
  url: 's3://your-bucket/data.json',
  description: 'New data source description',
  schedule: '0 */4 * * *'  // Optional: Run every 4 hours
}
```

2. Create transformer in `src/modules/ingestion/transformers/new-source.transformer.ts`:
```typescript
import { PropertyTransformer } from '../interfaces/property.transformer';

export class NewSourceTransformer implements PropertyTransformer {
  transform(data: any) {
    return {
      sourceType: 'new-source',
      attributes: {
        name: data.propertyName,
        description: data.propertyDescription,
        // ... map source-specific fields
      },
      location: {
        city: data.city,
        country: data.country,
      },
      price: Number(data.price),
      isAvailable: data.status === 'active'
    };
  }
}
```

3. Register transformer in `src/modules/ingestion/ingestion.service.ts`:
```typescript
private readonly transformers = {
  'new-source': new NewSourceTransformer(),
  // ... existing transformers
};
```
