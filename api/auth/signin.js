import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
    }

    if (profile && !profile.is_active) {
      return res.status(403).json({ 
        error: 'access_ended',
        message: 'Your access has ended. Please subscribe to continue.'
      });
    }

    return res.status(200).json({ 
      success: true, 
      user: { 
        id: authData.user.id, 
        email: authData.user.email 
      },
      accessType: profile?.access_type || 'none',
      session: authData.session
    });

  } catch (error) {
    console.error('Signin error:', error);
    return res.status(500).json({ error: 'Failed to sign in' });
  }
}
