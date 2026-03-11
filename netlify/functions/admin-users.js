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
    return { error: 'Token de autenticacao nao fornecido', status: 401 };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { error: 'Token invalido ou expirado', status: 401 };
  }

  const role = user.app_metadata?.role || user.user_metadata?.role;
  if (role !== 'admin') {
    return { error: 'Acesso negado', status: 403 };
  }

  return { user };
}

async function logAdminAction(supabase, performedBy, action, targetUserId, targetEmail, metadata) {
  try {
    const { data: performer } = await supabase.auth.admin.getUserById(performedBy);
    const performerEmail = performer?.user?.email || null;

    await supabase.from('admin_logs').insert({
      performed_by: performedBy,
      performer_email: performerEmail,
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
        display_name: displayName || 'Usuario',
      });
    }
  } catch (err) {
    console.error('Failed to ensure user profile:', err);
  }
}

function mapUserResponse(user, profile) {
  return {
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.name || 'Usuario',
    role: user.app_metadata?.role || user.user_metadata?.role || 'viewer',
    createdAt: user.created_at,
    phone: profile?.phone || null,
    avatar_url: profile?.avatar_url || null,
    display_name: profile?.display_name || user.user_metadata?.name || 'Usuario',
  };
}

async function handleGetSingleUser(supabase, userId) {
  const { data: userData, error } = await supabase.auth.admin.getUserById(userId);

  if (error || !userData?.user) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ success: false, error: 'Usuario nao encontrado' }),
    };
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true, user: mapUserResponse(userData.user, profile) }),
  };
}

async function handleGet(supabase, event) {
  const params = event.queryStringParameters || {};

  if (params.userId) {
    return handleGetSingleUser(supabase, params.userId);
  }

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

    users.push(mapUserResponse(user, null));
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
    return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'JSON invalido' }) };
  }

  const { email, password, name, role } = body;

  if (!email || !password || !name) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: 'Email, senha e nome sao obrigatorios' }),
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
    body: JSON.stringify({ success: true, user: mapUserResponse(data.user, null) }),
  };
}

async function handlePatch(supabase, event, adminUser) {
  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'JSON invalido' }) };
  }

  const { userId, role } = body;

  if (!userId || !role) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: 'userId e role sao obrigatorios' }),
    };
  }

  if (!VALID_ROLES.includes(role)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: `Role invalido. Use: ${VALID_ROLES.join(', ')}` }),
    };
  }

  const { data: targetUser } = await supabase.auth.admin.getUserById(userId);
  if (targetUser?.user?.email === PRIMARY_ADMIN_EMAIL) {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ success: false, error: 'Administrador principal nao pode ser modificado' }),
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
    body: JSON.stringify({ success: true, user: mapUserResponse(data.user, null) }),
  };
}

async function handlePut(supabase, event, adminUser) {
  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'JSON invalido' }) };
  }

  const { userId, password, name, email, phone, role, avatar_url } = body;

  if (!userId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: 'userId e obrigatorio' }),
    };
  }

  const { data: targetUserData } = await supabase.auth.admin.getUserById(userId);
  const targetUser = targetUserData?.user;

  if (!targetUser) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ success: false, error: 'Usuario nao encontrado' }),
    };
  }

  const isPrimary = targetUser.email === PRIMARY_ADMIN_EMAIL;
  const changes = [];

  const authUpdates = {};

  if (name !== undefined && name !== targetUser.user_metadata?.name) {
    authUpdates.user_metadata = { ...targetUser.user_metadata, name };
    changes.push({ field: 'name', old: targetUser.user_metadata?.name, new: name });
  }

  if (email !== undefined && email !== targetUser.email) {
    if (isPrimary) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ success: false, error: 'Administrador principal nao pode ser modificado' }),
      };
    }
    authUpdates.email = email;
    authUpdates.email_confirm = true;
    changes.push({ field: 'email', old: targetUser.email, new: email });
  }

  if (role !== undefined && VALID_ROLES.includes(role)) {
    const currentRole = targetUser.app_metadata?.role || 'viewer';
    if (role !== currentRole) {
      if (isPrimary) {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ success: false, error: 'Administrador principal nao pode ser modificado' }),
        };
      }
      authUpdates.app_metadata = { ...targetUser.app_metadata, role };
      changes.push({ field: 'role', old: currentRole, new: role });
    }
  }

  if (password !== undefined && password.length > 0) {
    if (password.length < 6) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'A senha deve ter no minimo 6 caracteres' }),
      };
    }
    if (isPrimary) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ success: false, error: 'Senha do administrador principal nao pode ser alterada por aqui' }),
      };
    }
    authUpdates.password = password;
    changes.push({ field: 'password', old: '***', new: '***' });
  }

  if (Object.keys(authUpdates).length > 0) {
    const { error } = await supabase.auth.admin.updateUserById(userId, authUpdates);
    if (error) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: error.message }) };
    }
  }

  const profileUpdates = { updated_at: new Date().toISOString() };
  let profileChanged = false;

  if (name !== undefined) {
    profileUpdates.display_name = name;
    profileChanged = true;
  }
  if (phone !== undefined) {
    profileUpdates.phone = phone || null;
    profileChanged = true;
  }
  if (avatar_url !== undefined) {
    profileUpdates.avatar_url = avatar_url || null;
    profileChanged = true;
  }

  if (profileChanged) {
    await ensureUserProfile(supabase, userId, name || targetUser.user_metadata?.name);
    await supabase.from('user_profiles').update(profileUpdates).eq('id', userId);
  }

  for (const change of changes) {
    let action = 'update_profile';
    if (change.field === 'email') action = 'update_email';
    else if (change.field === 'role') action = 'update_role';
    else if (change.field === 'password') action = 'change_password';

    await logAdminAction(
      supabase,
      adminUser.id,
      action,
      userId,
      email || targetUser.email,
      { [change.field]: { old: change.old, new: change.new } }
    );
  }

  if (profileChanged && !changes.some(c => ['name', 'email', 'role', 'password'].includes(c.field))) {
    await logAdminAction(
      supabase,
      adminUser.id,
      'update_profile',
      userId,
      email || targetUser.email,
      { fields_updated: Object.keys(profileUpdates).filter(k => k !== 'updated_at') }
    );
  }

  const { data: updatedUser } = await supabase.auth.admin.getUserById(userId);
  const { data: updatedProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true, user: mapUserResponse(updatedUser?.user || targetUser, updatedProfile) }),
  };
}

async function handleDelete(supabase, event, adminUser) {
  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'JSON invalido' }) };
  }

  const { userId } = body;

  if (!userId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: 'userId e obrigatorio' }),
    };
  }

  const { data: targetUser } = await supabase.auth.admin.getUserById(userId);
  if (targetUser?.user?.email === PRIMARY_ADMIN_EMAIL) {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ success: false, error: 'Administrador principal nao pode ser modificado' }),
    };
  }

  const targetEmail = targetUser?.user?.email || '';
  const targetName = targetUser?.user?.user_metadata?.name || '';

  await supabase
    .from('user_profiles')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', userId);

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: '876000h',
  });

  if (error) {
    return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: error.message }) };
  }

  await logAdminAction(supabase, adminUser.id, 'deactivate_user', userId, targetEmail, {
    deactivated_user_name: targetName,
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
        return await handleGet(supabase, event);
      case 'POST':
        return await handlePost(supabase, event, adminUser);
      case 'PUT':
        return await handlePut(supabase, event, adminUser);
      case 'PATCH':
        return await handlePatch(supabase, event, adminUser);
      case 'DELETE':
        return await handleDelete(supabase, event, adminUser);
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ success: false, error: 'Metodo nao permitido' }),
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
