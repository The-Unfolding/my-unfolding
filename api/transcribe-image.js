// /api/transcribe-image.js - Transcribe handwritten journal from image
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { image, mediaType } = req.body;
  if (!image) {
    return res.status(400).json({ error: 'Image required' });
  }
  try {
    let processedImage = image;
    let processedMediaType = mediaType;
    
    if (mediaType === 'image/heic' || mediaType === 'image/heif') {
      try {
        const heicDecode = (await import('heic-decode')).default;
        const { encode } = await import('jpeg-js');
        const inputBuffer = Buffer.from(image, 'base64');
        const { width, height, data } = await heicDecode({ buffer: inputBuffer });
        const jpegData = encode({ width, height, data }, 90);
        processedImage = jpegData.data.toString('base64');
        processedMediaType = 'image/jpeg';
      } catch (heicError) {
        console.error('HEIC conversion error:', heicError);
        return res.status(400).json({ 
          error: 'Could not process this iPhone photo. Try taking a screenshot of the image instead.' 
        });
      }
    }
    
    const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!supportedTypes.includes(processedMediaType)) {
      processedMediaType = 'image/jpeg';
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 3000,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: processedMediaType,
                data: processedImage
              }
            },
            {
              type: "text",
              text: `This is a photo of a handwritten journal entry. Transcribe it into clean, readable text.

This is a personal journal — the content will be about feelings, experiences, relationships, self-reflection, goals, or daily life. Use that context to interpret unclear words.

Common cursive misreads to watch for:
- The pronoun "I" often looks like "cl", "el", "d", or "J" in cursive — if a standalone letter or pair before a verb (am, feel, want, need, have, don't, was, will, can, think, know) doesn't make sense, it's probably "I"
- "th" can look like "tu" or "tl"
- "m" and "w" look similar
- "n" and "u" look similar
- "a" and "o" look similar
- "e" and "i" look similar
- Double letters may look like single letters or vice versa

Instructions:
1. Read the full page first to understand the topic
2. Re-read line by line and transcribe each word
3. Always choose the word that makes grammatical and contextual sense
4. Add proper punctuation and capitalization for readability
5. Preserve paragraph breaks
6. Mark genuinely unclear words with [?]
7. Output ONLY the transcribed text`
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
