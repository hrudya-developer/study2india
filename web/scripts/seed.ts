import "dotenv/config";
import { bootstrap } from "../lib/bootstrap";

bootstrap()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
