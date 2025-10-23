import React, { createContext, useContext, useMemo, useState } from "react";
import { login } from "./api";

type AuthCtx = {
  token: string | null;
  signIn: (u: string, p: string) => Promise<void>;
  signOut: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));

  const signIn = async (username: string, password: string) => {
    const data = await login(username, password);
    localStorage.setItem("token", data.access_token);
    setToken(data.access_token);
  };

  const signOut = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  const value = useMemo(() => ({ token, signIn, signOut }), [token]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
