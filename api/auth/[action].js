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
        const { data: codeData, error: codeError } = await supabase
          .from('invite_codes').select('*').eq('code', inviteCode.toUpperCase()).eq('is_active', true).is('used_by', null).single();
        if (codeError || !codeData) return res.status(400).json({ error: 'Invalid or already used invite code' });
        validCode = codeData;
      }
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email, password, email_confirm: true
      });
      if (authError) return res.status(400).json({ error: authError.message });
      const userId = authData.user.id;
      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId, email, access_type: validCode ? 'coaching' : 'none', invite_code_used: validCode ? validCode.code : null
      });
      if (profileError) console.error('Profile creation error:', profileError);
      if (validCode) {
        await supabase.from('invite_codes').update({ used_by: userId, used_at: new Date().toISOString() }).eq('id', validCode.id);
      }
      return res.status(200).json({ success: true, user: { id: userId, email }, accessType: validCode ? 'coaching' : 'none' });
    } catch (error) {
      console.error('Signup error:', error);
      return res.status(500).json({ error: 'Failed to create account' });
    }
  }

  if (action === 'reset-password') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://my-unfolding.vercel.app';
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: siteUrl });
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  }

  if (action === 'update-password') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { accessToken, newPassword } = req.body;
    if (!accessToken || !newPassword) return res.status(400).json({ error: 'Token and new password required' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      accessToken,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );
    const { error } = await userClient.auth.updateUser({ password: newPassword });
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  }

  return res.status(404).json({ error: 'Unknown auth action' });
}
