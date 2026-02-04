// /api/feedback.js - Send feedback via Resend
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Feedback message required' });
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: "My Unfolding <feedback@theunfolding.co>",
        to: "tara@theunfolding.co",
        subject: "My Unfolding App Feedback",
        html: `
          <h2>New Feedback from My Unfolding</h2>
          <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
          <hr />
          <p style="white-space: pre-wrap;">${message}</p>
        `,
        text: `New Feedback from My Unfolding\n\nSubmitted: ${new Date().toLocaleString()}\n\n${message}`
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Resend API error:', data);
      return res.status(500).json({ error: 'Failed to send feedback' });
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Feedback error:', error);
    return res.status(500).json({ error: 'Failed to send feedback' });
  }
}
