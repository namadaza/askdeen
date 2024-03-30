'use client'

import { AnimatePresence, motion } from 'framer-motion'

import { removeChat, shareChat } from '@/app/actions'

import { SidebarActions } from '@/components/sidebar-actions'
import { SidebarItem } from '@/components/sidebar-item'
import { TableAskDeenChat } from '@askdeen/core/askDeen'
import { useEffect } from 'react'
import { useAtom } from 'jotai'
import { chatsAtom } from '@/lib/joatiAtoms'

interface SidebarItemsProps {
  chats?: TableAskDeenChat[]
}

export function SidebarItems({ chats: chatsParam }: SidebarItemsProps) {
  const [chats, setChats] = useAtom(chatsAtom)

  useEffect(() => {
    if (chatsParam) {
      setChats(chatsParam)
    }
  }, [chatsParam, setChats])

  if (!chats?.length) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-muted-foreground">No chat history</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 px-2">
      <AnimatePresence>
        {chats.map(
          (chat, index) =>
            chat && (
              <motion.div
                key={chat?.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{
                  opacity: 0,
                  height: 0
                }}
              >
                <SidebarItem index={index} chat={chat}>
                  <SidebarActions
                    chat={chat}
                    removeChat={removeChat}
                    shareChat={shareChat}
                  />
                </SidebarItem>
              </motion.div>
            )
        )}
      </AnimatePresence>
    </div>
  )
}
