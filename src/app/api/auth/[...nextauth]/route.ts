import { withErrorHandler } from "@/lib/mongodb/withErrorHandler"
import { getAllThreadsByUserTool } from "@/lib/tools/threadTools"
import { UserService } from "@/services/UserService"
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                    scope: [
                        "openid",
                        "email",
                        "profile"
                    ].join(' ')
                }
            },
            httpOptions: {
                timeout: 10000
            }
        })
    ],
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        async signIn({ user, account, profile, email, credentials }: Record<string, any>) {

            const userData = { ...user } as { id: string, name: string, email: string, image: string }
            const access_token = account?.access_token
            const refresh_token = account?.refresh_token

            let resp = await withErrorHandler(
                async () => {
                    const userService = UserService.getInstance()
                    return userService.createUser({ ...userData, access_token, refresh_token })
                }
            )()
            //Get threads and decide redirect
            const { redirectThreadId } = await getAllThreadsByUserTool.invoke({ userId: resp?.authData?._id.toString() || userData.id });
            (account as any).redirectThreadId = redirectThreadId

            //Redirect user to their thread
            // return `/chat/${redirectThreadId}`
            return true
        },
        async redirect({ url, baseUrl }: Record<string, any>) {

            if (url.startsWith("/")) return `${baseUrl}/chat`;
            if (new URL(url).origin === baseUrl) return `${baseUrl}/chat`;

            if (url.includes("/api/auth/signout") || url.includes("/api/auth/signin")) {
                return `${baseUrl}/auth/login`
            }

            return baseUrl
        },
        async jwt({ token, user, account, profile, isNewUser }: Record<string, any>) {
            // if (user && user?.id) {
            //     token.userId = user?.id
            // }
            if (account && account?.access_token) {
                token.access_token = account?.access_token
            }

            if (account && account?.redirectThreadId) {
                token.redirectThreadId = account?.redirectThreadId
            }

            if (account && account?.refresh_token) {
                token.refresh_token = account?.refresh_token
            }


            if (user) {
                try {
                    const userService = UserService.getInstance();
                    const dbUser = await userService.findByEmail(user.email)

                    if (dbUser) {
                        token.userId = dbUser._id.toString();
                    }
                } catch (error) {

                }
            }

            return token
        },
        async session({ session, user, token }: Record<string, any>) {
            console.log('session--- start')
            if (token?.redirectThreadId) {
                session.redirectThreadId = token?.redirectThreadId
            }

            if (token?.userId) {
                session.user.id = token.userId
            }

            if (token?.access_token) {
                session.user.access_token = token.access_token
            }

            if (token?.refresh_token) {
                session.user.refresh_token = token.refresh_token
            }

            return session
        }
    }
}

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };