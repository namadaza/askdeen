import AWS from "aws-sdk";

export const dbClient = new AWS.DynamoDB.DocumentClient({
  region: "us-east-1",
});

export interface TableRequiredSchema {
  pk: string;
  sk: string;
  entityType: "quranEmbedding";
}
