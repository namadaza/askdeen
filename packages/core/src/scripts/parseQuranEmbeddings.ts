import parquetjs from "@dsnp/parquetjs";
import { SURAHS } from "../lib/surah.js";
import { QURANARABIC } from "../lib/quranArabic.js";
import {
  TableQuranEmbeddings,
  TableQuranEmbeddingsAccessPatterns,
  createQuranAyat,
} from "../quranEmbeddings.js";

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

    const quranEmbeddingData: TableQuranEmbeddings = {
      ...TableQuranEmbeddingsAccessPatterns.byAyat(absoluteAyat),
      entityType: "quranEmbedding",
      ayat,
      absoluteAyat,
      surah: Number(record.Surah),
      englishText: record.Text,
      arabicText: quranArabic,
      embedding: record.Embedding.list.map((item) => Number(item.item)),
    };
    console.log(
      "quranEmbeddingData",
      JSON.stringify(
        { ...quranEmbeddingData, embedding: record?.Embedding?.list?.length },
        null,
        2,
      ),
    );

    await createQuranAyat(quranEmbeddingData);
    counter++;
  }

  await reader.close();
  console.log("done");
};

main();
