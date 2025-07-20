const sampleMemory = {
  userId: "user123",
  companionId: "rika",
  memories: [
    {
      id: "memory001",
      type: "person",
      label: "Paul's parents",
      summary: "They live in Florida in an apartment with noisy neighbors.",
      details: {
        location: "Florida",
        pets: ["cat named Mimi"],
        neighbors: "noisy"
      },
      keywords: ["parents", "Mimi", "Florida"],
      createdAt: "2025-07-19T12:00:00Z",
      lastReinforced: "2025-07-19T12:00:00Z",
      decayResistant: true
    },
    {
      id: "memory002",
      type: "fact",
      label: "Paul's preferences",
      summary: "Paul likes sushi, rainy days, and classical piano.",
      details: {
        food: "sushi",
        weather: "rainy days",
        music: "classical piano"
      },
      keywords: ["likes", "sushi", "piano", "weather"],
      createdAt: "...",
      lastReinforced: "...",
      decayResistant: false
    }
  ]
};

export default sampleMemory;
