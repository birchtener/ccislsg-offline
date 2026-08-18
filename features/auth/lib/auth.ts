import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "@/lib/prisma";
import { username, customSession } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    database: {
      generateId: "uuid",
    },
  },
  plugins: [
    username(),
    customSession(async ({ user, session }) => {
      const dbUser = await db.user.findUnique({
        where: { id: user.id },
        select: {
          first_name: true,
          last_name: true,
          image: true,
          username: true,
          role: {
            select: {
              id: true,
              name: true,
              role_permissions: {
                select: {
                  permission: { select: { name: true } },
                },
              },
            },
          },
        },
      });

      if (!dbUser) {
        return {
          session: null,
          user: null,
        };
      }

      const permissions =
        dbUser.role.role_permissions.map((rp) => rp.permission.name) ?? [];

      return {
        session,
        user: {
          ...user,
          permissions,
          first_name: dbUser.first_name,
          last_name: dbUser.last_name,
          username: dbUser.username,
          image: dbUser.image,
          role: {
            id: dbUser.role.id,
            name: dbUser.role.name,
          },
        },
      };
    }),
    nextCookies(),
  ],
  user: {
    fields: {
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
    },
    additionalFields: {
      first_name: {
        type: "string",
        required: true,
        input: true,
      },
      last_name: {
        type: "string",
        required: true,
        input: true,
      },
      role_id: {
        type: "string",
        required: true,
        input: true,
      },
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
});

export type Session = typeof auth.$Infer.Session;
