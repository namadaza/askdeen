import { config } from "dotenv";
import { Pinecone, ServerlessSpecCloudEnum } from "@pinecone-database/pinecone";

config({ path: "../.env.local" });

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
    apiKey: process.env.PINECONE_API_KEY ?? "",
  });
};

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
