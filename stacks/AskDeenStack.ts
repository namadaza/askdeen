import { Config, StackContext, NextjsSite, Table } from "sst/constructs";

export function AskDeenStack({ stack }: StackContext) {
  // Secrets
  const OPENAI_API_KEY = new Config.Secret(stack, "OPENAI_API_KEY");
  const PINECONE_API_KEY = new Config.Secret(stack, "PINECONE_API_KEY");

  // Database - DynamoDB holds Quran embeddings
  const table = new Table(stack, "quranEmbeddings", {
    fields: {
      pk: "string",
      sk: "string",
    },
    primaryIndex: { partitionKey: "pk", sortKey: "sk" },
  });

  // NextJS (OpenNext - lambdas, cloudfronts, etc)
  const site = new NextjsSite(stack, "site", {
    path: "packages/site",
    bind: [table, OPENAI_API_KEY, PINECONE_API_KEY],
  });

  stack.addOutputs({
    URL: site.url,
  });
}
