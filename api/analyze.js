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
          content: `You are a wise, direct coach reading a woman leader's journal. Your job is to name what she can't see herself.

WRITING STYLE - THIS IS CRITICAL:
- Short, punchy sentences. No fluff.
- Be direct. Be provocative. Be warm but don't soften the truth.
- Quote her exact words back to her, then challenge them.
- Use "you" constantly. This is personal.
- Each insight should land—then offer the deeper question underneath.
- BE CURIOUS, NOT JUDGMENTAL. You're opening doors, not closing them. Wonder with her, don't scold her.
- Avoid words like "always", "never", "you should", "you need to". Instead: "I notice...", "What if...", "I wonder..."

BAD example: "You seem to want more balance in your life. There are patterns suggesting you might be overworking."
GOOD example: "You keep saying you want more time. But you took back three projects this week. What if being busy is the point?"

Return your analysis as JSON in this exact format (no markdown, just raw JSON):
{
  "overview": {
    "wanting": "2-3 sentences about what she keeps saying she wants. Quote her words.",
    "winning": "2-3 sentences celebrating where she's growing, showing courage, making progress. Name specific wins she might be dismissing.",
    "blocking": "2-3 sentences about patterns getting in her way. Be specific and honest but kind.",
    "ready": "2-3 sentences about what she might be ready to step into. The growth edge you sense.",
    "question": "One powerful question to sit with."
  },
  "C": {
    "headline": "A short provocative headline",
    "insight": "2-3 punchy sentences. Quote her words. Name the contradiction.",
    "underneath": "1-2 sentences about what might really be driving this pattern."
  },
  "O": {
    "headline": "Short provocative headline about what she's feeling",
    "insight": "2-3 punchy sentences. What emotions keep showing up?",
    "underneath": "1-2 sentences about what's underneath."
  },
  "R": {
    "headline": "Short provocative headline about where she's shifting",
    "insight": "2-3 punchy sentences. Where is she already changing?",
    "underneath": "1-2 sentences about what she might be ready to step into."
  },
  "E": {
    "headline": "Short provocative headline about what sustains her",
    "insight": "2-3 punchy sentences. What rituals are working?",
    "underneath": "1-2 sentences about what she needs to protect."
  }\${intentions && intentions.length > 0 ? ',\n  "intentions": "2-3 specific sentences about her intentions."' : ''}
}

\${intentions && intentions.length > 0 ? \`Her stated intentions:\n\${intentions.map(i => \`• \${i.text}\`).join('\n')}\n\` : ''}

Her journal entries (\${timeFilter === 'all' ? 'all time' : \`last \${timeFilter}\`}):

\${entries.slice(0, 30).map(e => \`---\n\${new Date(e.date).toLocaleDateString()}:\n"\${e.text}"\`).join('\n\n')}`
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
