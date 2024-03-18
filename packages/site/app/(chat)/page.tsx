import { nanoid } from '@/lib/utils'
import { Chat } from '@/components/chat'
import { auth } from '@/auth'

export default async function IndexPage() {
  const id = nanoid()
  const session = await auth()

  return <Chat userId={session?.user?.id} id={id} />
}
