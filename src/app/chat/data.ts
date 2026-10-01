export enum ChatRole {
  User = "user",
  Assistant = "assistant",
}

export type ChatMessage = { id: string; role: ChatRole; text: string };

export const SUGGESTIONS = [
  "What can this template do?",
  "Explain the command palette",
  "Give me a tip for mobile UI",
  "Tell me a joke",
];

const REPLIES = [
  {
    keywords: ["template", "do", "kit"],
    text: "It's a starter kit with the boring parts already solved: a sidebar that turns into a tab bar on phones, a command palette, a data table with filters and inline editing, charts, a block editor and a pile of small components you can poke at on the showcase page.\n\nEverything is meant to be copied out and bent to fit your app.",
  },
  {
    keywords: ["palette", "command", "ctrl", "search"],
    text: "Hit Ctrl+K (or Cmd+K) from anywhere. It jumps to pages, runs actions and finds any showcase component. Typing nonsense shows an empty state instead of random fuzzy matches, because that bothered me enough to fix it.",
  },
  {
    keywords: ["mobile", "phone", "touch", "tip"],
    text: "Make every tap show something. A spinner in the button, a pressed state, a haptic tick. On a phone there's no cursor to hint that something is happening, so if nothing moves people tap twice.",
  },
  {
    keywords: ["joke", "funny", "lol"],
    text: "I'd tell you a UDP joke, but you might not get it.",
  },
  {
    keywords: ["hello", "hi", "hey", "yo"],
    text: "Hey! Ask me anything, I'm fake but very confident.",
  },
];

const FALLBACK_REPLIES = [
  "Good question. I'm a canned reply streaming word by word, so I can't actually answer it, but notice how nicely this text arrives.",
  "Interesting. Try Shift+Enter for a new line, the stop button while I'm typing, or regenerate to get a different take.",
  "I don't know, but I'd say it with great confidence. Wire me to a real model and I'll know even less, just faster.",
];

export const SEED_MESSAGES: ChatMessage[] = [
  {
    id: "seed-1",
    role: ChatRole.User,
    text: "Is this a real chat?",
  },
  {
    id: "seed-2",
    role: ChatRole.Assistant,
    text: "Nope, everything here is fake and runs in your browser. Replies are canned and streamed in word by word, but the UI is the real deal: stop, regenerate, copy, stay pinned to the bottom, send with Enter.",
  },
];

export function pickReply(userText: string, attempt: number) {
  const lowerText = userText.toLowerCase();
  const matches = REPLIES.filter(({ keywords }) =>
    keywords.some((keyword) => lowerText.includes(keyword)),
  );
  const pool =
    matches.length > 0 ? matches.map(({ text }) => text) : FALLBACK_REPLIES;
  return pool[attempt % pool.length];
}
