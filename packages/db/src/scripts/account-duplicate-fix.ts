import * as dotenv from "dotenv";
import path from "path";
try {
  dotenv.config({ path: path.resolve(__dirname) + "/../../../../.env" });
} catch (e) {
  //nop
}
import { ConnectionOptions } from "typeorm";
import { connect } from "..";

const connectionOptions = {
  name: "default",
  type: "postgres",
  host: process.env.TYPEORM_HOST,
  port: Number(process.env.TYPEORM_PORT),
  username: process.env.TYPEORM_USERNAME,
  password: process.env.TYPEORM_PASSWORD,
  database: process.env.TYPEORM_DATABASE,
  logging: process.env.TYPEORM_LOGGING === "true",
  entities: ["../models/*.ts", "../models/**/*.ts"],
} as ConnectionOptions;

async function start() {
  const connection = await connect(connectionOptions);

  //eslint-disable-next-line
  while (true) {
    const q1 = `
    SELECT 
    address, count(*)
    FROM account
    GROUP BY address
    HAVING count(*) > 1
    LIMIT 100;
    `;
    const duplicates = await connection.query(q1);
    console.log("duplicates lenght", duplicates.length);
    if (!duplicates.length) break;
    else {
      for (const acc of duplicates) {
        const query = `
        WITH get_min_account AS (
          SELECT MIN(account_id) as account_id, address
          FROM account
          WHERE address = '${acc.address}'
          GROUP BY address 
          HAVING COUNT(*) > 1
      ),
       account_for_deletion as (
           SELECT 
                  a.account_id as duplicate_id, 
                  a.address, 
                  b.account_id as real_id
           FROM account a
           INNER JOIN get_min_account b ON (a.address = b.address
             AND a.account_id != b.account_id)
      ),
      update_extrinsic AS (
          update extrinsic
              set signer_id=(SELECT account_id FROM get_min_account)
              where signer_id IN (SELECT duplicate_id as account_id FROM account_for_deletion)
          RETURNING *
      ),
      delete_balance AS (
          DELETE FROM balance
          WHERE account_id IN (SELECT duplicate_id as account_id FROM account_for_deletion)
          RETURNING *
      ),
      delete_account AS (
          DELETE FROM account 
          where account_id IN (SELECT duplicate_id as account_id FROM account_for_deletion)
          RETURNING *
      ),
      delete_obsolete_balance AS (
          DELETE FROM balance
          WHERE account_id = (SELECT account_id FROM get_min_account)
              AND block_id IS NULL
          RETURNING *
      )
      SELECT * FROM update_extrinsic, delete_balance, delete_account, delete_obsolete_balance;
`;
        await connection.query(query);
        console.log(acc.address + " duplicates deleted");
      }
    }
  }
}

start();
