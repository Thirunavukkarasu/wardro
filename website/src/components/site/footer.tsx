import Image from "next/image";
import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-wardro-border bg-wardro-surface">
      <div className="site-container py-12 sm:py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center">
              <Image
                src="/brand/wardro-logo.png"
                alt="Wardro"
                width={1540}
                height={500}
                className="h-10 w-auto"
              />
            </div>
            <p className="mt-4 max-w-sm text-[13.5px] leading-6 text-wardro-text-secondary">
              A calmer way to organise the clothes your household actually
              wears. Built around real wardrobes, real families, and less
              decision fatigue.
            </p>
            <p className="mt-5 text-[11.5px] text-wardro-text-disabled">
              Made for Indian households, one profile at a time.
            </p>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-wardro-text-disabled">
              Product
            </p>
            <ul className="mt-4 space-y-3 text-[13px] font-medium text-wardro-text-secondary">
              <li>
                <Link href="#product" className="hover:text-wardro-primary-dark">
                  Household profiles
                </Link>
              </li>
              <li>
                <Link href="#screens" className="hover:text-wardro-primary-dark">
                  The app
                </Link>
              </li>
              <li>
                <Link href="#ai" className="hover:text-wardro-primary-dark">
                  Ask Wardro
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-wardro-text-disabled">
              Trust
            </p>
            <ul className="mt-4 space-y-3 text-[13px] font-medium text-wardro-text-secondary">
              <li>
                <Link href="/privacy" className="hover:text-wardro-primary-dark">
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link
                  href="/account-deletion"
                  className="hover:text-wardro-primary-dark"
                >
                  Account deletion
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/Thirunavukkarasu/wardro"
                  className="hover:text-wardro-primary-dark"
                >
                  Build notes
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-wardro-border pt-6 text-[11.5px] text-wardro-text-disabled sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Wardro. All rights reserved.</p>
          <p>Wardro is in active development. Features may change before launch.</p>
        </div>
      </div>
    </footer>
  );
}
