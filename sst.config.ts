import { SSTConfig } from "sst";
import { AskDeenStack } from "./stacks/AskDeenStack";

export default {
  config(_input) {
    return {
      name: "askdeen",
      region: "us-east-1",
    };
  },
  stacks(app) {
    app.stack(AskDeenStack);
  },
} satisfies SSTConfig;
