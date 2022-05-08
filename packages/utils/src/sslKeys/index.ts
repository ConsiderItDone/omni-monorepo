import fs from "fs";

export default {
  ca: fs.readFileSync("./server-ca.pem"),
  cert: fs.readFileSync("./client-cert.pem"),
  key: fs.readFileSync("./client-key.pem"),
};
