"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";

const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Report a Problem", href: "/report" },
      { label: "Public Issue Map", href: "/map" },
      { label: "Track an Issue", href: "/track" },
      { label: "Analytics", href: "/analytics" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Community Hub", href: "/community" },
      { label: "AI Assistant", href: "/assistant" },
    ],
  },
];

export function Footer() {
  const pathname = usePathname();
  if (AUTH_ROUTES.includes(pathname)) return null;

  return (
    <footer className="border-t border-border bg-white">
      <div className="container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-foreground">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-secondary-600 text-white">
              <span className="font-devanagari text-lg leading-normal">नि</span>
            </span>
            <span className="font-devanagari text-base">निवारण AI</span>
          </Link>
          <p className="mt-4 max-w-sm font-devanagari text-sm text-muted-foreground">
            समस्या नोंदवा, निवारणाचा मागोवा घ्या.
          </p>
          <p className="text-sm text-muted-foreground">Report a problem. Track the resolution.</p>
          <div className="mt-5 flex items-start gap-2 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
            <p>
              Nivaran AI provides AI-assisted estimates to help prioritize and track public issues. AI outputs are
              suggestions, not official government decisions, and reports are not automatically transmitted to any
              government authority unless an official integration is explicitly enabled.
            </p>
          </div>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary-600">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border py-6">
        <div className="container flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Nivaran AI. Built for civic good.</p>
          <p>Demo/portfolio build — not affiliated with any municipal corporation.</p>
        </div>
      </div>
    </footer>
  );
}
