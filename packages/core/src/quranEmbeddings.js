export const PINECONE_QURAN_INDEX = "quran-search";
export const PINECONE_INDEX_CLOUD = "aws";
export const PINECONE_INDEX_REGION = "us-west-2";
// PINECONEDB SCHEMA
export const TableQuranAccessPatterns = {
    byAyat: (absoluteAyat) => ({
        id: `a#${absoluteAyat}`,
    }),
};
// FUNCTIONS
export const RUN_ONCE_createQuranIndex = async (pineconeClient) => {
    let pinecone = pineconeClient;
    if (!pinecone) {
        throw new Error("Pinecone client is required");
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
export const upsertQuranAyat = async (metadata, values, pineconeClient) => {
    let pinecone = pineconeClient;
    const pineconeIndex = pinecone.index(PINECONE_QURAN_INDEX);
    const upsertParams = {
        id: TableQuranAccessPatterns.byAyat(metadata.absoluteAyat).id,
        metadata: metadata,
        values,
    };
    await pineconeIndex.upsert([upsertParams]);
};
export const getMatchingAyatRAG = async ({ embeddingValue, numberOfResults = 2, pinecone, }) => {
    const pineconeIndex = pinecone.index(PINECONE_QURAN_INDEX);
    const results = await pineconeIndex.query({
        vector: embeddingValue,
        topK: numberOfResults,
        includeMetadata: true,
        includeValues: false,
    });
    return results;
};
