import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env';

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return client;
}

// Downloads the image (already public, e.g. Supabase Storage) and sends it
// inline as base64 — Gemini's uri input is documented only for files
// uploaded via client.files.upload(), not arbitrary public URLs.
export async function generateFromImage(imageUrl: string, prompt: string): Promise<string> {
  const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) });
  if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.status}`);
  const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
  const buffer = Buffer.from(await imgRes.arrayBuffer());
  const base64 = buffer.toString('base64');

  const interaction = await getClient().interactions.create({
    model: 'gemini-flash-latest',
    input: [
      { type: 'text', text: prompt },
      { type: 'image', data: base64, mime_type: mimeType },
    ],
  }, { timeout: 25000 });

  const text = interaction.output_text?.trim();
  if (!text) throw new Error('Gemini returned an empty response');
  // Safety net: strip markdown bold/italic markers in case the model ignores
  // the plain-text instruction — this text goes straight into a text field.
  return text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1');
}
