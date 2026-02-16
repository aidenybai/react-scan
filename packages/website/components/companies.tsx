import Image from 'next/image';

const LOGO_FILTER = 'brightness(0) invert(1) drop-shadow(0 0 0 white) drop-shadow(0 0 0 white)';

interface CompanyLogo {
  src: string;
  alt: string;
  width: number;
}

const LOGOS: CompanyLogo[] = [
  { src: '/perplexity-logo.png', alt: 'Perplexity', width: 120 },
  { src: '/shopify-logo.png', alt: 'Shopify', width: 90 },
  { src: '/faire-logo.svg', alt: 'Faire', width: 120 },
];

export default function Companies() {
  return (
    <div className="pt-2">
      <div className="mb-3 text-sm text-white/50 sm:text-base">
        Trusted by engineering teams at:
      </div>
      <div className="flex items-center gap-6">
        {LOGOS.map((logo) => (
          <div
            key={logo.alt}
            className="opacity-50 transition-opacity hover:opacity-80"
          >
            <Image
              src={logo.src}
              alt={logo.alt}
              width={logo.width}
              height={30}
              style={{ filter: LOGO_FILTER }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
