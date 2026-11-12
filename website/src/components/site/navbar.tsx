import Image from "next/image";
import Link from "next/link";

const links = [
  { href: "#product", label: "Product" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#screens", label: "Screens" },
  { href: "/privacy", label: "Privacy" },
];

export default function SiteNavbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-wardro-border/70 bg-wardro-background/90 backdrop-blur-xl">
      <div className="site-container flex h-16 items-center justify-between">
        <Link href="/" aria-label="Wardro home" className="flex items-center">
          <Image
            src="/brand/wardro-logo.png"
            alt="Wardro"
            width={1540}
            height={500}
            priority
            className="h-9 w-auto"
          />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[13px] font-semibold text-wardro-text-secondary transition-colors hover:text-wardro-primary-dark"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="#download"
          className="rounded-full bg-wardro-primary-dark px-4 py-2.5 text-[12px] font-bold text-white transition-colors hover:bg-wardro-text-primary"
        >
          Coming to Android
        </Link>
      </div>
    </header>
  );
}
