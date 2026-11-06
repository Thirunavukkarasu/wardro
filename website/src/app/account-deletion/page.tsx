import type { Metadata } from "next";
import Link from "next/link";

import SiteFooter from "@/components/site/footer";
import SiteNavbar from "@/components/site/navbar";

export const metadata: Metadata = {
  title: "Delete your account — Wardro",
  description:
    "How to request deletion of your Wardro account, household profiles, wardrobe items and photos.",
};

export default function AccountDeletionPage() {
  return (
    <main className="min-h-screen bg-wardro-background">
      <SiteNavbar />

      <section className="border-b border-wardro-border bg-wardro-surface">
        <div className="site-container py-14 sm:py-20">
          <p className="eyebrow">Account</p>
          <h1 className="editorial mt-4 max-w-3xl text-balance text-[46px] font-semibold leading-[1.02] text-wardro-text-primary sm:text-[62px]">
            Delete your account
          </h1>
          <p className="mt-5 max-w-2xl text-[14.5px] leading-7 text-wardro-text-secondary">
            You can remove individual items and profiles in the app. To delete
            your entire Wardro account and all household data, use the request
            steps below.
          </p>
        </div>
      </section>

      <div className="site-container max-w-3xl py-12 lg:py-16">
        <div className="rounded-[24px] border border-wardro-border bg-wardro-surface p-6 shadow-card sm:p-8">
          <h2 className="text-[18px] font-bold text-wardro-text-primary">
            Request account deletion
          </h2>
          <ol className="mt-5 space-y-5">
            {[
              {
                title: "Email from the account address",
                body: "Use the developer contact email shown on Wardro's Google Play listing. Send the request from the same email address you use to sign in to Wardro.",
              },
              {
                title: "Use the subject line",
                body: "Write “Account deletion — [your Wardro account email]” in the subject so the request is routed correctly.",
              },
              {
                title: "Tell us what to delete",
                body: "Confirm that you want the entire account deleted, including household profiles, wardrobes, items and photos. If you only want one profile removed, you can do that in the app instead.",
              },
              {
                title: "We verify and delete",
                body: "We may ask a simple verification question to make sure the request is yours. Verified requests are completed within 30 days.",
              },
              {
                title: "You receive confirmation",
                body: "We will confirm when the account deletion is complete. Short-lived backup copies may remain for a limited period before they are overwritten.",
              },
            ].map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-wardro-primary-light text-[11px] font-bold text-wardro-primary-dark">
                  {index + 1}
                </span>
                <div>
                  <p className="text-[13.5px] font-bold text-wardro-text-primary">
                    {step.title}
                  </p>
                  <p className="mt-1 text-[13px] leading-6 text-wardro-text-secondary">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-wardro-border bg-wardro-surface-secondary p-5">
            <h3 className="text-[13px] font-bold text-wardro-text-primary">
              What is deleted
            </h3>
            <ul className="mt-3 list-disc space-y-1.5 pl-4 text-[12.5px] leading-6 text-wardro-text-secondary">
              <li>Firebase Authentication account</li>
              <li>Household profile rows</li>
              <li>Wardrobes and wardrobe items</li>
              <li>Item photos in Firebase Storage</li>
              <li>Chat threads and AI analysis records</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-wardro-border bg-wardro-surface-secondary p-5">
            <h3 className="text-[13px] font-bold text-wardro-text-primary">
              What may remain briefly
            </h3>
            <ul className="mt-3 list-disc space-y-1.5 pl-4 text-[12.5px] leading-6 text-wardro-text-secondary">
              <li>Operational logs without wardrobe content</li>
              <li>Encrypted database backups until rotation</li>
              <li>Records required by applicable law</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-wardro-border bg-wardro-surface p-5">
          <p className="text-[13px] font-bold text-wardro-text-primary">
            Prefer to remove less?
          </p>
          <p className="mt-2 text-[13px] leading-6 text-wardro-text-secondary">
            In the app, open a profile to delete it, or open an item to delete
            the garment and its photo. Deleting a profile removes its wardrobes,
            items and photos; the last profile cannot be deleted without deleting
            the account.
          </p>
          <Link
            href="/privacy"
            className="mt-3 inline-block text-[12px] font-bold text-wardro-primary-dark underline underline-offset-2"
          >
            Read the privacy policy
          </Link>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
