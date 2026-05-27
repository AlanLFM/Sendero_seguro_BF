const API_BASE = 'https://api.interactiveagents.lat/api';

const getHeaders = (includeAuth = true) => {
  const headers = { 'Content-Type': 'application/json' };
  if (includeAuth) {
    const token = localStorage.getItem('sendero_access_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const refreshToken = async () => {
  const rt = localStorage.getItem('sendero_refresh_token');
  if (!rt) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    localStorage.setItem('sendero_access_token', data.accessToken);
    localStorage.setItem('sendero_refresh_token', data.refreshToken);
    return true;
  } catch (err) {
    console.error('[API] Error refrescando token:', err.message);
    return false;
  }
};

const apiCall = async (path, options = {}) => {
  const { includeAuth = true, ...fetchOptions } = options;

  const config = {
    headers: getHeaders(includeAuth),
    ...fetchOptions,
  };

  if (options.body && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  try {
    let res = await fetch(`${API_BASE}${path}`, config);

    if (res.status === 401 && includeAuth) {
      const refreshed = await refreshToken();
      if (refreshed) {
        config.headers = getHeaders(true);
        res = await fetch(`${API_BASE}${path}`, config);
      } else {
        localStorage.removeItem('sendero_access_token');
        localStorage.removeItem('sendero_refresh_token');
        localStorage.removeItem('sendero_user');
        window.location.href = '/login';
        throw new Error('Sesion expirada');
      }
    }

    const data = await res.json();

    if (!res.ok) {
      console.error(`[API] Error ${res.status} en ${path}:`, data.error || data);
      throw new Error(data.error || 'Error en la peticion');
    }

    return data;
  } catch (err) {
    console.error(`[API] Error en ${options.method || 'GET'} ${path}:`, err.message);
    throw err;
  }
};

export const api = {
  get: (path, options = {}) => apiCall(path, { method: 'GET', ...options }),
  post: (path, body, options = {}) => apiCall(path, { method: 'POST', body, ...options }),
  put: (path, body, options = {}) => apiCall(path, { method: 'PUT', body, ...options }),
  patch: (path, body, options = {}) => apiCall(path, { method: 'PATCH', body, ...options }),
  delete: (path, options = {}) => apiCall(path, { method: 'DELETE', ...options }),
};

export default api;
