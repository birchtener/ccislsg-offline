import { createAuthClient } from "better-auth/react";
import { customSessionClient } from "better-auth/client/plugins";
import type { auth } from "./auth";
import { usernameClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [usernameClient(), customSessionClient<typeof auth>()],
});
type InferSession = NonNullable<typeof authClient.$Infer.Session>;
export type Session = Omit<InferSession, "user"> & {
  user: NonNullable<InferSession["user"]>;
};
