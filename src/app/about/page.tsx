import type { Metadata } from "next";
export const metadata: Metadata = { title: "About" };
export default function AboutPage() {
  return (
    <div className="prose-basic max-w-3xl">
      <h1 className="text-3xl font-bold">About NC Risk Radar</h1>
      <p>NC Risk Radar (NCWarn.com) is a personalized early-warning service for North Carolina. It consolidates fragmented public records and official notices, matches them to an address or saved interest, explains their practical significance, and notifies you early enough to act.</p>
      <p>It is not a newspaper, a mugshot site, a political blog, or a generic data directory. Public records and news are inputs; the value is in consolidation, matching, explanation, and timely notice — always with a link back to the original source.</p>
      <h2>Independence</h2>
      <p>NC Risk Radar is an independent product of NCWarn.com. It is not affiliated with NCWARN.org or the environmental nonprofit that uses the name “NC WARN”, and it is not an energy-activism organization.</p>
      <h2>Contact</h2>
      <p><a href="mailto:contact@ncwarn.com">contact@ncwarn.com</a></p>
    </div>
  );
}
