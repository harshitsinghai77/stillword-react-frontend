export const LOW_CORTISOL_PROMPTS = [
  "What is occupying your thoughts right now? Write it without judgment.",
  "Describe the space you are sitting in, the temperature, and the sounds around you.",
  "What is one thing that went better than expected yesterday?",
  "What are three things your body is holding tension around right now?",
  "Write an honest letter about how you actually feel today, then let it stay on this page.",
  "What is a small, quiet moment from the past week that brought you peace?",
  "What is something you have been avoiding thinking about? Give it five quiet minutes.",
  "If today was entirely in your control, what would the next three hours look like?",
  "What did you wake up thinking about this morning?",
  "Write down every loose thought, errand, or anxiety until your head feels light.",
  "Who is someone you appreciate right now, and what did they do recently?",
  "What is a conversation you wish you could have had differently?",
  "Describe the weather outside and how it mirrors or contrasts with your internal state.",
  "What is one expectation you can release yourself from today?",
  "What is a small victory or habit you maintained this week?",
  "What does 'enough' look like for you today?",
  "Write about a book, song, or idea that recently resonated with you.",
  "If a dear friend came to you with your current problems, what gentle advice would you offer them?",
  "What is a memory from childhood that randomly popped into your mind recently?",
  "What are you looking forward to, however small?",
  "Describe the simplest comfort you enjoyed in the last 24 hours.",
  "What would you tell your yesterday self if you could send a one-sentence note?",
  "Write freely about the physical sensations of your breath and hands right now.",
  "What is a boundary you need to protect or communicate this week?",
  "If you didn't have to prove anything to anyone today, what would you do?",
];

export function getRandomPrompt() {
  return LOW_CORTISOL_PROMPTS[Math.floor(Math.random() * LOW_CORTISOL_PROMPTS.length)];
}
