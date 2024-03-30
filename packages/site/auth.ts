import { DynamoDB, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import NextAuth, { type DefaultSession } from 'next-auth'
import GitHub from 'next-auth/providers/github'
import Facebook from 'next-auth/providers/facebook'
import Google from 'next-auth/providers/google'
import { DynamoDBAdapter } from '@next-auth/dynamodb-adapter'

const config: DynamoDBClientConfig = {
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? ''
  },
  region: 'us-east-1'
}

const dbClient = DynamoDBDocument.from(new DynamoDB(config), {
  marshallOptions: {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true
  }
})

declare module 'next-auth' {
  interface Session {
    user: {
      /** The user's id. */
      id: string
    } & DefaultSession['user']
  }
}

export const {
  handlers: { GET, POST },
  auth
} = NextAuth({
  providers: [
    GitHub,
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_APP_ID,
      clientSecret: process.env.AUTH_FACEBOOK_APP_SECRET,
      allowDangerousEmailAccountLinking: true
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true
    })
  ],
  callbacks: {
    jwt({ token, profile }) {
      if (profile) {
        token.id = profile.id
        token.image = profile.avatar_url || profile.picture
      }
      return token
    },
    session: ({ session, token, user }) => {
      if (session?.user && token?.id) {
        session.user.id = String(token.id)
      }
      if (session?.user && user?.id) {
        session.user.id = String(user.id)
      }
      return session
    },
    authorized({ request, auth }) {
      // Ignore if user going to share route
      if (request.url.includes('/share')) {
        return true
      }
      return !!auth?.user // this ensures there is a logged in user for -every- request
    }
  },
  pages: {
    signIn: '/sign-in' // overrides the next-auth default signin page https://authjs.dev/guides/basics/pages
  },
  adapter: DynamoDBAdapter(dbClient, { tableName: 'stage-askdeen-askDeen' })
})
