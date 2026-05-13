import Link from "next/link";
import type { Listing } from "@/lib/domain/types";

type HeroCardStackProps = {
  listings: Listing[];
};

export function HeroCardStack({ listings }: HeroCardStackProps) {
  if (listings.length < 3) return null;
  const [hero, back1, back2] = listings;

  return (
    <div className="relative mx-auto aspect-[5/4] w-full max-w-[560px]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 blur-3xl"
        style={{
          background:
            "radial-gradient(55% 55% at 50% 50%, rgba(109,161,255,0.32), rgba(168,109,255,0.18) 45%, transparent 75%)",
        }}
      />

      <Link
        href={`/market/${back1.id}`}
        aria-label={back1.cardName}
        className="group absolute left-[1%] top-[6%] hidden aspect-[3/4] w-[42%] -rotate-[14deg] transition-transform duration-500 ease-out hover:-translate-y-2 hover:rotate-[-10deg] md:block"
      >
        <BackCardImage listing={back1} />
      </Link>

      <Link
        href={`/market/${back2.id}`}
        aria-label={back2.cardName}
        className="group absolute bottom-[4%] right-[1%] hidden aspect-[3/4] w-[42%] rotate-[12deg] transition-transform duration-500 ease-out hover:-translate-y-2 hover:rotate-[8deg] md:block"
      >
        <BackCardImage listing={back2} />
      </Link>

      <Link
        href={`/market/${hero.id}`}
        aria-label={hero.cardName}
        className="group absolute left-1/2 top-1/2 block aspect-[3/4] w-[58%] -translate-x-1/2 -translate-y-1/2 -rotate-[4deg] transition-transform duration-500 ease-out hover:-translate-x-1/2 hover:-translate-y-[54%] hover:rotate-0 hover:scale-[1.02] md:w-[52%]"
      >
        <div
          className="relative h-full w-full overflow-hidden rounded-[14px]"
          style={{
            boxShadow:
              "0 28px 60px -14px rgba(0,0,0,0.7), 0 10px 22px -8px rgba(0,0,0,0.55)",
          }}
        >
          {hero.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hero.imageUrl}
              alt={hero.cardName}
              className="h-full w-full object-cover"
              loading="eager"
            />
          ) : (
            <div className="grid h-full place-items-center bg-[var(--bg-1)] t-xs t-soft">
              Sin foto
            </div>
          )}

          <div className="absolute bottom-2 right-2 glass-soft px-2.5 py-1 t-mono t-xs font-extrabold text-[var(--ink)] backdrop-blur-md">
            ARS {hero.priceArs.toLocaleString("es-AR")}
          </div>
        </div>
      </Link>
    </div>
  );
}

function BackCardImage({ listing }: { listing: Listing }) {
  return (
    <div
      className="h-full w-full overflow-hidden rounded-[12px] opacity-90 transition-opacity duration-500 group-hover:opacity-100"
      style={{
        boxShadow:
          "0 20px 44px -12px rgba(0,0,0,0.6), 0 6px 14px -6px rgba(0,0,0,0.45)",
        filter: "blur(0.4px)",
      }}
    >
      {listing.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={listing.imageUrl}
          alt={listing.cardName}
          className="h-full w-full object-cover"
          loading="eager"
        />
      ) : (
        <div className="grid h-full place-items-center bg-[var(--bg-1)] t-xs t-soft">
          Sin foto
        </div>
      )}
    </div>
  );
}
