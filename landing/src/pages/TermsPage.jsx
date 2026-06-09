import { Link } from 'react-router-dom';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: `By accessing or using SatQuest ("the App", "the Service"), you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the Service. We reserve the right to update these terms at any time; continued use after changes constitutes acceptance.`,
  },
  {
    title: '2. Description of Service',
    body: `SatQuest is a free, open-source Bitcoin education platform that allows users to learn about Bitcoin and the Lightning Network through progressive quiz levels. Users may earn satoshis ("sats") as rewards for completing levels, subject to availability of funds and platform conditions.`,
  },
  {
    title: '3. Not Financial Advice',
    body: `Nothing on SatQuest constitutes financial, investment, legal, or tax advice. Bitcoin and other digital assets are highly volatile. Any sats earned through the platform are for educational and engagement purposes only. You are solely responsible for your own financial decisions.`,
  },
  {
    title: '4. Eligibility',
    body: `You must be at least 13 years of age to use SatQuest. By using the Service, you represent and warrant that you meet this requirement and that you have the legal capacity to enter into these terms in your jurisdiction.`,
  },
  {
    title: '5. User Conduct',
    body: `You agree not to: (a) use the Service for any unlawful purpose; (b) attempt to exploit, hack, or reverse-engineer any part of the platform; (c) create multiple accounts to abuse reward systems; (d) impersonate other users or SatQuest staff; or (e) engage in any activity that disrupts or interferes with the Service.`,
  },
  {
    title: '6. Tournaments',
    body: `Tournament features are currently in development and marked "Coming Soon." When live, tournament rules, entry fees, and prize distributions will be governed by additional terms published at that time. Participation in paid tournaments requires joining our official Discord server and agreeing to tournament-specific rules.`,
  },
  {
    title: '7. Intellectual Property',
    body: `The SatQuest codebase is released under the MIT License. All quiz content, branding, avatar artwork, and associated materials remain the property of the SatQuest contributors. You may not reproduce, distribute, or create derivative works from non-code assets without prior written permission.`,
  },
  {
    title: '8. Rewards & Satoshis',
    body: `Sat rewards are distributed at our sole discretion and are subject to change or discontinuation at any time without notice. Sats have no guaranteed monetary value on our platform. We are not responsible for fluctuations in Bitcoin market price or the value of any rewards earned.`,
  },
  {
    title: '9. Disclaimers & Limitation of Liability',
    body: `The Service is provided "as is" and "as available" without warranties of any kind, express or implied. To the fullest extent permitted by law, SatQuest and its contributors shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service.`,
  },
  {
    title: '10. Governing Law',
    body: `These Terms shall be governed by and construed in accordance with applicable law. Any disputes arising under or related to these Terms shall be resolved through good-faith negotiation, and if unresolved, through binding arbitration or the courts of competent jurisdiction.`,
  },
  {
    title: '11. Contact',
    body: `For questions about these Terms, please reach us through our Discord server at discord.gg/Ttwg2yrzYC or open an issue on our GitHub repository.`,
  },
];

export default function TermsPage() {
  return (
    <div
      className="min-h-screen w-full"
      style={{ background: 'linear-gradient(145deg, #08001e 0%, #100025 60%, #060018 100%)' }}
    >
      {/* Dot grid */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(184,69,255,0.12) 1px, transparent 1px)',
          backgroundSize: '34px 34px',
          opacity: 0.55,
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
          <p className="text-[0.78rem] font-black tracking-[0.18em] uppercase text-[#B845FF] mb-3">
            Legal
          </p>
          <h1 className="text-[clamp(2rem,5vw,3.2rem)] font-black text-[#FFF7FF] leading-tight mb-4">
            Terms & Conditions
          </h1>
          <p className="text-[0.88rem] text-white/35">
            Last updated: 29 May 2026
          </p>
          <div
            className="mt-6 p-4 rounded-2xl text-[0.85rem] text-white/50 leading-relaxed"
            style={{ background: 'rgba(184,69,255,0.07)', border: '1px solid rgba(184,69,255,0.2)' }}
          >
            Please read these terms carefully before using SatQuest. By accessing the platform you agree to the conditions below.
          </div>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-8">
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <h2 className="text-[1rem] font-black text-[#FFF7FF] mb-2">{s.title}</h2>
              <p className="text-[0.9rem] text-white/50 leading-[1.8]">{s.body}</p>
            </div>
          ))}
        </div>

        {/* Footer strip */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-wrap gap-4 items-center justify-between">
          <Link to="/" className="text-[1.1rem] font-black no-underline text-[#FFF7FF]">
            ⚡ <span className="text-[#FF9500]">Sat</span>Quest
          </Link>
          <div className="flex gap-5 text-[0.82rem] font-semibold">
            <Link to="/privacy" className="no-underline text-[#7A5DC9] hover:text-[#FFF7FF] transition-colors">Privacy Policy</Link>
            <a href="https://discord.gg/Ttwg2yrzYC" target="_blank" rel="noopener noreferrer" className="no-underline text-[#7A5DC9] hover:text-[#FFF7FF] transition-colors">Discord</a>
          </div>
        </div>
      </div>
    </div>
  );
}
