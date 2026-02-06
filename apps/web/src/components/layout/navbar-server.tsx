import { getServerSession } from "@/lib/auth/server-session";

import { Navbar } from "./navbar";

export async function NavbarServer() {
  const session = await getServerSession();

  return (
    <Navbar
      session={
        session ? { uid: session.uid, email: session.email ?? null, role: session.role } : null
      }
    />
  );
}
