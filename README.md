# Omni monorepo

Monorepository includes:

- indexer
- backfill servive
- core/utils

## Install
`npm install`

## Indexer
Indexeing and processing blockchain events

### Start indexing process:
`npm run start:indexer`
Indexes blockchain events and passes them to processor

### Start processor:
`npm run start:indexer:daemon`
Processes events and writes them to Database

## Backfiller
Backfills missing blocks and account

### Start block backfiller
`npm run start:backfiller:blocks`
Starts block backfiller and passes them to backfill-processor

`npm run start:backfiller:blocks-daemon`
Processes block and writes them to Database

### Start account backfiller
`npm run start:backfiller:blocks`
Starts account backfiller and passes them to backfill-processor

`npm run start:backfiller:blocks-daemon`
Processes account and writes them to Database

## GraphQL Server
### Start server
Run server to query data
`npm run start:server`

## Tests
### Run tests
Test specific blockchain events execution
`npm run start:jest`

## Environmental variables description
### Database credentials
```
TYPEORM_HOST=
TYPEORM_USERNAME=
TYPEORM_PASSWORD=
TYPEORM_SSL_CA=
TYPEORM_SSL_CERT=
TYPEORM_SSL_KEY=
TYPEORM_DATABASE=
TYPEORM_PORT=
TYPEORM_LOGGING=false
```
### Redis caching service
```
REDIS_HOST=
REDIS_PORT=
REDIS_PASSWORD=
REDIS_DB=
```
### Blockchain node provider
```
WS_PROVIDER=ws://195.201.97.114:9944
```
### Rabbit MQ
Rabbit MQ for messaging between Indexer services
```
RABBIT_MQ_URL=
```
