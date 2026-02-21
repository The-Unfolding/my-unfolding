import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { method } = req;

  if (method === 'GET') {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const { data, error } = await supabase
      .from('intentions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    const active = data.filter(i => !i.is_completed).map(i => ({
      id: i.id, text: i.text, timeframe: i.timeframe, createdAt: i.created_at
    }));
    const completed = data.filter(i => i.is_completed).map(i => ({
      id: i.id, text: i.text, timeframe: i.timeframe, createdAt: i.created_at, completedAt: i.completed_at
    }));

    return res.json({ intentions: active, completedIntentions: completed });
  }

  if (method === 'POST') {
    const { userId, intention } = req.body;
    if (!userId || !intention) return res.status(400).json({ error: 'userId and intention required' });

    const { error } = await supabase.from('intentions').insert({
      id: intention.id,
      user_id: userId,
      text: intention.text,
      timeframe: intention.timeframe,
      created_at: intention.createdAt
    });

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  }

  if (method === 'PUT') {
    const { userId, intentionId, is_completed, completed_at } = req.body;
    if (!userId || !intentionId) return res.status(400).json({ error: 'userId and intentionId required' });

    const updates = { is_completed };
    if (completed_at) updates.completed_at = completed_at;
    else updates.completed_at = null;

    const { error } = await supabase
      .from('intentions')
      .update(updates)
      .eq('id', intentionId)
      .eq('user_id', userId);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  }

  if (method === 'DELETE') {
    const { userId, intentionId } = req.body;
    if (!userId || !intentionId) return res.status(400).json({ error: 'userId and intentionId required' });

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
