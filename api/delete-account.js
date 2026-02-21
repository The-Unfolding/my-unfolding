import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    // Delete all user data from tables
    await supabase.from('journal_entries').delete().eq('user_id', userId);
    await supabase.from('intentions').delete().eq('user_id', userId);
    await supabase.from('user_settings').delete().eq('user_id', userId);
    await supabase.from('profiles').delete().eq('id', userId);

    // Delete the auth user
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) return res.status(500).json({ error: error.message });

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete account' });
  }
}
