import { BASE_PERSONA } from './base-persona';
import { VOICE_RULES } from './voice-rules';
import { TOOL_RULES } from './tool-rules';
import { TRIP_PLANNING_PROMPT } from './trip-planning';
import { buildCitySummary } from './city-context';
import { CityMode, SemanticProfile } from '../types';

export { BASE_PERSONA } from './base-persona';
export { VOICE_RULES } from './voice-rules';
export { TOOL_RULES } from './tool-rules';
export { buildCitySummary, getCachedCityPrompt } from './city-context';
export { RECAP_PROMPT } from './recap';
export { TRIP_PLANNING_PROMPT } from './trip-planning';

/** Static system prompt — no location / fuel / lat-lng. */
export const SYSTEM_INSTRUCTION = [
  BASE_PERSONA,
  VOICE_RULES,
  TOOL_RULES,
  TRIP_PLANNING_PROMPT,
].join('\n\n');

export interface SessionContextInput {
  city: CityMode | string | null;
  language?: string;
  tripType?: string;
  crewType?: string;
  isTravelingNow?: boolean;
  voiceName?: string;
  speechRate?: number;
  semanticHints?: Pick<SemanticProfile, 'travel_style' | 'food_preferences' | 'dislikes' | 'energy_level' | 'budget_sensitivity'>;
}

/**
 * Short session anchor sent once at connect — never lat/lng/fuel.
 */
export function buildSessionContext(input: SessionContextInput): string {
  const language = input.language || 'fa-IR';
  const tripType = input.tripType || input.semanticHints?.travel_style || 'unspecified';
  const crew = input.crewType || 'unspecified';
  const voice = input.voiceName || 'Kore';
  const rate = input.speechRate ?? 1;
  const traveling = input.isTravelingNow === undefined ? 'unknown' : String(input.isTravelingNow);

  const prefs: string[] = [];
  if (input.semanticHints?.food_preferences?.length) {
    prefs.push(`food: ${input.semanticHints.food_preferences.slice(0, 3).join(', ')}`);
  }
  if (input.semanticHints?.dislikes?.length) {
    prefs.push(`dislikes: ${input.semanticHints.dislikes.slice(0, 3).join(', ')}`);
  }
  if (input.semanticHints?.energy_level) prefs.push(`energy: ${input.semanticHints.energy_level}`);
  if (input.semanticHints?.budget_sensitivity) prefs.push(`budget: ${input.semanticHints.budget_sensitivity}`);

  return `
[Session Context]
City: ${input.city || 'unknown'}
City blurb: ${buildCitySummary(input.city)}
Language: ${language}
Trip type: ${tripType}
Crew: ${crew}
Traveling now: ${traveling}
Voice: ${voice} @ ${rate}x
${prefs.length ? `Soft prefs: ${prefs.join(' | ')}` : ''}
`.trim();
}

/** Approximate context volume for debugging (chars ≈ tokens/4). */
export function logContextVolume(label: string, text: string): void {
  const chars = text.length;
  const approxTokens = Math.ceil(chars / 4);
  console.debug(`[Context] ${label}: ~${chars} chars (~${approxTokens} tokens)`);
}
