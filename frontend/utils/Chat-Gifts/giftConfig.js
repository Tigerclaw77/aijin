export const GIFT_CONFIG = {
  tea:           { name: "Tea",           price: 100, duration_minutes: 60,  effect: { messages: 10 } },
  coffee:        { name: "Coffee",        price: 200, duration_minutes: 90,  effect: { messages: 25 } },
  boba:          { name: "Boba",          price: 300, duration_minutes: 720, effect: { unlimited_12h: true } },
  energy_drink:  { name: "Energy Drink",  price: 400, duration_minutes: 1440, effect: { unlimited_24h: true } },
};

// small helper so we never mismatch
export function getGiftByKey(key) {
  const k = String(key || "").toLowerCase().trim();
  return GIFT_CONFIG[k] ?? null;
}
export function getGiftByName(name) {
  const n = String(name || "").toLowerCase().trim();
  return Object.values(GIFT_CONFIG).find(g => g.name.toLowerCase() === n) ?? null;
}
