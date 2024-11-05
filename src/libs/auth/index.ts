import db from "@/models"
import NextAuth, { CredentialsSignin } from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { saltAndHashPassword } from "@/utils/auth-utils"
import bcrypt from "bcryptjs";
import { PrismaAdapter } from "@next-auth/prisma-adapter"

class InvalidLoginError extends CredentialsSignin {
  code = "Invalid identifier or password"
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [Google, Credentials({
    credentials: {
      email: { type: "email", placeholder: "Email", label: "Email", required: true },
      password: { type: "password", placeholder: "Password", label: "Password", required: true },
    },
    authorize: async (credentials) => {
      const email = credentials.email as string;
      const hash = saltAndHashPassword(credentials.password as string);

      let user = await db.user.findUnique({
        where: {
          email,
        },
      });

      if (!user) {
        user = await db.user.create({
          data: {
            email,
            hashedPassword: hash,
          },
        });
      } else {
        const isMatch = bcrypt.compareSync(
          credentials.password as string,
          user.hashedPassword as string
        );
        if (!isMatch) {
          throw new InvalidLoginError()
        }
      }

      return user;
    },
  })],
})