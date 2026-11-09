import {
  ArrowRight,
  Camera,
  Check,
  Layers3,
  MessageCircle,
  ScanLine,
  Search,
  ShieldCheck,
  Shirt,
  Smartphone,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";

import SiteFooter from "@/components/site/footer";
import SiteNavbar from "@/components/site/navbar";
import PhoneShot from "@/components/site/phone-shot";

const features = [
  {
    icon: Users,
    title: "One household, many wardrobes",
    body: "Tiru, Swati, Arush, Adiran — every person gets their own profile, colour and collection. One account keeps the household together.",
  },
  {
    icon: Camera,
    title: "A photo-first closet",
    body: "Photograph a garment, add the details you care about, and keep it in the right collection. Your closet starts looking like your closet.",
  },
  {
    icon: Search,
    title: "Find the thing you own",
    body: "Search by name, brand or category, then narrow by type or wardrobe. No more digging through the same three drawers.",
  },
  {
    icon: MessageCircle,
    title: "Ask in plain language",
    body: "“What tops do I own?” “Build a casual lunch outfit.” Wardro answers from the active profile's real inventory, not a generic catalogue.",
  },
  {
    icon: ScanLine,
    title: "Understand a new find",
    body: "Attach a garment photo and Wardro reads the type, colour, pattern, material and occasion. A useful second pair of eyes before it joins the closet.",
  },
  {
    icon: Layers3,
    title: "See the shape of it",
    body: "Wardrobes, item counts and value sit together on Today, so the household's wardrobe feels legible instead of endless.",
  },
];

const steps = [
  {
    number: "01",
    title: "Create the household",
    body: "Start with your own profile, then add the people you dress. Each profile keeps its own wardrobes and items.",
  },
  {
    number: "02",
    title: "Photograph the closet",
    body: "Add garments with a photo, name, category, size and the details that matter. Collections like Work, Weekend, School and Sports keep it organised.",
  },
  {
    number: "03",
    title: "Ask, browse, repeat",
    body: "Switch to a profile, browse the closet, or ask Wardro what to wear. The more you add, the more useful the answers become.",
  },
];

const faqs = [
  {
    q: "Is Wardro available on Android yet?",
    a: "Wardro is in active development for Android. The Google Play listing is being prepared; this page will link to it when the first testing build is available.",
  },
  {
    q: "Does it work for a whole family?",
    a: "Yes. One account can hold multiple profiles, each with its own colour, wardrobes and items. The active profile is always explicit, so you know whose closet you are browsing.",
  },
  {
    q: "How does the AI assistant see my wardrobe?",
    a: "The assistant reads the active profile's inventory through the app's authenticated API. It is instructed to use only those items, and to say when it cannot load the wardrobe instead of inventing clothes.",
  },
  {
    q: "Are my photos used to train models?",
    a: "No. Photos are stored in private Google Cloud Storage. When you ask the assistant or attach a photo, the request is processed by the AI model configured for the deployment — local Ollama or a cloud provider — under that provider's terms.",
  },
  {
    q: "Is Wardro free?",
    a: "Wardro is free while it is in early access. If pricing changes, it will be communicated clearly before any paid plan is introduced.",
  },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-wardro-background">
      <SiteNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 grain opacity-60" />
        <div className="pointer-events-none absolute -left-32 top-24 h-80 w-80 rounded-full bg-wardro-primary-light blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full bg-wardro-accent/20 blur-3xl" />

        <div className="site-container relative grid items-center gap-14 pb-20 pt-16 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-28 lg:pt-24">
          <div>
            <p className="eyebrow flex items-center gap-2">
              <Sparkles size={13} strokeWidth={2.4} />
              A calmer wardrobe for the whole household
            </p>
            <h1 className="editorial mt-5 max-w-2xl text-balance text-[48px] font-semibold leading-[0.98] text-wardro-text-primary sm:text-[64px] lg:text-[76px]">
              Know what you own.
              <span className="block italic text-wardro-primary-dark">
                Wear it better.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-[16px] leading-7 text-wardro-text-secondary sm:text-[17px]">
              Wardro keeps every family member&apos;s wardrobe in one calm place,
              then lets you ask what to wear, find what you own, or photograph a
              new garment before it joins the closet.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#screens"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-wardro-primary-dark px-5 py-3.5 text-[13px] font-bold text-white transition-colors hover:bg-wardro-text-primary"
              >
                See the app
                <ArrowRight size={15} />
              </Link>
              <Link
                href="#download"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-wardro-border bg-wardro-surface px-5 py-3.5 text-[13px] font-bold text-wardro-text-primary transition-colors hover:border-wardro-primary/50"
              >
                <Smartphone size={15} />
                Coming to Android
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-[11.5px] font-semibold text-wardro-text-secondary">
              <span className="inline-flex items-center gap-2">
                <Check size={13} className="text-wardro-success" />
                Family profiles
              </span>
              <span className="inline-flex items-center gap-2">
                <Check size={13} className="text-wardro-success" />
                Photo-first closet
              </span>
              <span className="inline-flex items-center gap-2">
                <Check size={13} className="text-wardro-success" />
                Ad-free
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[430px] lg:max-w-none">
            <div className="absolute left-1/2 top-8 h-[88%] w-[72%] -translate-x-1/2 rotate-[7deg] rounded-[3rem] bg-wardro-primary-light" />
            <div className="absolute right-0 top-24 hidden w-[54%] rotate-[5deg] opacity-90 lg:block">
              <PhoneShot
                src="/screenshots/ask.webp"
                alt="Wardro chat recommending an outfit from the active profile's wardrobe"
                className="scale-[0.98]"
              />
            </div>
            <div className="relative z-10 ml-0 w-[78%] max-w-[340px] -rotate-[3deg] sm:w-[70%] lg:ml-8 lg:w-[68%]">
              <PhoneShot
                src="/screenshots/today.webp"
                alt="Wardro Today screen with family profiles, wardrobe summary and recent items"
                priority
              />
            </div>

            <div className="absolute -bottom-2 right-0 z-20 w-[220px] rounded-2xl border border-wardro-border bg-wardro-surface p-3.5 shadow-card sm:right-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-wardro-primary-light">
                  <Users size={15} className="text-wardro-primary-dark" />
                </span>
                <div>
                  <p className="text-[11px] font-bold text-wardro-text-primary">
                    One account, four profiles
                  </p>
                  <p className="text-[10px] text-wardro-text-secondary">
                    Each with its own closet
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category strip */}
      <section className="border-y border-wardro-border bg-wardro-surface">
        <div className="site-container flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-wardro-text-disabled">
            Built for real wardrobes
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              "Workwear",
              "Weekend",
              "Ethnic wear",
              "School kit",
              "Sports",
              "Occasion",
            ].map((label) => (
              <span
                key={label}
                className="rounded-full border border-wardro-border bg-wardro-background px-3 py-1.5 text-[11px] font-semibold text-wardro-text-secondary"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Product / household */}
      <section id="product" className="site-container py-20 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="eyebrow">One household, many wardrobes</p>
            <h2 className="editorial mt-4 text-balance text-[38px] font-semibold leading-[1.05] text-wardro-text-primary sm:text-[48px]">
              A shared account that still feels personal.
            </h2>
            <p className="mt-5 max-w-lg text-[14.5px] leading-7 text-wardro-text-secondary">
              A household is not one wardrobe. Wardro gives each person their own
              profile, colour and collection, while keeping the account and the
              everyday experience shared. Switching profiles is one tap; the
              greeting still belongs to you.
            </p>
            <div className="mt-8 space-y-4">
              {[
                "Separate profiles for partners, children and yourself",
                "Every wardrobe and item is scoped to the active profile",
                "Add, edit or remove a profile without losing the household",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-wardro-primary-light">
                    <Check size={12} className="text-wardro-primary-dark" />
                  </span>
                  <p className="text-[13.5px] leading-6 text-wardro-text-secondary">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                name: "Tiru",
                role: "Work · Weekend",
                color: "bg-wardro-primary-dark",
              },
              { name: "Swati", role: "Everyday · Occasion", color: "bg-wardro-accent" },
              { name: "Arush", role: "School · Play", color: "bg-wardro-success" },
              { name: "Adiran", role: "Everyday · Sports", color: "bg-wardro-warning" },
            ].map((profile) => (
              <div
                key={profile.name}
                className="rounded-[22px] border border-wardro-border bg-wardro-surface p-5 shadow-card"
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-full text-[14px] font-bold text-white ${profile.color}`}
                >
                  {profile.name.slice(0, 1)}
                </span>
                <p className="mt-4 text-[16px] font-bold text-wardro-text-primary">
                  {profile.name}
                </p>
                <p className="mt-1 text-[11.5px] text-wardro-text-secondary">
                  {profile.role}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-wardro-surface-secondary/60 py-20 sm:py-24">
        <div className="site-container">
          <div className="max-w-2xl">
            <p className="eyebrow">What Wardro does</p>
            <h2 className="editorial mt-4 text-balance text-[38px] font-semibold leading-[1.05] text-wardro-text-primary sm:text-[48px]">
              Less searching. More wearing.
            </h2>
            <p className="mt-5 text-[14.5px] leading-7 text-wardro-text-secondary">
              The everyday jobs of a wardrobe, brought into one quiet place.
              Wardro is deliberately not another social feed or shopping app.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-[22px] border border-wardro-border bg-wardro-surface p-6 shadow-card transition-transform duration-300 hover:-translate-y-1"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-wardro-primary-light">
                  <feature.icon size={18} className="text-wardro-primary-dark" />
                </span>
                <h3 className="mt-5 text-[16px] font-bold leading-6 text-wardro-text-primary">
                  {feature.title}
                </h3>
                <p className="mt-2 text-[13px] leading-6 text-wardro-text-secondary">
                  {feature.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="site-container py-20 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="eyebrow">How it works</p>
            <h2 className="editorial mt-4 text-balance text-[38px] font-semibold leading-[1.05] text-wardro-text-primary sm:text-[48px]">
              Start with what you already own.
            </h2>
            <div className="mt-8 space-y-7">
              {steps.map((step) => (
                <div key={step.number} className="flex gap-4">
                  <span className="mt-0.5 text-[11px] font-bold tracking-[0.12em] text-wardro-accent">
                    {step.number}
                  </span>
                  <div>
                    <h3 className="text-[15px] font-bold text-wardro-text-primary">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 max-w-md text-[13px] leading-6 text-wardro-text-secondary">
                      {step.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto flex w-full max-w-[560px] items-center justify-center">
            <div className="absolute h-[78%] w-[78%] rounded-full bg-wardro-primary-light" />
            <div className="relative z-10 w-[62%] -rotate-[4deg]">
              <PhoneShot
                src="/screenshots/item.webp"
                alt="Wardro item detail with garment photo, details and state"
              />
            </div>
            <div className="relative z-20 -ml-10 mt-24 w-[56%] rotate-[5deg]">
              <PhoneShot
                src="/screenshots/closet.webp"
                alt="Wardro Closet screen with searchable garment grid and wardrobe filters"
              />
            </div>
          </div>
        </div>
      </section>

      {/* AI */}
      <section id="ai" className="bg-wardro-primary-dark py-20 text-white sm:py-24">
        <div className="site-container grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-wardro-primary-light">
              Ask Wardro
            </p>
            <h2 className="editorial mt-4 text-balance text-[38px] font-semibold leading-[1.05] sm:text-[50px]">
              A wardrobe assistant that knows the wardrobe.
            </h2>
            <p className="mt-5 max-w-lg text-[14.5px] leading-7 text-white/70">
              Ask a question in plain language. Wardro reads the active
              profile&apos;s real items, then answers from them — not from a
              generic catalogue. Attach a photo and it will read the garment
              before anything is saved.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                {
                  icon: Search,
                  title: "Inventory questions",
                  body: "“What tops do I own?”",
                },
                {
                  icon: Shirt,
                  title: "Outfit ideas",
                  body: "“Build a casual lunch outfit.”",
                },
                {
                  icon: ScanLine,
                  title: "Photo understanding",
                  body: "Type, colour, pattern, material.",
                },
                {
                  icon: ShieldCheck,
                  title: "Real items only",
                  body: "No invented inventory.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-white/[0.06] p-4"
                >
                  <item.icon size={16} className="text-wardro-primary-light" />
                  <p className="mt-3 text-[12px] font-bold">{item.title}</p>
                  <p className="mt-1 text-[11px] text-white/60">{item.body}</p>
                </div>
              ))}
            </div>

            <p className="mt-8 max-w-lg text-[11.5px] leading-5 text-white/50">
              The assistant runs on a configurable AI backend. In local
              development it can use Ollama; production can use a cloud vision
              or chat model. Your photos are not used to train our models.
            </p>
          </div>

          <div className="mx-auto w-full max-w-[350px]">
            <PhoneShot
              src="/screenshots/ask.webp"
              alt="Wardro chat answering an outfit question from the active profile's real wardrobe"
              className="rotate-[2deg]"
            />
          </div>
        </div>
      </section>

      {/* Screens */}
      <section id="screens" className="site-container py-20 sm:py-24">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="eyebrow">The app</p>
            <h2 className="editorial mt-4 text-balance text-[38px] font-semibold leading-[1.05] text-wardro-text-primary sm:text-[48px]">
              Calm on the surface. Useful underneath.
            </h2>
          </div>
          <p className="max-w-sm text-[13px] leading-6 text-wardro-text-secondary">
            Warm ivory, muted olive and generous whitespace. Every screen is
            built to make the wardrobe feel curated, not like a spreadsheet.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {[
            {
              src: "/screenshots/today.webp",
              label: "Today",
              caption: "Profiles, summary, recent pieces",
            },
            {
              src: "/screenshots/closet.webp",
              label: "Closet",
              caption: "Search, filters, garment grid",
            },
            {
              src: "/screenshots/item.webp",
              label: "Item",
              caption: "Photo, details, state and price",
            },
            {
              src: "/screenshots/ask.webp",
              label: "Ask",
              caption: "Answers from the active profile",
            },
          ].map((screen) => (
            <div key={screen.label}>
              <PhoneShot src={screen.src} alt={`${screen.label} screen in Wardro`} />
              <p className="mt-4 text-[12px] font-bold text-wardro-text-primary">
                {screen.label}
              </p>
              <p className="mt-1 text-[11px] leading-5 text-wardro-text-secondary">
                {screen.caption}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy */}
      <section className="border-y border-wardro-border bg-wardro-surface py-16 sm:py-20">
        <div className="site-container grid gap-8 md:grid-cols-[1fr_1.2fr] md:items-center">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-wardro-primary-light">
              <ShieldCheck size={22} className="text-wardro-primary-dark" />
            </span>
            <div>
              <p className="eyebrow">Private by design</p>
              <h2 className="editorial mt-2 text-[30px] font-semibold leading-tight text-wardro-text-primary">
                Your wardrobe is not a feed.
              </h2>
            </div>
          </div>
          <div className="space-y-3 text-[13px] leading-6 text-wardro-text-secondary">
            <p>
              Wardrobe photos live in private Google Cloud Storage. Account data is
              scoped to your household and protected by Firebase authentication.
              Wardro does not sell your data or run advertising.
            </p>
            <p>
              When you use the assistant, only the content needed for that
              request is sent to the configured model. You can delete profiles,
              items and photos, or request account deletion.
            </p>
            <Link
              href="/privacy"
              className="inline-flex items-center gap-1.5 pt-1 text-[12px] font-bold text-wardro-primary-dark hover:underline"
            >
              Read the privacy policy <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="site-container py-20 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr]">
          <div>
            <p className="eyebrow">Good to know</p>
            <h2 className="editorial mt-4 text-[38px] font-semibold leading-[1.05] text-wardro-text-primary sm:text-[44px]">
              Questions, answered.
            </h2>
          </div>
          <div className="divide-y divide-wardro-border border-y border-wardro-border">
            {faqs.map((faq) => (
              <details key={faq.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[14px] font-bold text-wardro-text-primary [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <span className="text-wardro-primary-dark transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl text-[13px] leading-6 text-wardro-text-secondary">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Download */}
      <section id="download" className="site-container pb-20 sm:pb-28">
        <div className="relative overflow-hidden rounded-[32px] bg-wardro-primary-light px-6 py-12 sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-wardro-accent/20" />
          <div className="relative grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
            <div>
              <p className="eyebrow">Coming to Google Play</p>
              <h2 className="editorial mt-3 max-w-xl text-balance text-[36px] font-semibold leading-[1.05] text-wardro-text-primary sm:text-[48px]">
                Bring your wardrobe into focus.
              </h2>
              <p className="mt-4 max-w-lg text-[13.5px] leading-6 text-wardro-text-secondary">
                Wardro is in active development for Android. Follow the build
                notes on GitHub, or check back here for the first testing
                release.
              </p>
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <a
                href="https://github.com/Thirunavukkarasu/wardro"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-wardro-primary-dark px-5 py-3.5 text-[13px] font-bold text-white transition-colors hover:bg-wardro-text-primary"
              >
                Follow the build
                <ArrowRight size={15} />
              </a>
              <p className="text-[11px] text-wardro-text-secondary md:text-right">
                No spam. No ads. Just the app.
              </p>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
