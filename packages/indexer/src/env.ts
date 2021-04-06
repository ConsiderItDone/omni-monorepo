const envalid = require("envalid"); // eslint-disable-line

console.log('5556');

import * as dotenv from "dotenv";
dotenv.config({
    debug: true,
    path: '../../..'
});

console.log('6667');

console.log(process.env);

// Validator types https://github.com/af/envalid#validator-types
export default envalid.cleanEnv(
  process.env,
  {
    GRAPHQL_SERVER_PORT: envalid.port({
      default: 4000,
      desc: "The port to start the graphql server on",
    }),

    TYPEORM_HOST: envalid.host(),
    TYPEORM_USERNAME: envalid.str(),
    TYPEORM_PASSWORD: envalid.str(),
    TYPEORM_DATABASE: envalid.str(),
    TYPEORM_PORT: envalid.port(),
    TYPEORM_LOGGING: envalid.bool({
      default: false,
    }),
    WS_PROVIDER: envalid.host(),
    RABBIT_MQ_URL: envalid.url(),
  },
  { strict: true }
);
