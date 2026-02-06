"use client";

import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { clearServerSession } from "@/lib/auth/client-session";
import { auth } from "@/lib/firebase/client";

import { Button } from "../ui/button";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function onSignOut() {
    setIsPending(true);
    try {
      await Promise.allSettled([clearServerSession(), signOut(auth)]);
      router.replace("/auth/signin");
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button onClick={onSignOut} variant="outline" disabled={isPending}>
      {isPending ? "Signing out..." : "Sign out"}
    </Button>
  );
}
