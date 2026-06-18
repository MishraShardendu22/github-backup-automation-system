import Link from "next/link";
import HeaderNav from "@/components/layout/header-nav";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/backups", label: "Backups" },
  { href: "/analytics", label: "Analytics" },
  { href: "/live", label: "Live" },
  { href: "/ai", label: "AI" },
];

export default function Header() {
  return (
    <header
      style={{
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        className="header-container"
        style={{
          maxWidth: "1600px",
          margin: "0 auto",
          padding: "6px clamp(20px, 3vw, 32px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
          minHeight: 40,
        }}
      >
        <Link
          href="/"
          style={{
            fontWeight: 700,
            fontSize: 13,
            textDecoration: "none",
            color: "var(--text)",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          Backup Observatory
        </Link>
        <HeaderNav items={navItems} />
      </div>
    </header>
  );
}
