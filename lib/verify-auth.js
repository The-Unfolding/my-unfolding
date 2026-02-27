import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Verify the Bearer token and ensure the userId in the request matches the token's user
export async function verifyAuth(req) {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing or invalid authorization header', status: 401 };
  }

  const token = authHeader.replace('Bearer ', '');
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return { error: 'Invalid or expired token', status: 401 };
    }
    return { user };
  } catch (err) {
    console.error('Auth verification error:', err);
    return { error: 'Authentication failed', status: 401 };
  }
}

// Verify auth AND check that the userId in the request matches the authenticated user
export async function verifyAuthAndUser(req, userId) {
  const result = await verifyAuth(req);
  if (result.error) return result;
  
  if (result.user.id !== userId) {
    return { error: 'User ID mismatch', status: 403 };
  }
  
  return result;
}

// Max payload sizes
export const MAX_ENTRY_LENGTH = 50000; // ~50K chars is very generous for a journal entry
export const MAX_INTENTION_LENGTH = 1000;
export const MAX_FEEDBACK_LENGTH = 5000;
