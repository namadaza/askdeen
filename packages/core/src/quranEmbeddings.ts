import {
  Pinecone,
  QueryResponse,
  ServerlessSpecCloudEnum,
} from "@pinecone-database/pinecone";
import { Config } from "sst/node/config";
import { SURAHS } from "./lib/surah";
import { ChatCompletionMessageParam } from "openai/resources";

export const PINECONE_QURAN_INDEX = "quran-search";
export const PINECONE_INDEX_CLOUD = "aws" as ServerlessSpecCloudEnum;
export const PINECONE_INDEX_REGION = "us-west-2" as const;

// PINECONEDB SCHEMA
export const TableQuranAccessPatterns = {
  byAyat: (absoluteAyat: number) => ({
    id: `a#${absoluteAyat}`,
  }),
};

export type TableQuranMetadata = {
  ayat: number;
  absoluteAyat: number;
  surah: number;
  englishText: string;
  arabicText: string;
};

export const getPinecone = () => {
  return new Pinecone({
    apiKey: Config.PINECONE_API_KEY ?? "",
  });
};

// FUNCTIONS
export const RUN_ONCE_createQuranIndex = async (pineconeClient?: Pinecone) => {
  let pinecone = pineconeClient;
  if (!pinecone) {
    pinecone = getPinecone();
  }
  await pinecone.createIndex({
    name: PINECONE_QURAN_INDEX,
    dimension: 1536,
    spec: {
      serverless: {
        region: PINECONE_INDEX_REGION,
        cloud: PINECONE_INDEX_CLOUD,
      },
    },
    waitUntilReady: true,
    suppressConflicts: true,
  });
};

export const upsertQuranAyat = async (
  metadata: TableQuranMetadata,
  values: number[],
  pineconeClient?: Pinecone,
) => {
  let pinecone = pineconeClient;
  if (!pinecone) {
    pinecone = getPinecone();
  }

  const pineconeIndex =
    pinecone.index<TableQuranMetadata>(PINECONE_QURAN_INDEX);

  const upsertParams = {
    id: TableQuranAccessPatterns.byAyat(metadata.absoluteAyat).id,
    metadata: metadata,
    values,
  };

  await pineconeIndex.upsert([upsertParams]);
};

export const getMatchingAyatRAG = async ({
  embeddingValue,
  numberOfResults = 3,
}: {
  embeddingValue: number[];
  numberOfResults?: number;
}): Promise<QueryResponse<TableQuranMetadata>> => {
  const pinecone = getPinecone();
  const pineconeIndex =
    pinecone.index<TableQuranMetadata>(PINECONE_QURAN_INDEX);

  const results = await pineconeIndex.query({
    vector: embeddingValue,
    topK: numberOfResults,
    includeMetadata: true,
    includeValues: false,
  });

  return results;
};
