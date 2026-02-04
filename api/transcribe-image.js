// /api/transcribe-image.js - Transcribe handwritten journal from image
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image, mediaType } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'Image required' });
  }

  // Normalize media type - Anthropic only accepts these 4 types
  const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  let normalizedMediaType = mediaType?.toLowerCase() || 'image/jpeg';
  
  // Map common unsupported types to supported ones
  if (normalizedMediaType === 'image/heic' || normalizedMediaType === 'image/heif') {
    normalizedMediaType = 'image/jpeg';
  } else if (!supportedTypes.includes(normalizedMediaType)) {
    // Default to jpeg for any unknown type
    normalizedMediaType = 'image/jpeg';
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
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: normalizedMediaType,
                data: image
              }
            },
            {
              type: "text",
              text: "Please transcribe this handwritten journal entry exactly as written. Preserve the person's voice, line breaks, and any crossed out words (mark those with strikethrough). If you can't read certain words, use [unclear] as a placeholder. Only output the transcribed text, nothing else."
            }
          ]
        }]
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error('Anthropic API error:', data.error);
      return res.status(500).json({ error: 'Transcription failed' });
    }

    const transcription = data.content?.[0]?.text || "";
    return res.status(200).json({ transcription });

  } catch (error) {
    console.error('Transcription error:', error);
    return res.status(500).json({ error: 'Transcription failed' });
  }
}
