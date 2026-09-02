import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { issueFormToken } from "@/modules/notifications/honeypot";
export const metadata: Metadata = { title: "Contact and corrections" };
export const dynamic = "force-dynamic";

export default function ContactPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold">Contact and corrections</h1>
      <p className="text-muted mt-2 mb-6">Questions, press, partnerships, or a correction request. Email <a className="underline" href="mailto:contact@ncwarn.com">contact@ncwarn.com</a> or use the form. We do not accept anonymous allegations about individuals; corrections should cite an official record.</p>
      <ContactForm token={issueFormToken()} />
    </div>
  );
}
