import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://my-unfolding.vercel.app';

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: siteUrl
  });

  if (error) return res.status(500).json({ error: error.message });

  return res.json({ success: true });
}
