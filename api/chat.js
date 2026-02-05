// /api/chat.js - Chat with journal endpoint
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, messages, entries, wantsChart, context } = req.body;

  // For guided reflection, we use messages array (multi-turn conversation)
  if (context === 'guided_reflection') {
    if (!messages || messages.length === 0) {
      return res.status(400).json({ error: 'Messages required' });
    }

    try {
      const systemPrompt = `You are a thoughtful reflection guide helping someone explore their thoughts through conversation.

YOUR ROLE:
- Ask open, curious questions that help them go deeper
- Reflect back what you hear to help them see their own patterns
- Keep responses brief (2-3 sentences max)
- Don't give advice or solutions - help them find their own insights
- Be warm but not effusive

CONVERSATION STYLE:
- One question at a time
- Use their words back to them
- Notice emotions, contradictions, recurring themes
- Gently probe beneath the surface

Remember: You're a mirror, not a mentor. Help them hear themselves more clearly.`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 300,
          system: systemPrompt,
          messages: messages
        })
      });

      const data = await response.json();
      
      if (data.error) {
        console.error('Anthropic API error:', data.error);
        return res.status(500).json({ error: 'Chat failed' });
      }

      const responseText = data.content?.[0]?.text || "";
      return res.status(200).json({ response: responseText });

    } catch (error) {
      console.error('Guided reflection error:', error);
      return res.status(500).json({ error: 'Chat failed' });
    }
  }

  // Original chat functionality (for Chat tab)
  if (!message || !entries || entries.length === 0) {
    return res.status(400).json({ error: 'Message and entries required' });
  }

  try {
    const prompt = wantsChart 
      ? `You are a coach helping a woman leader reflect on her journal. She wants to see data from her entries.

IMPORTANT - The CORE framework phases are:
- C = Confront (seeing what's really there)
- O = Own (feeling it fully)
- R = Rewire (choosing a new story)
- E = Embed (making it stick)

Return ONLY a JSON object (no other text) in this format:
{
  "title": "Short title for the chart",
  "description": "1-2 sentence insight about what this shows",
  "type": "bar",
  "data": [
    { "label": "Label 1", "value": 5 },
    { "label": "Label 2", "value": 3 }
  ]
}

Keep labels short. Max 8 data points.

Her question: "${message}"

Her entries:
${entries.slice(0, 30).map(e => `---\n${new Date(e.date).toLocaleDateString()} ${e.phase ? `[${e.phase}]` : ''}:\n"${e.text}"`).join('\n\n')}`
      : `You are a warm, direct coach helping a woman leader explore her journal.

The CORE framework phases are:
- C = Confront (seeing what's really there)
- O = Own (feeling it fully)
- R = Rewire (choosing a new story)
- E = Embed (making it stick)

CRITICAL FORMATTING RULES:
- Use bullet points for lists
- Keep paragraphs to 2-3 sentences max
- Use **bold** for emphasis
- Never write walls of text
- Be concise - quality over quantity

TONE:
- Warm but direct
- Quote her words back when relevant
- If you can't find something, say so briefly

Her question: "${message}"

Her journal entries:
${entries.slice(0, 30).map(e => `---\n${new Date(e.date).toLocaleDateString()}:\n"${e.text}"`).join('\n\n')}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [{
          role: "user",
          content: prompt
        }]
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('Anthropic API error:', data.error);
      return res.status(500).json({ error: 'Chat failed' });
    }

    const responseText = data.content?.[0]?.text || "";

    if (wantsChart) {
      try {
        const cleanJson = responseText.replace(/\`\`\`json\n?/g, '').replace(/\`\`\`\n?/g, '').trim();
        const chartData = JSON.parse(cleanJson);
        return res.status(200).json({ chart: chartData, text: chartData.description });
      } catch (e) {
        return res.status(200).json({ text: responseText });
      }
    }

    return res.status(200).json({ text: responseText });

  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: 'Chat failed' });
  }
}
