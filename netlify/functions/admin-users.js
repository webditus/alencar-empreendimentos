import { createClient } from '@supabase/supabase-js';

const PRIMARY_ADMIN_EMAIL = 'comercial@alencaremp.com.br';
const VALID_ROLES = ['admin', 'manager', 'viewer'];

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, access_token',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function authenticateAdmin(supabase, event) {
  const authHeader = event.headers?.authorization || event.headers?.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Token de autenticação não fornecido', status: 401 };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { error: 'Token inválido ou expirado', status: 401 };
  }

  const role = user.app_metadata?.role || user.user_metadata?.role;
  if (role !== 'admin') {
    return { error: 'Acesso negado', status: 403 };
  }

  return { user };
}

async function logAdminAction(supabase, performedBy, action, targetUserId, targetEmail, metadata) {
  try {
    await supabase.from('admin_logs').insert({
      performed_by: performedBy,
      action,
      target_user_id: targetUserId || null,
      target_email: targetEmail || null,
      metadata: metadata || null,
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

async function ensureUserProfile(supabase, userId, displayName) {
  try {
    const { data } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (!data) {
      await supabase.from('user_profiles').insert({
        id: userId,
        display_name: displayName || 'Usuário',
      });
    }
  } catch (err) {
    console.error('Failed to ensure user profile:', err);
  }
}

function mapUserResponse(user) {
  return {
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.name || 'Usuário',
    role: user.app_metadata?.role || user.user_metadata?.role || 'viewer',
    createdAt: user.created_at,
  };
}

async function handleGet(supabase) {
  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: error.message }) };
  }

  const users = [];
  for (const user of data.users) {
    let needsUpdate = false;
    const updates = {};

    if (user.email === PRIMARY_ADMIN_EMAIL && user.app_metadata?.role !== 'admin') {
      updates.app_metadata = { ...user.app_metadata, role: 'admin' };
      needsUpdate = true;
    } else if (!user.app_metadata?.role && user.user_metadata?.role) {
      updates.app_metadata = { ...user.app_metadata, role: user.user_metadata.role };
      needsUpdate = true;
    }

    if (needsUpdate) {
      await supabase.auth.admin.updateUserById(user.id, updates);
      if (updates.app_metadata) {
        user.app_metadata = updates.app_metadata;
      }
    }

    await ensureUserProfile(supabase, user.id, user.user_metadata?.name);

    users.push(mapUserResponse(user));
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true, users }),
  };
}

async function handlePost(supabase, event, adminUser) {
  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'JSON inválido' }) };
  }

  const { email, password, name, role } = body;

  if (!email || !password || !name) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: 'Email, senha e nome são obrigatórios' }),
    };
  }

  const finalRole = email === PRIMARY_ADMIN_EMAIL ? 'admin' : (VALID_ROLES.includes(role) ? role : 'viewer');

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
    app_metadata: { role: finalRole },
  });

  if (error) {
    return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: error.message }) };
  }

  await ensureUserProfile(supabase, data.user.id, name);

  await logAdminAction(supabase, adminUser.id, 'create_user', data.user.id, email, {
    name,
    role: finalRole,
  });

  return {
    statusCode: 201,
    headers,
    body: JSON.stringify({ success: true, user: mapUserResponse(data.user) }),
  };
}

async function handlePatch(supabase, event, adminUser) {
  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'JSON inválido' }) };
  }

  const { userId, role } = body;

  if (!userId || !role) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: 'userId e role são obrigatórios' }),
    };
  }

  if (!VALID_ROLES.includes(role)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: `Role inválido. Use: ${VALID_ROLES.join(', ')}` }),
    };
  }

  const { data: targetUser } = await supabase.auth.admin.getUserById(userId);
  if (targetUser?.user?.email === PRIMARY_ADMIN_EMAIL) {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ success: false, error: 'Administrador principal não pode ser modificado' }),
    };
  }

  const oldRole = targetUser?.user?.app_metadata?.role || 'viewer';

  const { data, error } = await supabase.auth.admin.updateUserById(userId, {
    app_metadata: { role },
  });

  if (error) {
    return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: error.message }) };
  }

  await logAdminAction(supabase, adminUser.id, 'update_role', userId, targetUser?.user?.email, {
    old_role: oldRole,
    new_role: role,
  });

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true, user: mapUserResponse(data.user) }),
  };
}

async function handleDelete(supabase, event, adminUser) {
  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'JSON inválido' }) };
  }

  const { userId } = body;

  if (!userId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: 'userId é obrigatório' }),
    };
  }

  const { data: targetUser } = await supabase.auth.admin.getUserById(userId);
  if (targetUser?.user?.email === PRIMARY_ADMIN_EMAIL) {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ success: false, error: 'Administrador principal não pode ser modificado' }),
    };
  }

  const targetEmail = targetUser?.user?.email || '';
  const targetName = targetUser?.user?.user_metadata?.name || '';

  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: error.message }) };
  }

  await logAdminAction(supabase, adminUser.id, 'delete_user', userId, targetEmail, {
    deleted_user_name: targetName,
  });

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true }),
  };
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const supabase = getSupabaseAdmin();

    const authResult = await authenticateAdmin(supabase, event);
    if (authResult.error) {
      return {
        statusCode: authResult.status,
        headers,
        body: JSON.stringify({ success: false, error: authResult.error }),
      };
    }

    const adminUser = authResult.user;

    switch (event.httpMethod) {
      case 'GET':
        return await handleGet(supabase);
      case 'POST':
        return await handlePost(supabase, event, adminUser);
      case 'PATCH':
        return await handlePatch(supabase, event, adminUser);
      case 'DELETE':
        return await handleDelete(supabase, event, adminUser);
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ success: false, error: 'Método não permitido' }),
        };
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};
