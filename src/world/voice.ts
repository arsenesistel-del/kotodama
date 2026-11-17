// Voix des personnages : un fichier par réplique, généré à l'avance (voir scripts/voice-lines.mjs et
// src/assets/voice/index.json). Lecture normale ou lente, réécoute, et volume propre aux voix dans 設定.
import { settings } from './prefs';
import { voiceFile } from './voicefile';

const files = import.meta.glob('../assets/voice/*.{ogg,mp3,wav}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const URLS: Record<string, string> = {};
for (const [path, url] of Object.entries(files)) URLS[path.replace(/^.*\//, '').replace(/\.\w+$/, '')] = url;

/** Vitesse de la lecture lente (DESIGN : réécoute lente jusqu'au chapitre 4). */
export const SLOW = 0.72;

export const hasVoice = (lineId: string): boolean => !!URLS[voiceFile(lineId)];

let audio: HTMLAudioElement | null = null;
let current = '';
let onDone: (() => void) | null = null;

/** Joue la voix d'une réplique. `done` est appelé à la fin (ou tout de suite s'il n'y a pas de voix). */
export function play(lineId: string, slow = false, done?: () => void): boolean {
  stop();
  const url = URLS[voiceFile(lineId)];
  if (!url || settings.voice <= 0) {
    done?.();
    return false;
  }
  const a = (audio = new Audio(url));
  current = lineId;
  a.volume = Math.min(1, settings.volume * settings.voice);
  a.playbackRate = slow ? SLOW : 1;
  a.preservesPitch = true;
  onDone = done ?? null;
  const end = () => {
    if (audio !== a) return;
    audio = null;
    current = '';
    const cb = onDone;
    onDone = null;
    cb?.();
  };
  a.addEventListener('ended', end);
  a.addEventListener('error', end);
  a.play().catch(end); // lecture refusée (aucun clic encore) : on continue sans voix
  return true;
}

/** Coupe la voix en cours, sans appeler sa fin. */
export function stop(): void {
  if (!audio) return;
  audio.pause();
  audio = null;
  current = '';
  onDone = null;
}

export const playing = (): string => (audio && !audio.paused ? current : '');
