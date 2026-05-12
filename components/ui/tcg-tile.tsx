import Image from "next/image";
import { cn } from "@/lib/ui/cn";

export type CardType =
  | "fire"
  | "water"
  | "electric"
  | "grass"
  | "psychic"
  | "dragon"
  | "fairy"
  | "dark"
  | "normal";

export const TYPE_PALETTE: Record<CardType, [string, string]> = {
  fire: ["#FF7A3D", "#FF3D7A"],
  water: ["#4DA8FF", "#5B6BFF"],
  electric: ["#FFD24A", "#FF9A3C"],
  grass: ["#4DD08C", "#2EA7BD"],
  psychic: ["#C77DFF", "#FF6FA8"],
  dragon: ["#8B7CFF", "#3D7BFD"],
  fairy: ["#FF8FB3", "#FFC56E"],
  dark: ["#6E5C82", "#1F2540"],
  normal: ["#B7B7B7", "#7A7A8A"],
};

export interface TCGTileCard {
  id: string;
  name: string;
  type?: CardType;
  num?: string | number;
  rarity?: string;
  condition?: string;
  price?: number;
  delta?: number;
  imageUrl?: string | null;
}

export interface TCGTileProps {
  card: TCGTileCard;
  href?: string;
  onClick?: () => void;
  compact?: boolean;
  className?: string;
}

export function CardArt({
  name,
  type = "normal",
  num = "001",
  rarity = "Holo",
  imageUrl,
}: Pick<TCGTileCard, "name" | "type" | "num" | "rarity" | "imageUrl">) {
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={name}
        fill
        sizes="(max-width: 768px) 50vw, 220px"
        className="object-cover"
      />
    );
  }
  const [c1, c2] = TYPE_PALETTE[type] ?? TYPE_PALETTE.normal;
  return (
    <div
      className="absolute inset-0 flex flex-col justify-between p-2.5"
      style={{
        background: `
          radial-gradient(110% 70% at 50% 18%, ${c1}cc, transparent 60%),
          radial-gradient(120% 90% at 80% 100%, ${c2}88, transparent 70%),
          linear-gradient(180deg, #0E1633, #060A1C)`,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="t-mono inline-flex items-center rounded-full border border-white/20 bg-black/40 px-2 py-0.5 text-[9.5px] font-bold tracking-wider text-white backdrop-blur-md">
          {num}
        </span>
        <span
          className="grid h-5.5 w-5.5 place-items-center rounded-full text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
          style={{
            width: 22,
            height: 22,
            background: `radial-gradient(circle at 35% 30%, white, ${c1})`,
            boxShadow: `0 0 14px ${c1}aa, inset 0 1px 0 rgba(255,255,255,0.7)`,
          }}
        >
          <span className="text-[10px] font-bold">{type[0]?.toUpperCase()}</span>
        </span>
      </div>

      <div className="grid flex-1 place-items-center">
        <div
          className="aspect-square w-[62%]"
          style={{
            background: `radial-gradient(closest-side, ${c1}, ${c2}66 60%, transparent 75%)`,
            filter: "blur(2px) saturate(1.2)",
          }}
        />
        <div
          className="absolute text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/90 [font-family:var(--f-display)] [text-shadow:0_2px_12px_rgba(0,0,0,0.5)]"
        >
          {name}
        </div>
      </div>

      <div className="flex items-center justify-between t-mono text-[9px] tracking-wider text-white/70">
        <span>{rarity.toUpperCase()}</span>
        <span>EN-{num}</span>
      </div>

      <div className="pointer-events-none absolute inset-0 [background:linear-gradient(115deg,transparent_40%,rgba(255,255,255,0.08)_50%,transparent_60%)]" />
    </div>
  );
}

export function TCGTile({ card, href, onClick, compact, className }: TCGTileProps) {
  const type = card.type ?? "normal";
  const [c1, c2] = TYPE_PALETTE[type] ?? TYPE_PALETTE.normal;

  const inner = (
    <div
      className={cn("tcg-tile bg-[rgba(8,12,28,0.6)] border border-[var(--glass-border)]", className)}
      onClick={onClick}
    >
      <div
        className="tcg-halo"
        style={{
          ["--halo" as string]: `radial-gradient(80% 60% at 50% 0%, ${c1}88, transparent 70%), radial-gradient(80% 80% at 100% 100%, ${c2}66, transparent 75%)`,
        }}
      />
      <CardArt
        name={card.name}
        type={type}
        num={card.num ?? "001"}
        rarity={card.rarity ?? "Holo"}
        imageUrl={card.imageUrl}
      />

      {!compact && card.price != null && (
        <div className="absolute inset-x-2 bottom-2 z-[3] flex items-end justify-between gap-1.5">
          <div className="min-w-0">
            <div className="t-mono text-[13.5px] font-bold text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.7)]">
              ${card.price.toLocaleString("es-AR")}
            </div>
            {card.condition && (
              <div className="t-xs text-white/75 [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]">
                {card.condition}
              </div>
            )}
          </div>
          {card.delta != null && (
            <span
              className={cn(
                "t-mono rounded-full border px-1.5 py-0.5 text-[10px] font-bold",
                card.delta >= 0
                  ? "border-[rgba(31,191,122,0.4)] bg-[rgba(31,191,122,0.22)] text-[#3FE6A0]"
                  : "border-[rgba(255,85,102,0.4)] bg-[rgba(255,85,102,0.22)] text-[#FF8090]"
              )}
            >
              {card.delta >= 0 ? "+" : ""}
              {card.delta}%
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return <a href={href}>{inner}</a>;
  }
  return inner;
}
