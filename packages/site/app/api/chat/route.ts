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
import { Pinecone } from '@pinecone-database/pinecone'

const openai = new OpenAI({
  apiKey: Config.OPENAI_API_KEY
})

const pinecone = new Pinecone({
  apiKey: Config.PINECONE_API_KEY
})

const systemMessageStart: ChatCompletionMessageParam = {
  role: 'system',
  content: `
    You are an Islamic scholar.
    Address the response from the lens of a balanced perspective, noting any major differences between the main Muslim madhabs, or schools of thought, if any.
    You are concise, and to the point, and use simple, very easy to understand English. Assume you are messaging a close friend over text messages. Very brief.
    One or two sentences per message.
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

  const latestUserResponseIndex = messages.findLastIndex(
    message => message.role === 'user'
  )

  console.log('latestUserResponseIndex', latestUserResponseIndex)
  if (latestUserResponseIndex === -1) {
    return new Response('Bad Request', {
      status: 400
    })
  }
  const latestUserResponse = (messages[latestUserResponseIndex].content ??
    '') as string
  console.log('latestUserResponse', latestUserResponse)

  // RAG
  const embeddingsResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    dimensions: 1536,
    input: latestUserResponse,
    encoding_format: 'float'
  })
  const embeddingValue = embeddingsResponse?.data?.[0]?.embedding ?? []
  const matchingAyat = await getMatchingAyatRAG({ embeddingValue, pinecone })

  // Append matching ayat to the user's response
  const compactMatchingAyat = compact(
    (matchingAyat?.matches ?? []).map(ayat => ayat.metadata)
  )
  let userPrompt: string = latestUserResponse
  userPrompt += `
    Here are some relevant ayat from the Quran for context, give me an analysis for my question above and the following ayat:
  `
  for (const ayat of compactMatchingAyat) {
    userPrompt += `
      ${ayat.englishText} 
      ${ayat.arabicText} 
      This comes from Surah ${SURAHS[String(ayat.surah ?? 1)].name}, ${ayat.surah}:${ayat.ayat}

    `
  }
  messages[latestUserResponseIndex].content = userPrompt

  console.log('userPrompt', userPrompt)
  console.log('messages', JSON.stringify(messages, null, 2))

  // OpenAI response + streaming
  const res = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [systemMessageStart, ...messages],
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
