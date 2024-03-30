'use client'

import * as React from 'react'
import { signIn } from 'next-auth/react'

import { cn } from '@/lib/utils'
import { Button, type ButtonProps } from '@/components/ui/button'
import {
  IconFacebook,
  IconGitHub,
  IconGoogle,
  IconSpinner
} from '@/components/ui/icons'

type Provider = 'github' | 'facebook' | 'google'

interface LoginButtonProps extends ButtonProps {
  showIcon?: boolean
  text?: string
  provider: Provider
}

export function LoginButton({
  showIcon = true,
  className,
  provider = 'github',
  ...props
}: LoginButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false)

  let iconElement = null
  let text = 'Login with '
  switch (provider) {
    case 'github':
      iconElement = <IconGitHub className="mr-2" />
      text += 'GitHub'
      break
    case 'google':
      iconElement = <IconGoogle className="mr-2" width={24} />
      text += 'Google'
      break
    case 'facebook':
      iconElement = <IconFacebook className="mr-2" width={24} />
      text += 'Facebook'
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
        signIn(provider, { callbackUrl: `/` })
      }}
      disabled={isLoading}
      className={cn('w-80', className)}
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
