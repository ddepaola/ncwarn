import type { Metadata } from "next";
export const metadata: Metadata = { title: "Privacy policy" };
export default function PrivacyPage() {
  return (
    <div className="prose-basic max-w-3xl">
      <h1 className="text-3xl font-bold">Privacy policy</h1>
      <p><em>Draft pending counsel review. Effective 2026-09-02.</em></p>
      <h2>What we collect</h2>
      <ul>
        <li><strong>Addresses you check.</strong> Stored with the geocoded result to generate your preview and for aggregate service metrics.</li>
        <li><strong>Email address</strong>, only if you ask for alerts, with the time and source of your consent.</li>
        <li><strong>Contact messages</strong> you send us.</li>
        <li><strong>Technical data</strong>: a salted, truncated network classification (not your raw IP) for rate limiting and abuse prevention; standard server logs.</li>
      </ul>
      <h2>What we do not do</h2>
      <ul><li>We do not sell personal data. We do not store registered-offender records. We do not use third-party advertising trackers.</li></ul>
      <h2>Your choices</h2>
      <ul><li>Unsubscribe from any email with one click. Request deletion of your account data via <a href="/contact">contact</a>; we retain only what law or billing requires.</li></ul>
    </div>
  );
}
