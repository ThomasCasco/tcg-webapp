import type { CardCondition } from "@/lib/domain/types";

export const conditionLabelEs: Record<CardCondition, string> = {
  mint: "Mint (NM+)",
  near_mint: "Casi mint (NM)",
  lightly_played: "Ligeramente jugada (LP)",
  moderately_played: "Moderadamente jugada (MP)",
  heavily_played: "Muy jugada (HP)",
  damaged: "Dañada",
};

export function formatConditionEs(condition: CardCondition | string): string {
  if (condition in conditionLabelEs) {
    return conditionLabelEs[condition as CardCondition];
  }
  return String(condition);
}
