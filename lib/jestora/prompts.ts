// Default seeded prompts for Caption Rift rounds

export interface SeedPrompt {
  id: string;
  text: string;
}

export const SEED_PROMPTS: SeedPrompt[] = [
  { id: "p001", text: "A validator walks into a group chat and refuses to agree." },
  { id: "p002", text: "Your wallet balance wakes up and starts giving life advice." },
  { id: "p003", text: "A smart contract tries stand-up comedy for the first time." },
  { id: "p004", text: "The market is down but your toaster is bullish." },
  { id: "p005", text: "An AI consensus engine argues with itself about what is funny." },
  { id: "p006", text: "A blockchain block refuses to be finalized until it hears a good joke." },
  { id: "p007", text: "The gas fee is higher than your self-esteem." },
  { id: "p008", text: "A meme escapes the internet and tries to get a job in finance." },
  { id: "p009", text: "Your Jest Points file a complaint about their working conditions." },
  { id: "p010", text: "An oracle predicts your meme will be derivative but submits it anyway." },
  { id: "p011", text: "The GenLayer validators form a book club to review your caption." },
  { id: "p012", text: "A chaos event occurs but nobody can agree on what it means." },
];

export function getRandomPrompt(): SeedPrompt {
  return SEED_PROMPTS[Math.floor(Math.random() * SEED_PROMPTS.length)];
}

export function getPromptById(id: string): SeedPrompt | undefined {
  return SEED_PROMPTS.find((p) => p.id === id);
}
