"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, Target, Trophy, Scale, Ruler } from "lucide-react";

export function NavBar() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      path: "/",
      icon: LayoutDashboard,
    },
    {
      id: "calisthenics",
      label: "Skill Tree",
      path: "/calisthenics",
      icon: Target,
    },
    {
      id: "pr",
      label: "PR",
      path: "/pr",
      icon: Trophy,
    },
    {
      id: "weight",
      label: "Weight",
      path: "/weight",
      icon: Scale,
    },
    {
      id: "measurements",
      label: "Specs",
      path: "/measurements",
      icon: Ruler,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border/50 z-50 flex justify-around items-center px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {navItems.map((item) => {
        const active = pathname === item.path;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => router.push(item.path)}
            className="flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer group min-w-[64px]"
            aria-label={item.label}
          >
            <div className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${active ? "bg-accent/10" : "group-hover:bg-surface1"}`}>
              <Icon 
                size={22} 
                strokeWidth={active ? 2.5 : 2} 
                className={`transition-colors duration-200 ${active ? "text-accent" : "text-muted group-hover:text-primary"}`} 
              />
            </div>
            <span className={`text-[9px] mt-1 font-bold tracking-wider uppercase transition-colors ${active ? "text-primary" : "text-muted group-hover:text-primary"}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
