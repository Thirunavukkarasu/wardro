import type { Metadata } from "next";
import Link from "next/link";

import SiteFooter from "@/components/site/footer";
import SiteNavbar from "@/components/site/navbar";

export const metadata: Metadata = {
  title: "Privacy policy — Wardro",
  description:
    "How Wardro collects, uses, stores and protects household wardrobe data, photos and AI requests.",
};

const sections = [
  { id: "who-we-are", label: "Who we are" },
  { id: "what-we-collect", label: "What we collect" },
  { id: "how-we-use-it", label: "How we use it" },
  { id: "ai-processing", label: "AI processing" },
  { id: "storage-security", label: "Storage and security" },
  { id: "sharing", label: "Sharing" },
  { id: "retention-deletion", label: "Retention and deletion" },
  { id: "children", label: "Children" },
  { id: "rights", label: "Your rights" },
  { id: "cookies", label: "Cookies and analytics" },
  { id: "changes", label: "Changes" },
  { id: "contact", label: "Contact" },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-wardro-background">
      <SiteNavbar />

      <section className="border-b border-wardro-border bg-wardro-surface">
        <div className="site-container py-14 sm:py-20">
          <p className="eyebrow">Trust</p>
          <h1 className="editorial mt-4 max-w-3xl text-balance text-[46px] font-semibold leading-[1.02] text-wardro-text-primary sm:text-[62px]">
            Privacy policy
          </h1>
          <p className="mt-5 max-w-2xl text-[14.5px] leading-7 text-wardro-text-secondary">
            Wardro is a household wardrobe app. This policy explains what we
            collect, why we need it, how AI requests are handled, and how you can
            remove your data.
          </p>
          <p className="mt-5 text-[12px] font-semibold text-wardro-text-disabled">
            Effective 6 November 2026 · Applies to the Wardro Android app and this
            website.
          </p>
        </div>
      </section>

      <div className="site-container grid gap-10 py-12 lg:grid-cols-[220px_1fr] lg:gap-16 lg:py-16">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-wardro-border bg-wardro-surface p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-wardro-text-disabled">
              On this page
            </p>
            <nav className="mt-3 space-y-2">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="block text-[12px] font-medium text-wardro-text-secondary hover:text-wardro-primary-dark"
                >
                  {section.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <article className="max-w-3xl">
          <div className="space-y-10 text-[13.5px] leading-7 text-wardro-text-secondary">
            <section id="who-we-are">
              <h2 className="text-[20px] font-bold text-wardro-text-primary">
                Who we are
              </h2>
              <p className="mt-3">
                Wardro is an independent wardrobe app for households. The
                developer of the Wardro app is responsible for the personal data
                described here. The app is currently in development; this policy
                will remain available from the app and the Google Play listing.
              </p>
            </section>

            <section id="what-we-collect">
              <h2 className="text-[20px] font-bold text-wardro-text-primary">
                What we collect
              </h2>
              <div className="mt-4 overflow-hidden rounded-2xl border border-wardro-border bg-wardro-surface">
                <table className="w-full text-left text-[12.5px]">
                  <thead className="bg-wardro-surface-secondary text-[10px] uppercase tracking-[0.12em] text-wardro-text-disabled">
                    <tr>
                      <th className="px-4 py-3 font-bold">Category</th>
                      <th className="px-4 py-3 font-bold">Examples</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-wardro-border">
                    {[
                      [
                        "Account",
                        "Email address, display name, Firebase user id, sign-in provider, email-verification status.",
                      ],
                      [
                        "Household profiles",
                        "Profile names, colours, avatar URLs, default-profile flag, wardrobe and item counts.",
                      ],
                      [
                        "Wardrobe",
                        "Item names, photos, category, colour, size, brand, price, state, purchase/expiry dates and notes.",
                      ],
                      [
                        "Assistant",
                        "Chat messages, the active profile id, conversation thread id, and any photo you choose to attach.",
                      ],
                      [
                        "Diagnostics",
                        "Basic service logs and error information from Firebase, hosting and database providers; no advertising identifiers.",
                      ],
                    ].map(([category, examples]) => (
                      <tr key={category}>
                        <td className="px-4 py-3 align-top font-semibold text-wardro-text-primary">
                          {category}
                        </td>
                        <td className="px-4 py-3 align-top">{examples}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4">
                We do not ask for payment details. We do not collect contacts,
                precise location, health data, or advertising identifiers. If a
                feature needs a new category of data later, this policy will be
                updated before it is used.
              </p>
            </section>

            <section id="how-we-use-it">
              <h2 className="text-[20px] font-bold text-wardro-text-primary">
                How we use it
              </h2>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>To create and secure your account and keep you signed in.</li>
                <li>
                  To show the wardrobes, items and profiles that belong to your
                  household, scoped to the active profile.
                </li>
                <li>
                  To answer inventory questions and suggest outfits from the
                  active profile&apos;s real items.
                </li>
                <li>
                  To classify an attached garment photo when you ask for it, and
                  return attributes such as type, colour, pattern and material.
                </li>
                <li>
                  To operate, debug and protect the service, including preventing
                  abuse and responding to support requests.
                </li>
              </ul>
              <p className="mt-4">
                We do not sell personal data. We do not use your wardrobe photos
                or chat messages for advertising.
              </p>
            </section>

            <section id="ai-processing">
              <h2 className="text-[20px] font-bold text-wardro-text-primary">
                AI processing
              </h2>
              <p className="mt-3">
                Wardro has an optional wardrobe assistant. When you send a chat
                message or attach a photo, the request is sent to the AI model
                configured for the deployment. A local development deployment can
                use an Ollama server running on the developer&apos;s machine; a
                production deployment may use a cloud model provider.
              </p>
              <p className="mt-3">
                The request contains only what is needed for that turn: your
                message, the active profile&apos;s relevant wardrobe items, and
                the image if you attached one. It does not include your Firebase
                token in graph state or conversation checkpoints. We do not use
                your content to train our own models. Cloud providers process
                data under their own terms and privacy policies.
              </p>
              <p className="mt-3">
                The assistant is instructed to use only the inventory supplied to
                it and to say when it cannot load your wardrobe. AI output can be
                wrong; you should confirm garment details before saving them.
              </p>
            </section>

            <section id="storage-security">
              <h2 className="text-[20px] font-bold text-wardro-text-primary">
                Storage and security
              </h2>
              <p className="mt-3">
                Account authentication and wardrobe photos are handled by Google
                Firebase (Firebase Authentication and Firebase Storage).
                Wardrobe records are stored in a PostgreSQL database, and the API
                and website are hosted by service providers. Data is transmitted
                over TLS. Access to wardrobe records is restricted to the
                authenticated account and the active profile; Storage rules
                restrict photo access to the signed-in user.
              </p>
              <p className="mt-3">
                No service is perfectly secure. If we become aware of a breach
                affecting your data, we will take reasonable steps to notify
                affected users and the relevant authorities where required.
              </p>
            </section>

            <section id="sharing">
              <h2 className="text-[20px] font-bold text-wardro-text-primary">
                Sharing
              </h2>
              <p className="mt-3">
                We share data only with service providers needed to run Wardro:
                Google Firebase (authentication, storage, hosting), our
                PostgreSQL database provider, and the configured AI model
                provider. These providers process data on our behalf or as
                independent controllers under their own terms. We may disclose
                data if required by law or to protect the service and its users.
                We do not sell personal data.
              </p>
            </section>

            <section id="retention-deletion">
              <h2 className="text-[20px] font-bold text-wardro-text-primary">
                Retention and deletion
              </h2>
              <p className="mt-3">
                We keep account and wardrobe data while your account is active.
                Deleting an item removes its record and requests removal of its
                stored photo. Deleting a profile removes its wardrobes, items and
                photos. Account deletion removes your account and associated
                household data, subject to short-lived backup retention.
              </p>
              <p className="mt-3">
                You can request account deletion from the{" "}
                <Link
                  href="/account-deletion"
                  className="font-semibold text-wardro-primary-dark underline underline-offset-2"
                >
                  account deletion page
                </Link>
                . In-app account deletion is being added; until then, use the
                request page or the developer contact email on the Google Play
                listing. We aim to complete verified requests within 30 days.
              </p>
            </section>

            <section id="children">
              <h2 className="text-[20px] font-bold text-wardro-text-primary">
                Children
              </h2>
              <p className="mt-3">
                Wardro is intended for adults managing a household wardrobe. It
                is not directed to children under 13. A parent or guardian may
                create a profile describing a child and manage that child&apos;s
                clothes; the account itself must be controlled by an adult. If
                you believe a child under 13 has created an account, contact us
                and we will delete it.
              </p>
            </section>

            <section id="rights">
              <h2 className="text-[20px] font-bold text-wardro-text-primary">
                Your rights
              </h2>
              <p className="mt-3">
                Depending on where you live, you may have the right to access,
                correct, delete, restrict or object to the processing of your
                personal data, and to request a portable copy. You can edit
                profile and item data in the app, or contact us for a request. We
                may need to verify your identity before acting.
              </p>
            </section>

            <section id="cookies">
              <h2 className="text-[20px] font-bold text-wardro-text-primary">
                Cookies and analytics
              </h2>
              <p className="mt-3">
                This website does not use advertising cookies or third-party
                advertising trackers. The app uses Firebase&apos;s local session
                persistence to keep you signed in. Hosting and infrastructure
                providers may keep standard operational logs. We do not currently
                run a third-party product-analytics SDK in the app.
              </p>
            </section>

            <section id="changes">
              <h2 className="text-[20px] font-bold text-wardro-text-primary">
                Changes
              </h2>
              <p className="mt-3">
                We may update this policy as the app develops. The effective date
                at the top of the page will change, and material changes will be
                communicated in the app or on this page before they take effect.
              </p>
            </section>

            <section id="contact">
              <h2 className="text-[20px] font-bold text-wardro-text-primary">
                Contact
              </h2>
              <p className="mt-3">
                For privacy questions, data requests or account deletion, use the
                developer contact email shown on Wardro&apos;s Google Play
                listing, or open an issue in the{" "}
                <a
                  href="https://github.com/Thirunavukkarasu/wardro"
                  className="font-semibold text-wardro-primary-dark underline underline-offset-2"
                >
                  Wardro repository
                </a>
                . Please do not include sensitive photos or identity documents in
                a public issue.
              </p>
            </section>
          </div>

          <div className="mt-12 rounded-2xl border border-wardro-border bg-wardro-surface p-5">
            <p className="text-[12px] font-bold text-wardro-text-primary">
              A note on this policy
            </p>
            <p className="mt-2 text-[12px] leading-6 text-wardro-text-secondary">
              This policy describes the current app and its service providers. It
              should be reviewed again before the public Google Play release,
              especially if the AI provider, hosting provider or account-deletion
              flow changes.
            </p>
          </div>
        </article>
      </div>

      <SiteFooter />
    </main>
  );
}
