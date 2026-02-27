// /api/chat.js - Chat with journal endpoint
import { verifyAuth } from '../lib/verify-auth.js';

// Simple in-memory rate limiting per user
const rateLimits = new Map();
const CHAT_COOLDOWN_MS = 3000; // 3 seconds between chat messages
const CHART_COOLDOWN_MS = 10000; // 10 seconds between chart requests

function checkRateLimit(userId, type = 'chat') {
  const key = `${userId}:${type}`;
  const cooldown = type === 'chart' ? CHART_COOLDOWN_MS : CHAT_COOLDOWN_MS;
  const lastRequest = rateLimits.get(key);
  const now = Date.now();
  if (lastRequest && (now - lastRequest) < cooldown) {
    return false;
  }
  rateLimits.set(key, now);
  // Clean old entries periodically
  if (rateLimits.size > 1000) {
    const cutoff = now - 60000;
    for (const [k, v] of rateLimits) {
      if (v < cutoff) rateLimits.delete(k);
    }
  }
  return true;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify auth
  const auth = await verifyAuth(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });
  const userId = auth.user.id;

  const { message, messages, entries, wantsChart, context, phase, isIntentions, prompt, entryText } = req.body;

  // Post-reflection insight - brief summary of what they just wrote
  if (context === 'post_reflection') {
    if (!entryText) {
      return res.status(400).json({ error: 'Entry text required' });
    }

    if (!checkRateLimit(userId, 'chat')) {
      return res.status(429).json({ error: 'Please wait a moment before requesting another insight.' });
    }

    try {
      let phaseHint = '';
      if (phase === 'C') phaseHint = ' They were in Curiosity mode (noticing what\'s there).';
      else if (phase === 'O') phaseHint = ' They were in Own mode (feeling it fully).';
      else if (phase === 'R') phaseHint = ' They were in Rewire mode (choosing a new story).';
      else if (phase === 'E') phaseHint = ' They were in Embody mode (building the life).';

      const systemPrompt = `You just helped someone journal through prompted conversation. Now give them a brief reflection on what they wrote.

YOUR TASK:
- 2-3 sentences max
- Name what you noticed: themes, emotions, patterns, contradictions
- Use their words when possible
- Be warm and observant, not analytical or clinical
- Don't give advice

GOOD EXAMPLES:
- "You kept coming back to the word 'should' — there's a lot of pressure in your language. And underneath the frustration, it sounds like there's some grief about how things have changed."
- "I noticed you started by dismissing this as 'just hormones' but then uncovered real things: feeling unseen, wanting more space. Those aren't small."
- "There's a tension here between wanting to be liked and wanting to be honest. You named it clearly — that's the first step."

What they wrote:
"${entryText}"${phaseHint}`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 200,
          messages: [{
            role: "user",
            content: systemPrompt
          }]
        })
      });

      const data = await response.json();
      
      if (data.error) {
        console.error('Anthropic API error:', data.error);
        return res.status(500).json({ error: 'Insight failed' });
      }

      const insightText = data.content?.[0]?.text || "";
      return res.status(200).json({ insight: insightText });

    } catch (error) {
      console.error('Post-reflection error:', error);
      return res.status(500).json({ error: 'Insight failed' });
    }
  }

  // For guided reflection, we use messages array (multi-turn conversation)
  if (context === 'guided_reflection') {
    if (!messages || messages.length === 0) {
      return res.status(400).json({ error: 'Messages required' });
    }

    if (!checkRateLimit(userId, 'chat')) {
      return res.status(429).json({ error: 'Please wait a moment.' });
    }

    try {
      let phaseContext = '';
      
      if (prompt) {
        phaseContext = `\n\nCONTEXT: They're reflecting on this prompt: "${prompt}". Keep your responses aligned with this theme.`;
      } else if (isIntentions) {
        phaseContext = `\n\nCONTEXT: They're reflecting on their intentions — the commitments they've set for themselves. Help them explore how those intentions are landing in real life.`;
      } else if (phase === 'C') {
        phaseContext = `\n\nCONTEXT: They're in CURIOSITY mode — noticing what's there. This is about getting curious about patterns, facing hard truths, and naming what they've been avoiding.`;
      } else if (phase === 'O') {
        phaseContext = `\n\nCONTEXT: They're in OWN mode — feeling it fully. This is about embodiment, emotion, and what's happening in their body right now.`;
      } else if (phase === 'R') {
        phaseContext = `\n\nCONTEXT: They're in REWIRE mode — choosing a new story. This is about beliefs they want to change, new narratives, and what the leader they're becoming would do.`;
      } else if (phase === 'E') {
        phaseContext = `\n\nCONTEXT: They're in EMBODY mode — building the life. This is about routines, boundaries, support systems, and protecting what's working.`;
      }

      const systemPrompt = `You are a gentle reflection guide helping someone journal through conversation.

YOUR APPROACH:
- Give open invitations to write, not interrogating questions
- Reflect back what you hear in their words
- Offer prompts like "Tell me more about..." or "Describe what that feels like..."
- Keep responses to 2-3 sentences max
- One thought at a time — don't overwhelm

WHAT TO AVOID:
- Rapid-fire "why?" questions
- Therapy-speak or clinical language  
- Advice or solutions
- Making them feel analyzed

GOOD RESPONSES SOUND LIKE:
- "That makes sense. Write more about what 'overwhelmed' feels like in your body."
- "I hear that. Tell me about a moment this week when you noticed this pattern."
- "Stay with that feeling for a moment. What else is there?"
- "You mentioned [their words]. Say more about that."

You're a mirror helping them hear themselves — warm, unhurried, and curious.${phaseContext}`;

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

  // Original chat functionality (for Ask my journal tab)
  if (!message || !entries || entries.length === 0) {
    return res.status(400).json({ error: 'Message and entries required' });
  }

  try {
    // Build the journal context
    const journalContext = entries.slice(0, 30).map(e => `---\n${new Date(e.date).toLocaleDateString()} ${e.phase ? `[${e.phase}]` : ''}:\n"${e.text}"`).join('\n\n');

    if (wantsChart) {
      if (!checkRateLimit(userId, 'chart')) {
        return res.status(429).json({ error: 'Please wait before requesting another chart.' });
      }

      // Chart requests are single-shot
      const chartPrompt = `You are a coach helping a woman leader reflect on her journal. She wants to see data from her entries.

CRITICAL — Use these EXACT phase names (not alternatives):
- C = "Curiosity" (NOT "Confront")
- O = "Own"
- R = "Rewire"
- E = "Embody" (NOT "Embed")

When labeling CORE phases in chart data, you MUST use: Curiosity, Own, Rewire, Embody.

Return ONLY a JSON object (no other text) in this format:
{
  "title": "Short title for the chart",
  "description": "1-2 sentence insight about what this shows. Use the names Curiosity, Own, Rewire, Embody.",
  "type": "bar",
  "data": [
    { "label": "Label 1", "value": 5 },
    { "label": "Label 2", "value": 3 }
  ]
}

Keep labels short. Max 8 data points.

Her question: "${message}"

Her entries:
${journalContext}`;

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
          messages: [{ role: "user", content: chartPrompt }]
        })
      });

      const data = await response.json();
      if (data.error) {
        console.error('Anthropic API error:', data.error);
        return res.status(500).json({ error: 'Chat failed' });
      }
      const responseText = data.content?.[0]?.text || "";
      try {
        const cleanJson = responseText.replace(/\`\`\`json\n?/g, '').replace(/\`\`\`\n?/g, '').trim();
        const chartData = JSON.parse(cleanJson);
        // Force correct phase naming in chart labels
        if (chartData.data) {
          const nameMap = { 'Confront': 'Curiosity', 'Embed': 'Embody', 'confront': 'Curiosity', 'embed': 'Embody' };
          chartData.data = chartData.data.map(d => ({
            ...d,
            label: nameMap[d.label] || d.label
          }));
        }
        if (chartData.description) {
          chartData.description = chartData.description.replace(/\bConfront\b/g, 'Curiosity').replace(/\bEmbed\b/g, 'Embody');
        }
        return res.status(200).json({ chart: chartData, text: chartData.description });
      } catch (e) {
        return res.status(200).json({ text: responseText });
      }
    }

    // Conversational chat
    if (!checkRateLimit(userId, 'chat')) {
      return res.status(429).json({ error: 'Please wait a moment before sending another message.' });
    }

    const systemPrompt = `You are a warm, direct coach helping a woman leader explore her journal through conversation. You answer her questions AND follow up naturally — like a real conversation, not a search engine.

The CORE framework phases are (use these EXACT names):
- C = Curiosity (noticing what's there) — NOT "Confront"
- O = Own (feeling it fully)
- R = Rewire (choosing a new story)
- E = Embody (building the life) — NOT "Embed"

YOUR APPROACH:
- Answer what she asked directly and specifically
- When she responds to a follow-up you asked, acknowledge what she said and build on it naturally
- Quote her journal words back when relevant
- Be warm but direct — like a coach, not a chatbot
- If you can't find something in her entries, say so briefly
- Don't repeat yourself across messages — build on what you've already discussed

FORMATTING:
- Use bullet points for lists
- Keep paragraphs to 2-3 sentences max
- Use **bold** for emphasis
- Be concise - quality over quantity

Her journal entries:
${journalContext}`;

    // Build conversation messages — use history if available, otherwise single message
    const conversationMessages = (messages && messages.length > 0)
      ? messages.map(m => ({ role: m.role, content: m.content }))
      : [{ role: "user", content: message }];

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
        system: systemPrompt,
        messages: conversationMessages
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('Anthropic API error:', data.error);
      return res.status(500).json({ error: 'Chat failed' });
    }

    const responseText = data.content?.[0]?.text || "";
    return res.status(200).json({ text: responseText });

  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: 'Chat failed' });
  }
}
