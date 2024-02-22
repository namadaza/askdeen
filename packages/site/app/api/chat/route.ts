import {
  OpenAIStream,
  StreamingTextResponse,
  experimental_StreamData
} from 'ai'
import OpenAI from 'openai'
import { Config } from 'sst/node/config'
import { auth } from '@/auth'
import { getMatchingAyatRAG } from '@askdeen/core/quranEmbeddings'
import { nanoid } from '@/lib/utils'
import { ChatCompletionMessageParam } from 'openai/resources'
import { SURAHS } from '@askdeen/core/lib/surah'
import { compact } from '@askdeen/core/lib/utils'

const openai = new OpenAI({
  apiKey: Config.OPENAI_API_KEY
})

const systemMessageStart: ChatCompletionMessageParam = {
  role: 'system',
  content: `
    You are an Islamic scholar.
    Respond to the query/question/response below, address the response from the lens of all 5 madhabs (Hanafi, Maliki, Shafi'i, Hanbali, and Shia).
    Be concise and to the point. Do not repeat yourself if you can avoid it.
  `
}

const systemMessageStartRag: ChatCompletionMessageParam = {
  role: 'system',
  content: `
    Here are some relevant ayat from the Quran to help you answer the question:
  `
}

export async function POST(req: Request) {
  const json = await req.json()
  const { messages } = json as { messages: ChatCompletionMessageParam[] }

  const userId = (await auth())?.user.id

  if (!userId) {
    return new Response('Unauthorized', {
      status: 401
    })
  }

  const latestUserResponse =
    messages.findLast(message => message.role === 'user')?.content ?? null

  console.log('latestUserResponse', latestUserResponse)

  if (!latestUserResponse) {
    return new Response('Bad Request', {
      status: 400
    })
  }

  // RAG
  const embeddingsResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    dimensions: 1536,
    input: latestUserResponse as string,
    encoding_format: 'float'
  })
  const embeddingValue = embeddingsResponse?.data?.[0]?.embedding ?? []
  const matchingAyat = await getMatchingAyatRAG({ embeddingValue })

  // Append matching ayat to the user's response as markdown
  const compactMatchingAyat = compact(
    (matchingAyat?.matches ?? []).map(ayat => ayat.metadata)
  )
  const matchingAyatMessages: ChatCompletionMessageParam[] =
    compactMatchingAyat.map(ayat => ({
      role: 'system',
      content: `
          ${ayat.englishText} 
          ${ayat.arabicText} 
          This comes from Surah ${SURAHS[String(ayat.surah ?? 1)].name}, ${ayat.surah}:${ayat.ayat}
        `
    }))

  console.log('matching', matchingAyatMessages)

  // OpenAI response + streaming
  const res = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      systemMessageStart,
      ...messages,
      systemMessageStartRag,
      ...matchingAyatMessages
    ],
    temperature: 0.7,
    stream: true
  })

  const data = new experimental_StreamData()
  data.append(compactMatchingAyat)

  const stream = OpenAIStream(res, {
    async onCompletion(completion) {
      const title = json.messages[0].content.substring(0, 100)
      const id = json.id ?? nanoid()
      const createdAt = Date.now()
      const path = `/chat/${id}`
      const payload = {
        id,
        title,
        userId,
        createdAt,
        path,
        messages: [
          ...messages,
          ...matchingAyatMessages,
          {
            content: completion,
            role: 'assistant'
          }
        ]
      }
      /*
       * TODO replace with dynamodb
      await kv.hmset(`chat:${id}`, payload)
      await kv.zadd(`user:chat:${userId}`, {
        score: createdAt,
        member: `chat:${id}`
      })
      */
    },
    onFinal() {
      data.close()
    },
    experimental_streamData: true
  })

  return new StreamingTextResponse(stream, {}, data)
}
