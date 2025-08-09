// /**
//  * Decay function: gifts lose power over time (half-life = 1 day)
//  * @param {number} hoursElapsed
//  * @param {number} baseXP
//  * @returns {number}
//  */
// function decayGiftXP(hoursElapsed, baseXP) {
//   const decayFactor = 0.5 ** (hoursElapsed / 24);
//   return baseXP * decayFactor;
// }

// /**
//  * Calculates total XP from valid gifts of a given type
//  * @param {Array} giftList - Array of gift objects
//  * @param {'verbal'|'physical'} type - Gift type to filter by
//  * @param {Date} [now=new Date()]
//  * @returns {number} Total XP from decayed gifts
//  */
// export function calculateGiftXP(giftList = [], type = "verbal", now = new Date()) {
//   if (!Array.isArray(giftList)) return 0;

//   return giftList.reduce((total, gift) => {
//     if (!gift || gift.type !== type || !gift.timestamp || typeof gift.value !== "number") {
//       return total;
//     }

//     const giftTime = new Date(gift.timestamp);
//     const hoursElapsed = (now - giftTime) / (1000 * 60 * 60);
//     const effectiveXP = decayGiftXP(hoursElapsed, gift.value);

//     return total + effectiveXP;
//   }, 0);
// }
