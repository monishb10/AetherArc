/** Shared tuning for a longer, tactical three-fighter match. */
export const COMBAT_BALANCE = {
 healthMultiplier: 1.18,
 damageMultiplier: 0.76,
 passiveEnergy: 0.65,
 lightEnergy: 7,
 skillEnergy: 11,
 receivedEnergy: 4,
 strideDistance: 155,
 acceleration: 16,
 braking: 22,
} as const;

export function challenge(value: number) {
 const difficulty = Math.max(0.65, Math.min(1.6, Number.isFinite(value) ? value : 1));
 return {
  difficulty,
  reaction: difficulty < 0.9 ? 0.24 : difficulty < 1.2 ? 0.16 : 0.12,
  decision: difficulty < 0.9 ? 0.30 : difficulty < 1.2 ? 0.19 : 0.14,
  defense: difficulty < 0.9 ? 0.24 : difficulty < 1.2 ? 0.56 : 0.76,
  speed: difficulty < 0.9 ? 0.68 : difficulty < 1.2 ? 0.88 : 0.96,
  damage: difficulty < 0.9 ? 0.70 : difficulty < 1.2 ? 0.96 : 1.08,
 };
}
