import { config } from "dotenv";
import OpenAI from "openai";
import { PINECONE_QURAN_INDEX, getPinecone } from "../quranEmbeddings.js";

config({ path: "../.env.local" });

const QUERY = "Who do muslims worship?";

const main = async () => {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? "",
  });

  const pinecone = getPinecone();
  const pineconeIndex = pinecone.index(PINECONE_QURAN_INDEX);

  // Embed the query
  const embeddingsResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    dimensions: 1536,
    input: QUERY,
    encoding_format: "float",
  });
  const embeddingValue = embeddingsResponse?.data?.[0]?.embedding ?? [];

  // Fetch the matching results
  const results = await pineconeIndex.query({
    vector: embeddingValue,
    topK: 3,
    includeMetadata: true,
    includeValues: false,
  });

  console.log("QUERY");
  console.log(QUERY);

  results.matches.forEach((match, index) => {
    console.log("Match #", index + 1);
    console.log(
      match?.metadata?.englishText,
      " | Surah #",
      match?.metadata?.surah,
      " | Ayat #",
      match?.metadata?.ayat,
    );
  });
};

main();
