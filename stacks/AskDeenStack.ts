import { StackContext, NextjsSite, Table } from "sst/constructs";

export function AskDeenStack({ stack }: StackContext) {
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
    bind: [table],
  });

  stack.addOutputs({
    URL: site.url,
  });
}
