// /api/transcribe-image.js - Transcribe handwritten journal from image
// Uses pure JS heic-decode for Vercel compatibility

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
    
    // Convert HEIC to JPEG server-side using pure JS libraries
    if (mediaType === 'image/heic' || mediaType === 'image/heif') {
      try {
        const heicDecode = (await import('heic-decode')).default;
        const { encode } = await import('jpeg-js');
        
        const inputBuffer = Buffer.from(image, 'base64');
        
        // Decode HEIC
        const { width, height, data } = await heicDecode({ buffer: inputBuffer });
        
        // Encode as JPEG
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
    
    // Validate media type
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
        max_tokens: 2000,
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
