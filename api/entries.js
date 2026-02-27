import { createClient } from '@supabase/supabase-js';
import { verifyAuthAndUser, MAX_ENTRY_LENGTH } from '../lib/verify-auth.js';

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
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ entries: data });
  }

  if (method === 'POST') {
    const { userId, entry } = req.body;
    if (!userId || !entry) return res.status(400).json({ error: 'userId and entry required' });

    const auth = await verifyAuthAndUser(req, userId);
    if (auth.error) return res.status(auth.status).json({ error: auth.error });

    if (entry.text && entry.text.length > MAX_ENTRY_LENGTH) {
      return res.status(400).json({ error: 'Entry text too long' });
    }

    const { error } = await supabase.from('journal_entries').insert({
      id: entry.id,
      user_id: userId,
      text: entry.text,
      date: entry.date,
      prompt: entry.prompt || null,
      phase: entry.phase || null,
      is_intention_reflection: entry.isIntentionReflection || false,
      type: entry.type || null
    });

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  }

  if (method === 'DELETE') {
    const { userId, entryId } = req.body;
    if (!userId || !entryId) return res.status(400).json({ error: 'userId and entryId required' });

    const auth = await verifyAuthAndUser(req, userId);
    if (auth.error) return res.status(auth.status).json({ error: auth.error });

    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', entryId)
      .eq('user_id', userId);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  }

  if (method === 'PUT') {
    const { userId, entryId, text } = req.body;
    if (!userId || !entryId || !text) return res.status(400).json({ error: 'userId, entryId, and text required' });

    const auth = await verifyAuthAndUser(req, userId);
    if (auth.error) return res.status(auth.status).json({ error: auth.error });

    if (text.length > MAX_ENTRY_LENGTH) {
      return res.status(400).json({ error: 'Entry text too long' });
    }

    const { error } = await supabase
      .from('journal_entries')
      .update({ text })
      .eq('id', entryId)
      .eq('user_id', userId);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
