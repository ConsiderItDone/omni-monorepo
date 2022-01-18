import Redis from "redis";
import { promisify } from "util";

//const CACHE_EXPIRATION_TIME = 60;

const clientOptions: Redis.ClientOpts = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
};

class CacheClient {
  client: Redis.RedisClient;
  // eslint-disable-next-line
  get: (key: string, cb?: Redis.Callback<string>) => any;
  constructor() {
    this.client = Redis.createClient(clientOptions);
    this.client.on("error", function (error: Error) {
      console.error(error);
    });
    this.get = promisify(this.client.get).bind(this.client);
  }
  //eslint-disable-next-line
  set(key: string, value: any): boolean {
    return this.client.set(key, JSON.stringify(value));
    //return this.client.set(key, JSON.stringify(value), "EX", CACHE_EXPIRATION_TIME);
  }
  del(key: string): boolean {
    return this.client.del(key);
  }

  async delByPattern(pattern: string): Promise<void> {
    const keys = await this.keys(pattern);

    for (const key of keys) {
      this.del(key);
    }
  }

  keys(pattern: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.client.keys(pattern, (err: Error, list: string[]) => {
        if (err) {
          return reject(err);
        }

        resolve(list);
      });
    });
  }
}
export const cacheService = new CacheClient();

export default CacheClient;
