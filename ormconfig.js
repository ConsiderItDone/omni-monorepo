const dotenv = require('dotenv');
const path = require('path');

try {
    dotenv.config({ path: path.resolve(__dirname) + "/.env" });
} catch (e) {
    //nop
}

module.exports = {
    'type': 'postgres',
    'host': process.env.TYPEORM_HOST,
    'port': process.env.TYPEORM_PORT,
    'username': process.env.TYPEORM_USERNAME,
    'password': process.env.TYPEORM_PASSWORD,
    'database': process.env.TYPEORM_DATABASE,
    'logging': process.env.TYPEORM_LOGGING,
    'schema': "public",
    "entities": process.env.NODE_ENV === 'production' ?
        [__dirname + "/packages/db/dist/models/public/*.js",] :
        ["packages/db/src/models/public/*.ts"],
    "migrations": process.env.NODE_ENV === 'production' ?
        [__dirname + "/packages/db/dist/src/migrations/*.js"] :
        ["packages/db/src/migrations/*.ts"],
    'cli': {
        'entitiesDir': 'packages/db/src/models',
        'migrationsDir': 'packages/db/src/migrations'
    }
}
