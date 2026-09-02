import type { Metadata } from "next";
import { issueFormToken } from "@/modules/notifications/honeypot";
import { SignupForm } from "@/components/SignupForm";
export const metadata: Metadata = { title: "Address alerts" };
export const dynamic = "force-dynamic";

export default function AlertsPage() {
  return (
    <div className="prose-basic max-w-3xl">
      <h1 className="text-3xl font-bold">Address watches and alerts</h1>
      <p>Save an address and choose a radius (½, 1, 3 or 5 miles), the topics you care about (crime, official registry alerts, development, roads, environment, property, government) and how often to hear from us (immediate, daily digest or weekly digest). Email first; SMS only with explicit opt-in.</p>
      <p>Watches launch with the next release. Leave your email and we’ll tell you when they’re live.</p>
      <div className="not-prose bg-card border border-border rounded-lg p-4 mt-4"><SignupForm token={issueFormToken()} /></div>
    </div>
  );
}
