"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/context/ToastContext";
import { ModalProvider } from "@/context/ModalContext";

interface GlobalProviderProps {
  children: React.ReactNode;
}

export function GlobalProvider({ children }: GlobalProviderProps) {
  return (
    <SessionProvider
      refetchInterval={0}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      <ToastProvider>
        <ModalProvider>
          {children}
        </ModalProvider>
      </ToastProvider>
    </SessionProvider>
  );
}