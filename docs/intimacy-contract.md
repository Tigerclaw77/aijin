1. Core Definitions
Type:
verbal_intimacy and physical_intimacy
→ Affect only growth and decay via curves. They do not gate content directly.

XP:
Stored as verbal_xp and physical_xp (float).
Curves convert XP → level (float; can be fractional).

Level:
Float representation of intimacy progression.

Used for caps and rank derivation.

Can temporarily exceed caps when gifts are active.

Rank:
Integer representation for prompts, permissions, and gift shop.

pgsql
Copy
Edit
rank = min(5, floor(level))
Rank always capped at 5 (steady long-term partner).

Gifts can push level above cap, but rank display stays max 5.

2. Caps
Sub-tier Cap Mapping
scss
Copy
Edit
free        → 1  (<2)
friend      → 2  (<3)
crush       → 3  (<4)
girlfriend  → 4  (<5)
waifu       → 5  (<6)
Rules
Sub_tier cap: (capInt + 1 - EPS) is the effective ceiling.

Nun-lock:
If a stat was set to 1 at creation and has not been unlocked, that stat is held < 2 (2 - EPS) regardless of sub_tier.

Gifts:
Temporarily remove caps for the affected stat.

Absolute ceiling:
Rank never exceeds 5.

3. Growth & Decay
Determined entirely by the type (verbal or physical) curve.

Curves apply multipliers based on user activity (messages/day, etc.).

Decay pauses if the companion is “paused”/”carbonited.”

4. Permissions
Photo Permissions by Rank
Rank	Photos Allowed
1	Basic (fully clothed, casual)
3	Bikini/Swimwear
4	Topless (girlfriend tier)
5	Full Nude (waifu tier)

Chat Permissions by Rank
Rank	Chat Content
2	Flirty
3	Romantic
4	Spicy
5	Explicit

Gift Shop Availability by Rank
Rank	Gift Unlocks
2	Premium Drinks
3	Wardrobe
4	Lingerie
5	Private Set

5. Future Tiers
Elite and Harem will be added later.

They do not change intimacy caps (still max rank 5).

Differences:

Elite: higher model quality/customization, special cases (friends/twins).

Harem: multiple companions; may start at rank 5.

6. Implementation Notes
Gifts: When active, skip cap check (cap = null) so level can increase without bound; rank still capped at 5.

Nun-lock: Checked per stat; only active if created at 1 and not unlocked.

Permissions: All prompt/content gating should use rank (not level or XP).