import Image from 'next/image';

export default function Companies() {
  return (
    <div>
      <div className="text-sm text-neutral-500 mb-2">
        Trusted by engineering teams at:
      </div>

      <div className="flex gap-6 items-center">
        <div className="grayscale hover:grayscale-0 transition-all">
          <Image
            src="/perplexity-logo.png"
            alt="Perplexity"
            width={120}
            height={30}
          />
        </div>
        <div className="grayscale hover:grayscale-0 transition-all">
          <Image
            src="/shopify-logo.png"
            alt="Shopify"
            width={90}
            height={30}
          />
        </div>
        <div className="grayscale hover:grayscale-0 transition-all">
          <Image src="/faire-logo.svg" alt="Faire" width={120} height={30} />
        </div>
      </div>
    </div>
  );
}
