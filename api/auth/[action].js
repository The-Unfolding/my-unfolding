import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { action } = req.query;

  if (action === 'signin') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) return res.status(400).json({ error: 'Invalid email or password' });
      const { data: profile, error: profileError } = await supabase
        .from('profiles').select('*').eq('id', authData.user.id).single();
      if (profileError) console.error('Profile fetch error:', profileError);
      if (profile && !profile.is_active) {
        return res.status(403).json({ error: 'access_ended', message: 'Your access has ended. Please subscribe to continue.' });
      }
      return res.status(200).json({
        success: true,
        user: { id: authData.user.id, email: authData.user.email },
        accessType: profile?.access_type || 'none',
        session: authData.session
      });
    } catch (error) {
      console.error('Signin error:', error);
      return res.status(500).json({ error: 'Failed to sign in' });
    }
  }

  if (action === 'signup') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { email, password, inviteCode } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    try {
      let validCode = null;
      if (inviteCode) {
        // Atomically claim the code — prevents race condition
        const { data: claimed, error: claimError } = await supabase
          .from('invite_codes')
          .update({ used_by: 'pending', used_at: new Date().toISOString() })
          .eq('code', inviteCode.toUpperCase())
          .eq('is_active', true)
          .is('used_by', null)
          .select()
          .single();
        if (claimError || !claimed) return res.status(400).json({ error: 'Invalid or already used invite code' });
        validCode = claimed;
      }
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email, password, email_confirm: true
      });
      if (authError) {
        // Release the invite code if account creation failed
        if (validCode) {
          await supabase.from('invite_codes').update({ used_by: null, used_at: null }).eq('id', validCode.id);
        }
        return res.status(400).json({ error: authError.message });
      }
      const userId = authData.user.id;
      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId, email, access_type: validCode ? 'coaching' : 'none', invite_code_used: validCode ? validCode.code : null
      });
      if (profileError) console.error('Profile creation error:', profileError);
      if (validCode) {
        await supabase.from('invite_codes').update({ used_by: userId, used_at: new Date().toISOString() }).eq('id', validCode.id);
      }
      // Sign the user in to get a session token
      const { data: signInData } = await supabase.auth.signInWithPassword({ email, password });
      return res.status(200).json({ 
        success: true, 
        user: { id: userId, email }, 
        accessType: validCode ? 'coaching' : 'none',
        session: signInData?.session || null
      });
    } catch (error) {
      console.error('Signup error:', error);
      return res.status(
