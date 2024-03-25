export const PINECONE_HADITH_INDEX = "hadith-search";
export const PINECONE_INDEX_CLOUD = "aws";
export const PINECONE_INDEX_REGION = "us-west-2";
// PINECONEDB SCHEMA
export const TableHadithAccessPatterns = {
    byIndex: (index) => ({
        id: `i#${index}`,
    }),
};
// FUNCTIONS
export const upsertHadith = async (metadata, values, pineconeClient) => {
    let pinecone = pineconeClient;
    const pineconeIndex = pinecone.index(PINECONE_HADITH_INDEX);
    const upsertParams = {
        id: TableHadithAccessPatterns.byIndex(metadata.index).id,
        metadata: metadata,
        values,
    };
    await pineconeIndex.upsert([upsertParams]);
};
export const getMatchingHadithRAG = async ({ embeddingValue, numberOfResults = 2, pinecone, }) => {
    const pineconeIndex = pinecone.index(PINECONE_HADITH_INDEX);
    const results = await pineconeIndex.query({
        vector: embeddingValue,
        topK: numberOfResults,
        includeMetadata: true,
        includeValues: false,
    });
    return results;
};
