import { auth } from '@/auth'
import { LoginButton } from '@/components/login-button'
import { IconAskDeen } from '@/components/ui/icons'
import { cdn } from '@/lib/utils'
import { redirect } from 'next/navigation'

export default async function SignInPage() {
  const session = await auth()
  // redirect to home if user is already logged in
  if (session?.user) {
    redirect('/')
  }

  return (
    <div className="flex items-center flex-col justify-center py-10">
      <IconAskDeen width={128} height="auto" />
      <div className="max-w-xl flex flex-col justify-center items-center text-center pb-6">
        <h1 className="text-2xl font-bold">Welcome to AskDeen</h1>
        <p className="text-lg pt-2 pb-6">
          I&apos;m an AI-powered muslim chatbot! Ask me any questions and I will
          respond with the most accurate Quran and Hadith references.
        </p>
      </div>
      <div className="flex flex-col lg:flex-row justify-start items-start max-w-5xl gap-6 lg:gap-24 px-4 lg:justify-center lg:items-center">
        <div>
          <video
            className={`block size-full overflow-hidden object-cover`}
            autoPlay
            muted
            loop
            playsInline
            src={cdn('/askdeen-demo-min.mp4')}
          />
        </div>
        <div className="text-center">
          <div className="pb-4 italic">
            Get started for free today <span className="not-italic">☪️</span>
          </div>
          <LoginButton provider="google" />
          <div className="pb-2" />
          <LoginButton provider="facebook" />
          <div className="pb-2" />
          <LoginButton provider="github" />
        </div>
      </div>
    </div>
  )
}
