import { type Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { auth } from '@/auth'
import { getChat } from '@/app/actions'
import { Chat } from '@/components/chat'
import { TableAskDeenChat } from '@askdeen/core/askDeen'

export interface ChatPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({
  params
}: ChatPageProps): Promise<Metadata> {
  const session = await auth()

  if (!session?.user) {
    return {}
  }

  try {
    const chat = await getChat(params.id, session.user.id)
    return {
      title: chat?.title.toString().slice(0, 50) ?? 'Chat'
    }
  } catch (error) {
    return {}
  }
}

export default async function ChatPage({ params }: ChatPageProps) {
  const session = await auth()

  if (!session?.user) {
    redirect(`/sign-in?next=/chat/${params.id}`)
  }

  let chat: TableAskDeenChat | null = null

  try {
    chat = await getChat(params.id, session.user.id)
  } catch (error) {
    notFound()
  }

  if (!chat) {
    notFound()
  }

  if (chat?.userId !== session?.user?.id) {
    notFound()
  }

  return (
    <Chat
      userId={session?.user?.id}
      id={chat.id}
      initialMessages={chat.messages}
    />
  )
}
