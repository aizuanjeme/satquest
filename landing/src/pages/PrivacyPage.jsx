import { Link } from 'react-router-dom';

const SECTIONS = [
  {
    title: '1. Overview',
    body: `SatQuest ("we", "our", "the App") is committed to protecting your privacy. This Privacy Policy explains what information we collect, how we use it, and your rights regarding that information. SatQuest is an open-source project and we aim to collect as little data as possible.`,
  },
  {
    title: '2. Information We Collect',
    body: `We collect minimal information necessary to operate the Service:\n\n• Avatar & username: The display name and avatar you choose when creating a profile.\n• Quiz progress & scores: Your level completion status and leaderboard scores, stored to enable gameplay continuity.\n• Lightning address (optional): If you choose to link a Lightning address to receive sat rewards, we store only that address.\n• Technical logs: Standard server logs including IP addresses and request metadata, retained for up to 30 days for security and debugging purposes.`,
  },
  {
    title: '3. Information We Do NOT Collect',
    body: `We do not collect:\n\n• Your real name, email address, or phone number (unless you voluntarily provide them via Discord or GitHub).\n• Payment card details or bank information.\n• Precise geolocation data.\n• Behavioural tracking data sold to third parties.\n• Biometric data of any kind.`,
  },
  {
    title: '4. Discord Integration',
    body: `Certain features — including tournaments and community events — require you to join our Discord server (discord.gg/Ttwg2yrzYC). When you join Discord, Discord's own Privacy Policy governs the data they collect. We only access your Discord username and user ID where you explicitly grant permission through Discord's OAuth flow.`,
  },
  {
    title: '5. Cookies & Local Storage',
    body: `SatQuest uses browser localStorage to save your quiz progress and preferences locally on your device. We do not use third-party tracking cookies or advertising cookies. Any analytics we run are privacy-respecting (aggregate, anonymised, no fingerprinting).`,
  },
  {
    title: '6. How We Use Your Information',
    body: `We use the information we collect to:\n\n• Display your avatar, username, and score on leaderboards.\n• Distribute sat rewards to your linked Lightning address.\n• Improve the educational content and platform experience.\n• Investigate security incidents or abuse.\n\nWe do not sell, rent, or trade your personal information to any third party.`,
  },
  {
    title: '7. Data Retention',
    body: `Your profile and game data are retained for as long as your account is active. If you request deletion of your account, we will permanently delete your personal data within 30 days, except where we are required by law to retain it.`,
  },
  {
    title: '8. Security',
    body: `We apply industry-standard security measures including HTTPS encryption, access controls, and regular security reviews. However, no method of transmission over the internet is 100% secure. You use the Service at your own risk.`,
  },
  {
    title: '9. Children\'s Privacy',
    body: `SatQuest is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child under 13 has provided us personal information, please contact us immediately so we can delete it.`,
  },
  {
    title: '10. Third-Party Links',
    body: `The Service may contain links to third-party websites (e.g., GitHub, Discord, external Bitcoin resources). We are not responsible for the privacy practices of those sites. We encourage you to review the privacy policies of any third-party sites you visit.`,
  },
  {
    title: '11. Your Rights',
    body: `Depending on your jurisdiction, you may have the right to:\n\n• Access the personal data we hold about you.\n• Request correction of inaccurate data.\n• Request deletion of your data ("right to be forgotten").\n• Object to or restrict certain processing.\n\nTo exercise any of these rights, please reach out on our Discord server or GitHub.`,
  },
  {
    title: '12. Changes to This Policy',
    body: `We may update this Privacy Policy from time to time. We will post the updated version on this page with a revised "Last updated" date. Continued use of the Service after changes constitutes acceptance of the updated policy.`,
  },
  {
    title: '13. Contact Us',
    body: `If you have questions or concerns about this Privacy Policy, please contact us via our Discord server at discord.gg/Ttwg2yrzYC or open an issue on our GitHub repository. We aim to respond within 7 business days.`,
  },
];

export default function PrivacyPage() {
  return (
    <div
      className="min-h-screen w-full"
      style={{ background: 'linear-gradient(145deg, #001018 0%, #000d28 60%, #001a10 100%)' }}
    >
      {/* Dot grid */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(0,229,255,0.12) 1px, transparent 1px)',
          backgroundSize: '34px 34px',
          opacity: 0.5,
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-16">
        {/* Back */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 no-underline text-[0.82rem] font-bold text-white/30 hover:text-white/60 transition-colors duration-200 mb-10"
        >
          ← Back to SatQuest
        </Link>

        {/* Header */}
        <div className="mb-12">
          <p className="text-[0.78rem] font-black tracking-[0.18em] uppercase text-[#00E5FF] mb-3">
            Legal
          </p>
          <h1 className="text-[clamp(2rem,5vw,3.2rem)] font-black text-[#FFF7FF] leading-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-[0.88rem] text-white/35">
            Last updated: 29 May 2026
          </p>
          <div
            className="mt-6 p-4 rounded-2xl text-[0.85rem] text-white/50 leading-relaxed"
            style={{ background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.18)' }}
          >
            Your privacy matters. We collect only what is necessary to run SatQuest and never sell your data.
          </div>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-8">
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <h2 className="text-[1rem] font-black text-[#FFF7FF] mb-2">{s.title}</h2>
              <p className="text-[0.9rem] text-white/50 leading-[1.8] whitespace-pre-line">{s.body}</p>
            </div>
          ))}
        </div>

        {/* Footer strip */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-wrap gap-4 items-center justify-between">
          <Link to="/" className="text-[1.1rem] font-black no-underline text-[#FFF7FF]">
            ⚡ <span className="text-[#FF9500]">Sat</span>Quest
          </Link>
          <div className="flex gap-5 text-[0.82rem] font-semibold">
            <Link to="/terms" className="no-underline text-[#7A5DC9] hover:text-[#FFF7FF] transition-colors">Terms & Conditions</Link>
            <a href="https://discord.gg/Ttwg2yrzYC" target="_blank" rel="noopener noreferrer" className="no-underline text-[#7A5DC9] hover:text-[#FFF7FF] transition-colors">Discord</a>
          </div>
        </div>
      </div>
    </div>
  );
}
