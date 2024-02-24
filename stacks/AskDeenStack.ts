import { Config, StackContext, NextjsSite, Table } from "sst/constructs";

export function AskDeenStack({ stack }: StackContext) {
  // Secrets
  const OPENAI_API_KEY = new Config.Secret(stack, "OPENAI_API_KEY");
  const PINECONE_API_KEY = new Config.Secret(stack, "PINECONE_API_KEY");
  const AUTH_SECRET = new Config.Secret(stack, "AUTH_SECRET");
  const AUTH_GITHUB_ID = new Config.Secret(stack, "AUTH_GITHUB_ID");
  const AUTH_GITHUB_SECRET = new Config.Secret(stack, "AUTH_GITHUB_SECRET");

  // Database - DynamoDB
  const table = new Table(stack, "askDeen", {
    fields: {
      pk: "string",
      sk: "string",
    },
    primaryIndex: { partitionKey: "pk", sortKey: "sk" },
  });

  // NextJS (OpenNext - lambdas, cloudfronts, etc)
  const site = new NextjsSite(stack, "site", {
    path: "packages/site",
    bind: [
      table,
      OPENAI_API_KEY,
      PINECONE_API_KEY,
      AUTH_SECRET,
      AUTH_GITHUB_ID,
      AUTH_GITHUB_SECRET,
    ],
  });

  stack.addOutputs({
    URL: site.url,
  });
}
