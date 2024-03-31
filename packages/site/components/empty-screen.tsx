import { UseChatHelpers } from 'ai/react'

import { Button } from '@/components/ui/button'
import { IconArrowRight } from '@/components/ui/icons'

const exampleMessages = [
  {
    heading: 'Why is Ramadan important?',
    message: `Why is Ramadan important to Muslims?`
  },
  {
    heading: 'What is tahajud?',
    message: 'What is tahajud?'
  },
  {
    heading: 'Explain to me zakat.',
    message: `Explain to me zakat.`
  }
]

export function EmptyScreen({ setInput }: Pick<UseChatHelpers, 'setInput'>) {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="rounded-lg border bg-background p-8">
        <h1 className="mb-2 text-lg font-semibold">Welcome to the AskDeen!</h1>
        <p className="mb-2 leading-normal text-muted-foreground">
          This is your friendly Islamic scholar who has memorized all 6,236 ayat
          of the Quran and 34,081 ahadith.
        </p>
        <p className="leading-normal text-muted-foreground">
          You can start a chat here or try the following examples:
        </p>
        <div className="mt-4 flex flex-col items-start space-y-2">
          {exampleMessages.map((message, index) => (
            <Button
              key={index}
              variant="link"
              className="h-auto p-0 text-base text-left"
              onClick={() => setInput(message.message)}
            >
              <IconArrowRight className="mr-2 text-muted-foreground" />
              {message.heading}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
