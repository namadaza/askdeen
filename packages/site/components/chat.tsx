'use client'

import { useChat, type Message } from 'ai/react'

import { cn } from '@/lib/utils'
import { ChatList } from '@/components/chat-list'
import { ChatPanel } from '@/components/chat-panel'
import { EmptyScreen } from '@/components/empty-screen'
import { ChatScrollAnchor } from '@/components/chat-scroll-anchor'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { toast } from 'react-hot-toast'
import { usePathname } from 'next/navigation'
import { TableQuranMetadata } from '@askdeen/core/quranEmbeddings'
import { SURAHS } from '@askdeen/core/lib/surah'
import { getChats, saveChat } from '@/app/actions'
import { useAtom } from 'jotai'
import { chatsAtom } from '@/lib/joatiAtoms'
import { TableHadithMetadata } from '@askdeen/core/hadithEmbeddings'

const IS_PREVIEW = process.env.VERCEL_ENV === 'preview'
export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  id?: string
  userId?: string
}

export function Chat({ id, initialMessages, className, userId }: ChatProps) {
  const path = usePathname()

  const [previewToken, setPreviewToken] = useLocalStorage<string | null>(
    'ai-token',
    null
  )
  const [appendedRag, setAppendedRag] = useState(false)
  const [previewTokenDialog, setPreviewTokenDialog] = useState(IS_PREVIEW)
  const [previewTokenInput, setPreviewTokenInput] = useState(previewToken ?? '')

  const [, setChats] = useAtom(chatsAtom)

  const {
    messages,
    append,
    reload,
    stop,
    isLoading,
    input,
    setInput,
    data,
    setMessages
  } = useChat({
    initialMessages,
    id,
    body: {
      id,
      previewToken
    },
    onResponse(response) {
      if (response.status === 401) {
        toast.error(response.statusText)
      }
    },
    onFinish() {
      if (!path.includes('chat')) {
        window.history.pushState({}, '', `/chat/${id}`)
      }
    }
  })

  useEffect(() => {
    const updateChats = async () => {
      if (!userId) {
        return
      }
      const latestChats = await getChats(userId)

      setChats(latestChats)
    }

    // Partition the data into hadith and ayat
    const ayatData = (data?.[data.length - 2] ?? []) as TableQuranMetadata[]
    const hadithData = (data?.[data.length - 1] ?? []) as TableHadithMetadata[]

    if (!data?.length || isLoading || appendedRag) {
      return
    }

    let ragAyatMessageId: string = 'ayat'
    let ragAyatMessage: string = ''

    let ragHadithMessageId: string = 'hadith'
    let ragHadithMessage: string = ''

    for (const ayat of ayatData) {
      ragAyatMessageId += `#${ayat.surah}:${ayat.ayat}`
      ragAyatMessage += `#### Surah ${ayat.surah}:${ayat.ayat} | ${SURAHS[String(ayat.surah ?? 1)].name} 
          \n${ayat.englishText}
          \n${ayat.arabicText}
          \n`
    }

    for (const hadith of hadithData) {
      ragHadithMessageId += `#${hadith.index}`
      ragHadithMessage += `#### ${hadith.chapterEnglish}, Chapter ${hadith.chapterNumber} | Section ${hadith.sectionNumber || 'N/A'} | Hadith ${hadith.hadithNumber}
          \n${hadith.englishHadith}
          \n${hadith.arabicHadith}
          \n_Grade ${hadith.arabicGrade} (${hadith.englishGrade})_
          \n`
    }

    const ragAyatChatMessage: Message = {
      id: ragAyatMessageId,
      role: 'assistant',
      content: ragAyatMessage
    }

    const ragHadithChatMessage: Message = {
      id: ragHadithMessageId,
      role: 'assistant',
      content: ragHadithMessage
    }

    if (!messages.find(message => message.id === ragAyatMessageId)) {
      setMessages([...messages, ragAyatChatMessage, ragHadithChatMessage])
      setAppendedRag(true)
    }

    if (id) {
      saveChat({
        id: id,
        messages
      }).then(() => updateChats())
    }
  }, [
    data,
    messages,
    setMessages,
    data?.length,
    isLoading,
    appendedRag,
    id,
    setChats,
    userId
  ])
  useEffect(() => {
    setAppendedRag(false)
  }, [isLoading, setAppendedRag])

  return (
    <>
      <div className={cn('pb-[200px] pt-4 md:pt-10', className)}>
        {messages.length ? (
          <>
            <ChatList messages={messages} />
            <ChatScrollAnchor trackVisibility={isLoading} />
          </>
        ) : (
          <EmptyScreen setInput={setInput} />
        )}
      </div>
      <ChatPanel
        id={id}
        isLoading={isLoading}
        stop={stop}
        append={append}
        reload={reload}
        messages={messages}
        input={input}
        setInput={setInput}
      />

      <Dialog open={previewTokenDialog} onOpenChange={setPreviewTokenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter your OpenAI Key</DialogTitle>
            <DialogDescription>
              If you have not obtained your OpenAI API key, you can do so by{' '}
              <a
                href="https://platform.openai.com/signup/"
                className="underline"
              >
                signing up
              </a>{' '}
              on the OpenAI website. This is only necessary for preview
              environments so that the open source community can test the app.
              The token will be saved to your browser&apos;s local storage under
              the name <code className="font-mono">ai-token</code>.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={previewTokenInput}
            placeholder="OpenAI API key"
            onChange={e => setPreviewTokenInput(e.target.value)}
          />
          <DialogFooter className="items-center">
            <Button
              onClick={() => {
                setPreviewToken(previewTokenInput)
                setPreviewTokenDialog(false)
              }}
            >
              Save Token
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
