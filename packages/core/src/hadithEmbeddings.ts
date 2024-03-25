import {
  Pinecone,
  QueryResponse,
  ServerlessSpecCloudEnum,
} from "@pinecone-database/pinecone";

export const PINECONE_HADITH_INDEX = "hadith-search";
export const PINECONE_INDEX_CLOUD = "aws" as ServerlessSpecCloudEnum;
export const PINECONE_INDEX_REGION = "us-west-2" as const;

// PINECONEDB SCHEMA
export const TableHadithAccessPatterns = {
  byIndex: (index: number) => ({
    id: `i#${index}`,
  }),
};

export type TableHadithMetadata = {
  index: number; // incremental int, based on order in hadith.parquet
  chapterNumber: number;
  chapterEnglish: string;
  chapterArabic: string;
  sectionNumber: number;
  sectionEnglish: string;
  sectionArabic: string;
  hadithNumber: number;
  englishHadith: string;
  englishIsnad: string;
  englishMatn: string;
  arabicHadith: string;
  arabicIsnad: string;
  arabicMatn: string;
  arabicComment: string;
  englishGrade: string;
  arabicGrade: string;
};

// FUNCTIONS
export const upsertHadith = async (
  metadata: TableHadithMetadata,
  values: number[],
  pineconeClient: Pinecone,
) => {
  let pinecone = pineconeClient;
  const pineconeIndex = pinecone.index<TableHadithMetadata>(
    PINECONE_HADITH_INDEX,
  );

  const upsertParams = {
    id: TableHadithAccessPatterns.byIndex(metadata.index).id,
    metadata: metadata,
    values,
  };

  await pineconeIndex.upsert([upsertParams]);
};

export const getMatchingHadithRAG = async ({
  embeddingValue,
  numberOfResults = 2,
  pinecone,
}: {
  embeddingValue: number[];
  numberOfResults?: number;
  pinecone: Pinecone;
}): Promise<QueryResponse<TableHadithMetadata>> => {
  const pineconeIndex = pinecone.index<TableHadithMetadata>(
    PINECONE_HADITH_INDEX,
  );

  const results = await pineconeIndex.query({
    vector: embeddingValue,
    topK: numberOfResults,
    includeMetadata: true,
    includeValues: false,
  });

  return results;
};
