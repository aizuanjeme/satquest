export default function AvatarCard({ src, alt, label, isCenter, floatClass }) {
  return (
    <div
      className={[
        'relative rounded-[24px] overflow-hidden',
        'bg-[rgba(184,69,255,0.15)]',
        'border-[1.5px]',
        isCenter
          ? 'border-[rgba(255,149,0,0.5)] shadow-[0_0_40px_rgba(255,149,0,0.25),0_8px_32px_rgba(184,69,255,0.2)] max-w-[160px]'
          : 'border-[rgba(184,69,255,0.25)] shadow-[0_8px_32px_rgba(184,69,255,0.15)] max-w-[140px]',
        'aspect-[3/4] w-full',
        'transition-all duration-300',
        'hover:-translate-y-2 hover:scale-[1.04] hover:shadow-[0_20px_50px_rgba(184,69,255,0.35)]',
        floatClass,
      ].join(' ')}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="w-full h-full object-cover object-top block"
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(184,69,255,0.3)] pointer-events-none" />
      {/* Sats badge */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-[rgba(11,0,48,0.85)] border border-[rgba(184,69,255,0.4)] rounded-full px-2.5 py-0.5 text-[0.68rem] font-extrabold whitespace-nowrap text-[#FFE600]">
        {label}
      </div>
    </div>
  );
}
