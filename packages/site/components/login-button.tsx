'use client'

import * as React from 'react'
import { signIn } from 'next-auth/react'

import { cn } from '@/lib/utils'
import { Button, type ButtonProps } from '@/components/ui/button'
import { IconGitHub, IconSpinner } from '@/components/ui/icons'

type Provider = 'github'

interface LoginButtonProps extends ButtonProps {
  showIcon?: boolean
  text?: string
  provider: Provider
}

export function LoginButton({
  text = 'Login with GitHub',
  showIcon = true,
  className,
  provider = 'github',
  ...props
}: LoginButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false)

  let iconElement = null
  switch (provider) {
    case 'github':
      iconElement = <IconGitHub className="mr-2" />
      break
    case null:
      iconElement = null
      break
    default:
      provider satisfies never
  }

  return (
    <Button
      variant="outline"
      onClick={() => {
        setIsLoading(true)
        // next-auth signIn() function doesn't work yet at Edge Runtime due to usage of BroadcastChannel
        signIn('github', { callbackUrl: `/` })
      }}
      disabled={isLoading}
      className={cn(className)}
      {...props}
    >
      {isLoading ? (
        <IconSpinner className="mr-2 animate-spin" />
      ) : showIcon ? (
        iconElement
      ) : null}
      {text}
    </Button>
  )
}
