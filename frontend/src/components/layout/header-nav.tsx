"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
};

export default function HeaderNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav style={{ display: "flex", gap: 2 }}>
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            style={{
              padding: "5px 10px",
              fontSize: 12,
              fontWeight: active ? 600 : 500,
              borderRadius: 5,
              textDecoration: "none",
              color: active ? "var(--accent)" : "var(--text-secondary)",
              background: active ? "rgba(212,168,50,0.10)" : "transparent",
              border: active
                ? "1px solid rgba(212,168,50,0.3)"
                : "1px solid transparent",
              transition: "all 0.12s ease",
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
