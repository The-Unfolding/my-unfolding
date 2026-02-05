import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, inviteCode } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    let validCode = null;
    if (inviteCode) {
      const { data: codeData, error: codeError } = await supabase
        .from('invite_codes')
        .select('*')
        .eq('code', inviteCode.toUpperCase())
        .eq('is_active', true)
        .is('used_by', null)
        .single();

      if (codeError || !codeData) {
        return res.status(400).json({ error: 'Invalid or already used invite code' });
      }
      validCode = codeData;
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    const userId = authData.user.id;

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email,
        access_type: validCode ? 'coaching' : 'none',
        invite_code_used: validCode ? validCode.code : null
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
    }

    if (validCode) {
      await supabase
        .from('invite_codes')
        .update({ 
          used_by: userId, 
          used_at: new Date().toISOString() 
        })
        .eq('id', validCode.id);
    }

    return res.status(200).json({ 
      success: true, 
      user: { id: userId, email },
      accessType: validCode ? 'coaching' : 'none'
    });

  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Failed to create account' });
  }
}
