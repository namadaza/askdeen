import { config } from "dotenv";
import parquetjs from "@dsnp/parquetjs";
import OpenAI from "openai";
import cliProgress from "cli-progress";
import { SURAHS } from "../lib/surah.js";
import { QURANARABIC } from "../lib/quranArabic.js";
import {
  TableQuranMetadata,
  getPinecone,
  upsertQuranAyat,
} from "../quranEmbeddings.js";

config({ path: "../../../../.env.local" });

const progressBar = new cliProgress.SingleBar(
  {},
  cliProgress.Presets.shades_classic,
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? "",
});

const pinecone = getPinecone();

type QuranEmbeddingParquetRow = {
  Surah: string; // is a number
  Ayah: string; // is a number, relative to Surah
  Text: string;
  Embedding: {
    list: {
      item: string; // is a number
    }[];
  };
};

const main = async () => {
  // Parquet reader with emebeddings
  let reader = await parquetjs.ParquetReader.openFile(
    "../lib/quran-embeddings.parquet",
  );

  let cursor = reader.getCursor();
  let record: QuranEmbeddingParquetRow | null = null;

  // Etc loop logic
  let counter = 0;
  progressBar.start(10, 0);

  while (counter < 10) {
    record = ((await cursor.next()) ?? null) as QuranEmbeddingParquetRow;
    const ayat = Number(record?.Ayah ?? 0);
    const surahNumber = Number(record?.Surah ?? 1);

    console.log(surahNumber, ayat, record?.Text);

    if (!ayat || !record || !surahNumber) {
      break;
    }

    const surahData = SURAHS[record.Surah];
    const absoluteAyat = surahData.start + ayat - 1;
    const quranArabic = QURANARABIC[surahNumber - 1].ayat[ayat - 1].text;

    const embeddingsResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      dimensions: 1536,
      input: record.Text,
      encoding_format: "float",
    });
    const embeddingValue = embeddingsResponse?.data?.[0]?.embedding ?? [];

    if (!embeddingValue.length) {
      console.log("No embedding value", absoluteAyat, record.Text);
      continue;
    }

    const quranMetadata: TableQuranMetadata = {
      ayat,
      absoluteAyat,
      surah: Number(record.Surah),
      englishText: record.Text,
      arabicText: quranArabic,
    };
    console.log(
      "quranMetadata",
      JSON.stringify(
        { ...quranMetadata, embedding: embeddingValue.length },
        null,
        2,
      ),
    );

    upsertQuranAyat(quranMetadata, embeddingValue, pinecone);
    counter++;
    progressBar.update(counter);
  }

  await reader.close();
  progressBar.stop();
  console.log("done");
};

main();
