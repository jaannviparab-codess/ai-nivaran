"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as api from "./api";
import type { User } from "./types";

const TOKEN_COOKIE = "nvr_session";
const USER_STORAGE_KEY = "nvr_user";

interface RegisterPayload {
  displayName: string;
  email: string;
  password: string;
  phone?: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  /** True only while restoring a session from cookie/localStorage on first mount. */
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function setSessionCookie(token: string, rememberMe: boolean) {
  const attrs = ["path=/", "SameSite=Lax"];
  if (rememberMe) {
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    attrs.push(`expires=${expires.toUTCString()}`);
  }
  // Omitting max-age/expires makes it a session cookie that clears when the browser closes.
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; ${attrs.join("; ")}`;
}

function clearSessionCookie() {
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0`;
}

function readSessionCookie(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${TOKEN_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const existingToken = readSessionCookie();
    if (existingToken) {
      setToken(existingToken);
      const storedUser = window.localStorage.getItem(USER_STORAGE_KEY);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          window.localStorage.removeItem(USER_STORAGE_KEY);
        }
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string, rememberMe = true) => {
    const res = await api.login(email, password);
    setUser(res.user);
    setToken(res.accessToken);
    setSessionCookie(res.accessToken, rememberMe);
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.user));
    return res.user;
  }, []);

  // Intentionally does NOT establish a session — the required flow sends a
  // newly-registered citizen to /login to sign in with their new credentials.
  const register = useCallback(async (payload: RegisterPayload) => {
    const res = await api.register(payload);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    clearSessionCookie();
    window.localStorage.removeItem(USER_STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
