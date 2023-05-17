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
| Environment variable          | Description                                                                                                            | Example value                                                               |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `TYPEORM_HOST`                | Host address of database                                                                                               | `127.0.0.1`                                                                 |
| `TYPEORM_USERNAME`            | Username for database access                                                                                           | `postgres`                                                                  |
| `TYPEORM_PASSWORD`            | Password for database access                                                                                           | `postgres`                                                                  |
| `TYPEORM_DATABASE`            | Name of database                                                                                                       | `database`                                                                  |
| `TYPEORM_PORT`                | Port of database                                                                                                       | `25433`                                                                     |
| `TYPEORM_LOGGING`             | Should database make logs of transactions or not                                                                       | `false`                                                                     |
| `RABBIT_MQ_URL`               | Connection string for RabbitMQ                                                                                         | `amqp://guest:nj42pdnopdaf4@localhost:5672?heartbeat=30`                    |
| `REDIS_HOST`                  | Host address of redis                                                                                                 | **secret**                                                                  |
| `REDIS_PORT`                  | Port of database                                                                                                       | **secret**                                                                  |
| `REDIS_PASSWORD`              | Password for database access                                                                                           | **secret**                                                                  |
| `REDIS_DB`                    | Name of redis database                                                                                                 | **secret**                                                                  |
| `WS_PROVIDER`                 | Websocket URL for polkadot chain node                                                                                  | `wss://rpc.ibp.network/polkadot`                                            |

