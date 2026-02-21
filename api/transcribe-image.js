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
        messages: [
          {
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
                text: "Carefully transcribe the handwritten text in this image. Read each word exactly as written. Do not make up or invent any words — only write what you can actually see. If you cannot read a word, write [unclear]. This is a personal journal entry."
              }
            ]
          }
        ]
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
