"use client";

import { store } from "@/store";
import { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

import { Provider } from 'react-redux'

export default function AppProviders({ children, session }: { children: React.ReactNode, session?: Session | null }) {
  return (
    <SessionProvider session={session}>
      <Provider
        store={store}
      >
        {children}
      </Provider>
    </SessionProvider>
  );
}