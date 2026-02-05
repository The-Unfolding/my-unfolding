// /api/analyze.js - Pattern analysis endpoint
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { entries, intentions, timeFilter } = req.body;

  if (!entries || entries.length < 3) {
    return res.status(400).json({ error: 'Need at least 3 entries' });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [{
          role: "user",
          content: `You are a pattern analyst reviewing journal entries. Your role is to be a mirror - reflecting back what's actually there.

GROUNDING RULES:
- Every insight MUST be supported by direct quotes from the entries
- Identify words, phrases, or themes that appear MULTIPLE times across entries
- Notice contradictions between what they say they want vs. what they describe doing
- Count frequency: "You mentioned X three times" or "In 4 of 7 entries, you wrote about..."
- If a pattern isn't clearly supported by the data, don't include it

FRAMEWORK - Draw from evidence-based perspectives:
- Cognitive patterns (recurring thought loops, cognitive distortions, reframes they're attempting)
- Emotional patterns (emotions named repeatedly, emotional avoidance, emotional growth)
- Behavioral patterns (habits mentioned, actions taken vs. avoided, consistency gaps)
- Values alignment (stated values vs. described choices)
- Growth indicators (shifts in language over time, new awareness, breakthroughs noted)

TONE:
- Warm but grounded - like a skilled therapist reflecting back
- Use "you" - this is personal
- Quote their exact words, then offer the pattern you see
- Be curious, not prescriptive
- Celebrate genuine progress they documented

Return your analysis as JSON in this exact format (no markdown, just raw JSON):
{
  "overview": {
    "wanting": "What they repeatedly said they want. Quote specific phrases that appeared multiple times.",
    "winning": "Concrete progress or wins they documented. Quote the specific accomplishments they wrote about.",
    "blocking": "Patterns that appear to create friction - based on contradictions or repeated struggles in the entries.",
    "ready": "Shifts or edges visible in their writing - where their language is changing or they're questioning old patterns.",
    "question": "One question that emerges from a genuine tension or contradiction in their entries."
  },
  "C": {
    "headline": "A headline capturing what they're confronting (based on repeated themes)",
    "insight": "The pattern you see, with direct quotes. Note frequency: 'You wrote about X in Y entries.'",
    "underneath": "A reflection grounded in psychology - what this pattern often indicates, framed as possibility not certainty."
  },
  "O": {
    "headline": "The emotional pattern visible in their words",
    "insight": "Emotions they named repeatedly. Quote the feeling words they actually used and note frequency.",
    "underneath": "What this emotional pattern might be signaling, from a somatic or emotional intelligence lens."
  },
  "R": {
    "headline": "Where their thinking or behavior is shifting",
    "insight": "Evidence of change - quote earlier vs. later entries if there's evolution. Note new language appearing.",
    "underneath": "The growth edge this represents, framed through a developmental or change psychology lens."
  },
  "E": {
    "headline": "What grounds or sustains them (from their words)",
    "insight": "Practices, people, or rituals they mentioned. Quote specifically what they said works.",
    "underneath": "Why these matter - through a resilience or positive psychology lens."
  }${intentions && intentions.length > 0 ? ',\n  "intentions": "How their entries connect to their stated intentions. Quote entries that relate to each intention."' : ''}
}

${intentions && intentions.length > 0 ? `Their stated intentions:\n${intentions.map(i => `• ${i.text}`).join('\n')}\n` : ''}

Their journal entries (${timeFilter === 'all' ? 'all time' : `last ${timeFilter}`}):

${entries.slice(0, 30).map(e => `---\n${new Date(e.date).toLocaleDateString()}:\n"${e.text}"`).join('\n\n')}`
        }]
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('Anthropic API error:', data.error);
      return res.status(500).json({ error: 'Analysis failed' });
    }

    const responseText = data.content?.[0]?.text || "";
    
    let parsedPatterns;
    try {
      const cleanJson = responseText.replace(/\`\`\`json\n?/g, '').replace(/\`\`\`\n?/g, '').trim();
      parsedPatterns = JSON.parse(cleanJson);
    } catch (e) {
      parsedPatterns = null;
    }

    return res.status(200).json({
      data: parsedPatterns,
      text: responseText,
      generatedAt: new Date().toISOString(),
      entryCount: entries.length,
      timeFilter
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({ error: 'Analysis failed' });
  }
}
