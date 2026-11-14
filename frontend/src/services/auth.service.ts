// Simple authentication service
// For production, replace with proper JWT authentication

interface LoginCredentials {
  username: string;
  password: string;
}

interface AuthUser {
  username: string;
  role: string;
}

// Hardcoded credentials (can be moved to env or database later)
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
};

const AUTH_STORAGE_KEY = 'auth_user';

export const authService = {
  // Login with username and password
  login(credentials: LoginCredentials): boolean {
    if (
      credentials.username === ADMIN_CREDENTIALS.username &&
      credentials.password === ADMIN_CREDENTIALS.password
    ) {
      const user: AuthUser = {
        username: credentials.username,
        role: 'admin',
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      return true;
    }
    return false;
  },

  // Logout
  logout(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const user = localStorage.getItem(AUTH_STORAGE_KEY);
    return !!user;
  },

  // Get current user
  getCurrentUser(): AuthUser | null {
    const user = localStorage.getItem(AUTH_STORAGE_KEY);
    if (user) {
      return JSON.parse(user);
    }
    return null;
  },
};
