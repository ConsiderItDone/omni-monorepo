import * as dotenv from "dotenv";
import path from "path";
try {
  dotenv.config({ path: path.resolve(__dirname) + "/../../../../.env" });
} catch (e) {
  //nop
}
import { ConnectionOptions } from "typeorm";
import { connect } from "@nodle/db";

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

  while (true) {
    const q1 = `
    SELECT 
    address, count(*)
    FROM account
    GROUP BY address
    HAVING count(*) > 1
    LIMIT 1000;
    `;
    const res = await connection.query(q1);
    if (!res.length) break;
    else {
      for (const acc of res) {
        const query = `
        WITH deleted_accounts as (
          DELETE FROM account a USING (
                 SELECT MIN(account_id) as account_id, address
                   FROM account
                   WHERE address = '${acc.address}'
                   GROUP BY address HAVING COUNT(*) > 1   
                 ) b
                 WHERE a.address = b.address 
                 AND a.account_id <> b.account_id
             returning a.account_id
         ) 
           DELETE FROM balance
           WHERE account_id IN (SELECT account_id FROM deleted_accounts)`;
        await connection.query(query);
        console.log(acc.address + " duplicates deleted");
      }
    }
  }
}

start();

/* 
const query = `
WITH deleted_accounts as (
  DELETE FROM account a USING (
         SELECT MIN(account_id) as account_id, address
           FROM account
           WHERE address = '${acc.address}'
           GROUP BY address HAVING COUNT(*) > 1   
         ) b
         WHERE a.address = b.address 
         AND a.account_id <> b.account_id
     returning a.account_id
 ) 
   DELETE FROM balance
   WHERE account_id IN (SELECT account_id FROM deleted_accounts)`; 
   */
