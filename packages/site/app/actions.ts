'use server'
import { DynamoDB, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  TableAskDeenAccessPatterns,
  TableAskDeenChat,
  deleteChatById,
  deleteChatsByUserId,
  getChatById,
  getChatsByUserId,
  putChat
} from '@askdeen/core/askDeen'

import { auth } from '@/auth'

const config: DynamoDBClientConfig = {
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? ''
  },
  region: 'us-east-1'
}

const dbClient = DynamoDBDocument.from(new DynamoDB(config), {
  marshallOptions: {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true
  }
})

export async function getChats(
  userId?: string | null
): Promise<TableAskDeenChat[]> {
  if (!userId) {
    return []
  }

  try {
    const chats: TableAskDeenChat[] = await getChatsByUserId(userId, dbClient)
    return chats
  } catch (error) {
    return []
  }
}

export async function getChat(
  id: string,
  userId: string
): Promise<TableAskDeenChat | null> {
  const chat = await getChatById(id, userId, dbClient)

  if (!chat || (userId && chat.userId !== userId)) {
    return null
  }

  return chat
}

export async function saveChat(
  chat: Pick<TableAskDeenChat, 'id' | 'messages'>
): Promise<TableAskDeenChat | { error: 'Unauthorized' }> {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    return {
      error: 'Unauthorized'
    }
  }

  const existingChat = await getChatById(chat.id, userId, dbClient)
  const updatedAt = new Date().toISOString()
  const { pk, sk } = TableAskDeenAccessPatterns.chatById(chat.id, userId)

  const chatWithUserId: TableAskDeenChat = {
    ...chat,
    pk,
    sk,
    GSI1PK: sk,
    GSI1SK: updatedAt,
    path: `/chat/${chat.id}`,
    title: existingChat?.title ?? chat.messages[0].content.substring(0, 100),
    userId: session.user.id,
    createdAt: existingChat?.createdAt ?? new Date().toISOString(),
    updatedAt
  }

  await putChat(chatWithUserId, dbClient)

  return chatWithUserId
}

export async function removeChat({
  id,
  path
}: {
  id: string
  path: string
}): Promise<void | { error: 'Unauthorized' }> {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  await deleteChatById(id, session.user.id, dbClient)
  revalidatePath('/')
  return revalidatePath(path)
}

export async function clearChats(): Promise<void | { error: 'Unauthorized' }> {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  await deleteChatsByUserId(session.user.id, dbClient)
  revalidatePath('/')
  return redirect('/')
}

export async function getSharedChat(
  id: string
): Promise<TableAskDeenChat | null> {
  const chat = await getChatById(id, undefined, dbClient)

  if (!chat || !chat.sharePath) {
    return null
  }

  return chat
}

export async function shareChat(
  id: string
): Promise<
  TableAskDeenChat | { error: 'Unauthorized' | 'Something went wrong' }
> {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  const chat = await getChatById(id, session.user.id, dbClient)

  if (!chat || chat.userId !== session.user.id) {
    return {
      error: 'Something went wrong'
    }
  }

  const chatWithSharePath: TableAskDeenChat = {
    ...chat,
    sharePath: `/share/${chat.id}`
  }

  await putChat(chatWithSharePath, dbClient)

  return chatWithSharePath
}
