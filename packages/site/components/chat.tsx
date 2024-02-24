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
import { usePathname, useRouter } from 'next/navigation'
import { TableQuranMetadata } from '@askdeen/core/quranEmbeddings'
import { SURAHS } from '@askdeen/core/lib/surah'
import { uniqueById } from '@askdeen/core/lib/utils'
import { ChatCompletionMessageParam } from 'openai/resources'

const IS_PREVIEW = process.env.VERCEL_ENV === 'preview'
export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  id?: string
}

export function Chat({ id, initialMessages, className }: ChatProps) {
  const router = useRouter()
  const path = usePathname()
  const [previewToken, setPreviewToken] = useLocalStorage<string | null>(
    'ai-token',
    null
  )
  const [appendedRag, setAppendedRag] = useState(false)
  const [previewTokenDialog, setPreviewTokenDialog] = useState(IS_PREVIEW)
  const [previewTokenInput, setPreviewTokenInput] = useState(previewToken ?? '')
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
    console.log('am I loading?', isLoading, 'appendedRag', appendedRag)
    if (data?.length && !isLoading && !appendedRag) {
      console.log('isLoading', isLoading, 'appendedRag', appendedRag)
      let ragAyatMessageId: string = 'ayat'
      let ragAyatMessage: string = ''

      for (const ayat of data?.[data.length - 1] as TableQuranMetadata[]) {
        ragAyatMessageId += `#${ayat.surah}:${ayat.ayat}`
        ragAyatMessage += `#### Surah ${ayat.surah}:${ayat.ayat} | ${SURAHS[String(ayat.surah ?? 1)].name} 
          \n${ayat.englishText}
          \n${ayat.arabicText}
          \n`
      }

      const ragAyatChatMessage: Message = {
        id: ragAyatMessageId,
        role: 'assistant',
        content: ragAyatMessage
      }

      if (!messages.find(message => message.id === ragAyatMessageId)) {
        setMessages([...messages, ragAyatChatMessage])
        console.log('ragAyatMessages', ragAyatChatMessage)
        setAppendedRag(true)
      }
    }
  }, [data, messages, setMessages, data?.length, isLoading, appendedRag])

  console.log('data', data)
  console.log('messages', messages)

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
