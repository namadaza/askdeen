import { StackContext, Table } from "sst/constructs";

export function AskDeenStack({ stack }: StackContext) {
  // Database - DynamoDB
  new Table(stack, "askDeen", {
    fields: {
      pk: "string",
      sk: "string",
      GSI1PK: "string",
      GSI1SK: "string",
    },
    primaryIndex: { partitionKey: "pk", sortKey: "sk" },
    globalIndexes: {
      GSI1: { partitionKey: "GSI1PK", sortKey: "GSI1SK" },
    },
  });

  // NextJS Deployed on Vercel
  // packages/site
}
