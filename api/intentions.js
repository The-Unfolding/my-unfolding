import { createClient } from '@supabase/supabase-js';
import { verifyAuthAndUser, MAX_INTENTION_LENGTH } from '../lib/verify-auth.js';

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
      .from('intentions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    const active = data?.filter(i => !i.is_completed) || [];
    const completed = data?.filter(i => i.is_completed) || [];
    return res.json({ intentions: active, completedIntentions: completed });
  }

  if (method === 'POST') {
    const { userId, intention } = req.body;
    if (!userId || !intention) return res.status(400).json({ error: 'userId and intention required' });

    const auth = await verifyAuthAndUser(req, userId);
    if (auth.error) return res.status(auth.status).json({ error: auth.error });

    if (intention.text && intention.text.length > MAX_INTENTION_LENGTH) {
      return res.status(400).json({ error: 'Intention text too long' });
    }

    const { error } = await supabase.from('intentions').insert({
      id: intention.id,
      user_id: userId,
      text: intention.text,
      timeframe: intention.timeframe || 'week',
      created_at: intention.createdAt || new Date().toISOString(),
      is_completed: false
    });

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  }

  if (method === 'PUT') {
    const { userId, intentionId, is_completed, completed_at } = req.body;
    if (!userId || !intentionId) return res.status(400).json({ error: 'userId and intentionId required' });

    const auth = await verifyAuthAndUser(req, userId);
    if (auth.error) return res.status(auth.status).json({ error: auth.error });

    const { error } = await supabase
      .from('intentions')
      .update({ is_completed, completed_at })
      .eq('id', intentionId)
      .eq('user_id', userId);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  }

  if (method === 'DELETE') {
    const { userId, intentionId } = req.body;
    if (!userId || !intentionId) return res.status(400).json({ error: 'userId and intentionId required' });

    const auth = await verifyAuthAndUser(req, userId);
    if (auth.error) return res.status(auth.status).json({ error: auth.error });

    const { error } = await supabase
      .from('intentions')
      .delete()
      .eq('id', intentionId)
      .eq('user_id', userId);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
