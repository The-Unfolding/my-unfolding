import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { accessToken, newPassword } = req.body;
  if (!accessToken || !newPassword) return res.status(400).json({ error: 'Token and new password required' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    accessToken,
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  );

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) return res.status(500).json({ error: error.message });

  return res.json({ success: true });
}
