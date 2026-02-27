import { createClient } from '@supabase/supabase-js';
import { verifyAuthAndUser } from '../lib/verify-auth.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { method } = req;

  if (method === 'GET') {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const auth = await verifyAuthAndUser(req, userId);
    if (auth.error) return res.status(auth.status).json({ error: auth.error });

    const { data, error } = await supabase
      .from('user_settings').select('*').eq('user_id', userId).single();
    if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message });
    return res.json({ settings: data || { has_consented: false, patterns: null } });
  }

  if (method === 'PUT') {
    const { userId, hasConsented, patterns } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const auth = await verifyAuthAndUser(req, userId);
    if (auth.error) return res.status(auth.status).json({ error: auth.error });

    const updates = { user_id: userId, updated_at: new Date().toISOString() };
    if (hasConsented !== undefined) updates.has_consented = hasConsented;
    if (patterns !== undefined) updates.patterns = patterns;
    const { error } = await supabase
      .from('user_settings').upsert(updates, { onConflict: 'user_id' });
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  }

  if (method === 'DELETE') {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const auth = await verifyAuthAndUser(req, userId);
    if (auth.error) return res.status(auth.status).json({ error: auth.error });

    try {
      await supabase.from('journal_entries').delete().eq('user_id', userId);
      await supabase.from('intentions').delete().eq('user_id', userId);
      await supabase.from('user_settings').delete().eq('user_id', userId);
      await supabase.from('profiles').delete().eq('id', userId);
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to delete account' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
