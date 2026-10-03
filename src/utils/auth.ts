// Real authentication service integrated with GrowNaturals backend API

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  role?: string;
  phone?: string;
  permissions?: Record<string, boolean>;
  password?: string;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}

const BASE_URL = '/api';

export const register = async (
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, message: data.error || 'Registration failed' };
    }

    const token = data.token || `token_${data.user?.id || Date.now()}`;
    const user: User = data.user || {
      id: `usr_${Date.now()}`,
      name,
      email,
      role: 'staff'
    };

    localStorage.setItem("auth_token", token);
    localStorage.setItem("gn_auth_token", token);
    localStorage.setItem("current_user", JSON.stringify(user));
    localStorage.setItem("gn_auth_user", JSON.stringify(user));

    return {
      success: true,
      message: "Registration successful!",
      user,
      token,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Network error during registration',
    };
  }
};

export const login = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Fallback for hardcoded demo account if server returns 401
      if (email.toLowerCase() === 'example@example.com' && password === '123456') {
        const hardcodedUser: User = {
          id: 'hardcoded_user',
          name: 'Example User',
          email: 'example@example.com',
          role: 'admin',
          username: 'admin'
        };
        const token = `token_${Date.now()}`;
        localStorage.setItem("auth_token", token);
        localStorage.setItem("gn_auth_token", token);
        localStorage.setItem("current_user", JSON.stringify(hardcodedUser));
        localStorage.setItem("gn_auth_user", JSON.stringify(hardcodedUser));
        return { success: true, message: 'Login successful!', user: hardcodedUser, token };
      }
      return { success: false, message: data.error || 'Invalid credentials' };
    }

    const token = data.token || `token_${data.user?.id || Date.now()}`;
    const user = data.user;

    localStorage.setItem("auth_token", token);
    localStorage.setItem("gn_auth_token", token);
    localStorage.setItem("current_user", JSON.stringify(user));
    localStorage.setItem("gn_auth_user", JSON.stringify(user));

    return {
      success: true,
      message: 'Login successful!',
      user,
      token,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Network error occurred during login',
    };
  }
};

export const logout = (): void => {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("gn_auth_token");
  localStorage.removeItem("current_user");
  localStorage.removeItem("gn_auth_user");
};

export const getCurrentUser = (): User | null => {
  const userJson = localStorage.getItem("current_user") || localStorage.getItem("gn_auth_user");
  const token = localStorage.getItem("auth_token") || localStorage.getItem("gn_auth_token");

  if (!userJson || !token) {
    return null;
  }

  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  return !!(localStorage.getItem("auth_token") || localStorage.getItem("gn_auth_token"));
};
