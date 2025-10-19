// Quick test for Gemini image enhancement prompt
// Usage examples:
//   node backend/scripts/test-enhance.js
//   node backend/scripts/test-enhance.js --name "ADFUSION" --desc "AI ad optimizer" --style creative --tagline "Smarter ads" --type product_mockup --ptype "SaaS/Software"

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { GoogleGenAI } = require('@google/genai');

function arg(name, def) {
  const idx = process.argv.findIndex((v) => v === `--${name}`);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return def;
}

async function main() {
  const product_name = arg('name', 'ADFUSION');
  const product_description = arg('desc', 'AI system that optimizes ad campaigns');
  const campaign_style = arg('style', 'creative');
  const selected_tagline = arg('tagline', 'Smarter ads, bigger impact');
  const image_type = arg('type', 'product_mockup');
  const product_type = arg('ptype', 'SaaS/Software');

  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    console.error('Missing GOOGLE_GEMINI_API_KEY in backend/.env');
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY });

  const enhancement_prompt = `You are optimizing a prompt for a text-to-image API.
Return a single, comma-separated prompt with short tokens only (no sentences), max 300 characters, no quotes, no line breaks.
Include: subject, key visual cues, composition, lighting, quality tokens, style tokens for ${campaign_style}, and the tagline as a short token.
Context: product=${product_name}; type=${product_type}; tagline=${selected_tagline}; brief=${product_description}; image_type=${image_type}.
Example output format: modern SaaS dashboard, KPI charts, world map heatpoints, soft diffused light, 4k, ultra-detailed, minimal, creative style, tagline: Smarter ads bigger impact ADFUSION`;

  try {
    console.log('Sending to Gemini (gemini-2.0-flash)...');
    const resp = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: enhancement_prompt,
      config: { maxOutputTokens: 120, temperature: 0.2 }
    });

    const raw = (resp.text || '').toString();
    const cleaned = raw
      .split('\n')[0]
      .trim()
      .replace(/[`"']/g, '')
      .replace(/^json\s*/i, '')
      .replace(/\s+/g, ' ')
      .replace(/\.\s*/g, ', ');
    const limited = cleaned.length > 300 ? cleaned.slice(0, 300) : cleaned;

    const fallbackCompact = [
      product_type || 'SaaS',
      image_type,
      product_name,
      'marketing image',
      campaign_style,
      'clean minimal',
      'soft diffused light',
      '4k, ultra-detailed',
      selected_tagline ? `tagline: ${selected_tagline}` : ''
    ].filter(Boolean).join(', ');

    console.log('--- Raw ---');
    console.log(raw);
    console.log('\n--- Cleaned (<=300) ---');
    console.log(limited);
    console.log(`\nLength: ${limited.length}`);
    console.log('\n--- Fallback Compact ---');
    console.log(fallbackCompact);
  } catch (e) {
    console.error('AI error:', e?.message || e);
    process.exit(1);
  }
}

main();


