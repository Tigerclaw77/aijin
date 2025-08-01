// ✅ Correct .d.ts format for JS support:
interface MemoryBlock {
  id: string;
  type: string;
  label: string;
  summary: string;
  details: {
    location?: string;
    pets?: string[];
    neighbors?: string;
    food?: string;
    weather?: string;
    music?: string;
  };
  keywords: string[];
  createdAt: string;
  lastReinforced: string;
  decayResistant: boolean;
}

interface MemoryRecord {
  user_id: string;
  companion_id: string;
  memories: MemoryBlock[];
}
