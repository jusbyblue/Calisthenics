"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";

export function NavBar() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      path: "/",
      icon: (
        <svg className="w-5.5 h-5.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" />
          <rect x="14" y="3" width="7" height="5" />
          <rect x="14" y="12" width="7" height="9" />
          <rect x="3" y="16" width="7" height="5" />
        </svg>
      ),
    },
    {
      id: "calisthenics",
      label: "Skill Tree",
      path: "/calisthenics",
      icon: (
        <svg className="w-5.5 h-5.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      ),
    },
    {
      id: "pr",
      label: "PR",
      path: "/pr",
      icon: (
        <svg className="w-5.5 h-5.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="7" />
          <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
        </svg>
      ),
    },
    {
      id: "measurements",
      label: "Specs",
      path: "/measurements",
      icon: (
        <svg className="w-5.5 h-5.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 2v20M14 2v20M2 12h20M2 6h20M2 18h20" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const active = pathname === item.path;
        return (
          <button
            key={item.id}
            onClick={() => router.push(item.path)}
            className={`nav-item ${active ? "active" : ""}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
