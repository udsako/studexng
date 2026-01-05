// lib/api.ts
// Central API service for communicating with Django backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// Types
export interface RegisterData {
  username: string;
  email: string;
  phone: string;
  password: string;
  password2: string;
  user_type: 'student' | 'vendor';
  matric_number?: string;
  hostel?: string;
  business_name?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  phone: string;
  user_type: string;
  matric_number?: string;
  hostel?: string;
  business_name?: string;
  is_verified_vendor: boolean;
  bio?: string;
  profile_image?: string;
  wallet_balance: string;
  created_at: string;
  profile: {
    whatsapp?: string;
    instagram?: string;
    total_orders: number;
    total_sales: number;
    rating: string;
    total_reviews: number;
  };
}

export interface AuthResponse {
  message: string;
  user: UserProfile;
  tokens: {
    refresh: string;
    access: string;
  };
}

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// API Class
class API {
  // Auth Endpoints
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    const result = await response.json();
    
    // Store tokens with snake_case to match authStore
    localStorage.setItem('access_token', result.tokens.access);
    localStorage.setItem('refresh_token', result.tokens.refresh);
    localStorage.setItem('user', JSON.stringify(result.user));

    return result;
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const result = await response.json();
    
    // Store tokens with snake_case to match authStore
    localStorage.setItem('access_token', result.tokens.access);
    localStorage.setItem('refresh_token', result.tokens.refresh);
    localStorage.setItem('user', JSON.stringify(result.user));

    return result;
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout/`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } finally {
      // Clear local storage regardless of API response
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  }

  async getProfile(): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/api/auth/profile/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, try to refresh
        await this.refreshToken();
        // Retry the request
        return this.getProfile();
      }
      throw new Error('Failed to fetch profile');
    }

    return response.json();
  }

  async updateProfile(data: Partial<UserProfile>): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/profile/update/`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update profile');
    }

    const result = await response.json();
    localStorage.setItem('user', JSON.stringify(result.user));
    return result;
  }

  async refreshToken(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      // Refresh token is invalid, logout user
      this.logout();
      throw new Error('Session expired. Please login again.');
    }

    const result = await response.json();
    localStorage.setItem('access_token', result.access);
  }

  // Helper to check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  // Get current user from localStorage
  getCurrentUser(): UserProfile | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
}

// Export singleton instance
export const api = new API();