/*
 * CURRENT CONFIGURED FOR hadith.parquet
 */
import { config } from "dotenv";
import parquetjs from "@dsnp/parquetjs";
import OpenAI from "openai";
import cliProgress from "cli-progress";
import { Pinecone } from "@pinecone-database/pinecone";
import { upsertHadith } from "../hadithEmbeddings.js";
config({ path: "../../../../.env.local" });
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? "",
});
const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY ?? "",
});
const NUMBER_OF_ROWS = 34088;
const PARQUET_FILE = "../lib/hadith.parquet";
const main = async () => {
    // Parquet reader with embeddings
    let reader = await parquetjs.ParquetReader.openFile(PARQUET_FILE);
    let cursor = reader.getCursor();
    let record = null;
    let count = 1;
    // Etc loop logic
    progressBar.start(NUMBER_OF_ROWS, 0);
    while (true) {
        record = ((await cursor.next()) ?? null);
        if (record === null) {
            break;
        }
        if (count < 8914) {
            progressBar.update(count);
            count++;
            continue;
        }
        const embeddingsResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            dimensions: 1536,
            input: record.English_Hadith,
            encoding_format: "float",
        });
        const embeddingValue = embeddingsResponse?.data?.[0]?.embedding ?? [];
        if (!embeddingValue.length) {
            console.log("No embedding value", count, record.English_Hadith);
            continue;
        }
        const hadithMetadata = {
            index: count,
            chapterNumber: Number(record.Chapter_Number) || 0,
            chapterEnglish: record.Chapter_English,
            chapterArabic: record.Chapter_Arabic,
            sectionNumber: Number(record.Section_Number) || 0,
            sectionEnglish: record.Section_English,
            sectionArabic: record.Section_Arabic,
            hadithNumber: Number(record.Hadith_number) || 0,
            englishHadith: record.English_Hadith,
            englishIsnad: "",
            englishMatn: "",
            arabicHadith: record.Arabic_Hadith,
            arabicIsnad: record.Arabic_Isnad,
            arabicMatn: "",
            arabicComment: record.Arabic_Comment,
            englishGrade: record.English_Grade,
            arabicGrade: record.Arabic_Grade,
        };
        const hadithMetadataString = JSON.stringify(hadithMetadata, null, 2);
        if (hadithMetadataString.length > 25000) {
            console.log("Hadith metadata too long", count);
            count++;
            continue;
        }
        console.log("\nhadithMetadata", JSON.stringify({ ...hadithMetadata, embedding: embeddingValue.length }, null, 2));
        console.log("\nLength: ", hadithMetadataString.length);
        upsertHadith(hadithMetadata, embeddingValue, pinecone);
        progressBar.update(count);
        count++;
    }
    await reader.close();
    progressBar.stop();
    console.log("done");
};
main();
