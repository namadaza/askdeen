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

  if (!chats?.length) return null

  return (
    <AnimatePresence>
      {chats.map(
        (chat, index) =>
          chat && (
            <motion.div
              key={chat?.id}
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
  )
}
