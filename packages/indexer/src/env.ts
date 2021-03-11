const envalid = require("envalid"); // eslint-disable-line

import * as dotenv from "dotenv";
dotenv.config();

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
  },
  { strict: true }
);
