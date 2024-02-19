import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Table } from "sst/node/table";
import { dbClient, TableRequiredSchema } from "./tableConstants.js";

const tableName = "stage-askdeen-quranEmbeddings"; // Table.quranEmbeddings.tableName;

// SCHEMA
export const TableQuranEmbeddingsAccessPatterns = {
  byAyat: (absoluteAyat: number) => ({
    pk: `a#${absoluteAyat}`,
    sk: `a#${absoluteAyat}`,
  }),
};

export interface TableQuranEmbeddings extends TableRequiredSchema {
  entityType: "quranEmbedding";
  ayat: number;
  absoluteAyat: number;
  surah: number;
  englishText: string;
  arabicText: string;
  embedding: number[];
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}

// FUNCTIONS
export const getQuranAyat = async (absoluteAyat: number) => {
  const params: DocumentClient.GetItemInput = {
    TableName: tableName,
    Key: TableQuranEmbeddingsAccessPatterns.byAyat(absoluteAyat),
  };
  const response = await dbClient.get(params).promise();

  console.log("response", response);
  return response.Item as TableQuranEmbeddings;
};

export const createQuranAyat = async (data: TableQuranEmbeddings) => {
  const params: DocumentClient.PutItemInput = {
    TableName: tableName,
    Item: data,
  };
  const response = await dbClient.put(params).promise();

  console.log("response", response);
  return response;
};
