import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    token:{
        phone:string
    }
    user: User & {
        phone:string
    }
  }
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface User{
    phone:string
  }

}