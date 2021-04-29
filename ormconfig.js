const dotenv = require('dotenv');
const path = require('path');

try {
    dotenv.config({ path: path.resolve(__dirname) + "/.env" });
} catch (e) {
    //nop
}

module.exports = {
    'type': 'postgres',
    'host': envConfig.TYPEORM_HOST,
    'port': envConfig.TYPEORM_PORT,
    'username': envConfig.TYPEORM_USERNAME,
    'password': envConfig.TYPEORM_PASSWORD,
    'database': envConfig.TYPEORM_DATABASE,
    'logging': envConfig.TYPEORM_LOGGING,
    'schema': "public",
    "entities": envConfig.NODE_ENV === 'production' ?
        [__dirname + "/packages/db/dist/models/public/*.js",] :
        ["packages/db/src/models/public/*.ts"],
    "migrations": envConfig.NODE_ENV === 'production' ?
        [__dirname + "/packages/db/dist/migrations/*.js"] :
        ["packages/db/src/migrations/*.ts"],
    'cli': {
        'entitiesDir': 'packages/db/src/models',
        'migrationsDir': 'packages/db/src/migrations'
    }
}
