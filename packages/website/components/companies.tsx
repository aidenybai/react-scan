import Image from 'next/image';

export default function Companies() {
  return (
    <div>
      <div className="mb-2 text-sm text-neutral-500">
        Trusted by engineering teams at:
      </div>

      <div className="flex items-center gap-6">
        <div className="grayscale transition-all hover:grayscale-0">
          <Image
            src="/perplexity-logo.png"
            alt="Perplexity"
            width={120}
            height={30}
          />
        </div>
        <div className="grayscale transition-all hover:grayscale-0">
          <Image
            src="/shopify-logo.png"
            alt="Shopify"
            width={90}
            height={30}
          />
        </div>
        <div className="grayscale transition-all hover:grayscale-0">
          <Image src="/faire-logo.svg" alt="Faire" width={120} height={30} />
        </div>
      </div>
    </div>
  );
}
