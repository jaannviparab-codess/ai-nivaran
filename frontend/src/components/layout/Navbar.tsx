"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LogOut, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/i18n/I18nProvider";
import type { TranslationKey } from "@/i18n/translate";
import { LanguageSelector } from "./LanguageSelector";

const NAV_LINKS: { href: string; labelKey: TranslationKey }[] = [
  { href: "/", labelKey: "nav.home" },
  { href: "/map", labelKey: "nav.publicMap" },
  { href: "/track", labelKey: "nav.trackIssue" },
  { href: "/community", labelKey: "nav.community" },
  { href: "/analytics", labelKey: "nav.analytics" },
  { href: "/assistant", labelKey: "nav.aiAssistant" },
];

const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function UserMenu() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (!user) return null;

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={t("nav.accountMenu")}
        className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-secondary-600 text-xs font-semibold text-white">
          {initialsFor(user.displayName) || "U"}
        </span>
        <span className="hidden max-w-[8rem] truncate xl:inline">{user.displayName}</span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-white p-1.5 shadow-card"
            role="menu"
          >
            <div className="border-b border-border px-3 py-2.5">
              <p className="truncate text-sm font-semibold text-foreground">{user.displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              role="menuitem"
              className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-critical-600 transition-colors hover:bg-critical-50"
            >
              <LogOut className="h-4 w-4" /> {t("nav.logout")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (AUTH_ROUTES.includes(pathname)) return null;

  function handleMobileLogout() {
    logout();
    router.push("/login");
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-shadow duration-300",
        scrolled ? "glass shadow-soft" : "bg-white/70 backdrop-blur-sm"
      )}
    >
      <nav className="container flex h-16 items-center justify-between gap-3" aria-label={t("nav.primary")}>
        <Link href="/" aria-label="Nivaran AI" className="flex shrink-0 items-center gap-2.5 font-bold text-foreground">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-secondary-600 text-white shadow-glow">
            <span className="font-devanagari text-lg leading-normal">नि</span>
            <span className="absolute -inset-1 -z-10 animate-pulse-ring rounded-xl border-2 border-primary-400" />
          </span>
          {/* Wordmark hides between lg and xl, where the full nav + language picker need the room. */}
          <span className="hidden flex-col whitespace-nowrap leading-tight sm:flex lg:hidden xl:flex">
            <span className="font-devanagari text-base">निवारण AI</span>
            <span className="text-[11px] font-normal text-muted-foreground">Nivaran AI</span>
          </span>
        </Link>

        <div className="hidden items-center gap-0.5 lg:flex xl:gap-1">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium transition-colors duration-200 xl:px-3.5",
                  active ? "text-primary-700" : "text-slate-600 hover:bg-muted/70 hover:text-foreground"
                )}
              >
                {t(link.labelKey)}
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    className="absolute inset-x-2 -bottom-[1px] h-0.5 rounded-full bg-gradient-to-r from-primary-600 to-secondary-600"
                  />
                )}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2 xl:gap-3">
          <LanguageSelector className="w-[7.5rem] shrink-0" />
          <div className="hidden items-center gap-2 lg:flex xl:gap-3">
            <Button href="/report" size="sm">
              {t("nav.reportProblem")}
            </Button>
            {isAuthenticated && <UserMenu />}
          </div>

          <button
            className="rounded-lg p-2 text-foreground lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden border-t border-border bg-white lg:hidden"
          >
            <div className="container flex flex-col gap-1 py-4">
              {user && (
                <div className="mb-1 flex items-center gap-2.5 rounded-lg bg-muted px-3 py-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-secondary-600 text-xs font-semibold text-white">
                    {initialsFor(user.displayName) || "U"}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{user.displayName}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              )}
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-sm font-medium",
                    pathname === link.href ? "bg-primary-50 text-primary-700" : "text-slate-700"
                  )}
                >
                  {t(link.labelKey)}
                </Link>
              ))}
              <div className="mt-2 flex gap-2 border-t border-border pt-3">
                <Button href="/report" size="sm" className="flex-1">
                  {t("nav.reportShort")}
                </Button>
                {isAuthenticated && (
                  <Button variant="outline" size="sm" className="flex-1" onClick={handleMobileLogout} leftIcon={<LogOut className="h-4 w-4" />}>
                    {t("nav.logout")}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
