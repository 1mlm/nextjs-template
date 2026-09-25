// lazily created on first play, browsers refuse to start audio before a user gesture anyway
const audio: { context?: AudioContext } = {};

function getAudioContext() {
  if (typeof window === "undefined") return null;
  audio.context ??= new AudioContext();
  if (audio.context.state === "suspended") audio.context.resume();
  return audio.context;
}

type Tone = { frequency: number; delay: number; duration: number };

export enum Chime {
  Success = "success",
  Error = "error",
}

const CHIMES: Record<Chime, Tone[]> = {
  [Chime.Success]: [
    { frequency: 660, delay: 0, duration: 0.12 },
    { frequency: 880, delay: 0.08, duration: 0.15 },
  ],
  [Chime.Error]: [{ frequency: 220, delay: 0, duration: 0.18 }],
};

function playTone(context: AudioContext, { frequency, delay, duration }: Tone) {
  const startTime = context.currentTime + delay;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.08, startTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

// tiny synthesized chime (no audio file to ship or license lol), rising two
// notes for success, one low buzz for error
export function playChime(type: Chime) {
  const context = getAudioContext();
  if (!context) return;
  for (const tone of CHIMES[type]) playTone(context, tone);
}
