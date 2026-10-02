import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      role: string;
      isGuest: boolean;
      onboardingDone: boolean;
    };
  }
  interface User {
    role: string;
    isGuest: boolean;
    onboardingDone: boolean;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      id: "credentials",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email || "")
          .toLowerCase()
          .trim();
        const password = String(credentials?.password || "");
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;
        const valid = await compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isGuest: user.isGuest,
          onboardingDone: user.onboardingDone,
        };
      },
    }),
    Credentials({
      id: "guest",
      name: "Guest",
      credentials: {},
      async authorize() {
        const guest = await prisma.user.create({
          data: {
            name: "Guest",
            isGuest: true,
            role: "learner",
          },
        });

        const firstLesson = await prisma.lesson.findFirst({
          where: { published: true, unit: { published: true } },
          orderBy: [{ unit: { order: "asc" } }, { order: "asc" }],
        });
        if (firstLesson) {
          await prisma.userLessonProgress.create({
            data: {
              userId: guest.id,
              lessonId: firstLesson.id,
              status: "available",
            },
          });
        }
        return {
          id: guest.id,
          name: guest.name,
          role: guest.role,
          isGuest: true,
          onboardingDone: false,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.isGuest = user.isGuest;
        token.onboardingDone = user.onboardingDone;
      }
      if (trigger === "update" && session) {
        if (typeof session.onboardingDone === "boolean") {
          token.onboardingDone = session.onboardingDone;
        }
      }

      if (token.id && !token.onboardingDone) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { onboardingDone: true, role: true },
        });
        if (dbUser) {
          token.onboardingDone = dbUser.onboardingDone;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) || "learner";
        session.user.isGuest = Boolean(token.isGuest);
        session.user.onboardingDone = Boolean(token.onboardingDone);
      }
      return session;
    },
  },
});

export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}
