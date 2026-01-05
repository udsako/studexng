// src/lib/api.ts
// CRITICAL FIX: Complete API client with auth, token refresh, and error handling

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  username: string;
  email: string;
  phone: string;
  password: string;
  password2: string;
  user_type: string;
  matric_number?: string;
  hostel?: string;
}

interface AuthResponse {
  user: {
    id: number;
    username: string;
    email: string;
    phone: string;
    user_type: string;
    matric_number?: string | null;
    hostel?: string;
    business_name?: string | null;
    is_verified_vendor: boolean;
    wallet_balance: string;
  };
  tokens: {
    access: string;
    refresh: string;
  };
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // Get access token from localStorage
  private getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access_token");
  }

  // Get refresh token from localStorage
  private getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("refresh_token");
  }

  // Refresh access token using refresh token
  private async refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${this.baseURL}/api/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        // Refresh token expired or invalid - user needs to login again
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/auth";
        return null;
      }

      const data = await response.json();
      const newAccessToken = data.access;

      // Update access token in localStorage
      localStorage.setItem("access_token", newAccessToken);
      return newAccessToken;
    } catch (error) {
      console.error("Token refresh failed:", error);
      return null;
    }
  }

  // Make authenticated request with automatic token refresh
  private async authenticatedFetch(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    let accessToken = this.getAccessToken();

    // Add Authorization header
    const headers = new Headers(options.headers || {});
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }

    let response = await fetch(url, { ...options, headers });

    // If 401 Unauthorized, try refreshing token
    if (response.status === 401) {
      console.log("Access token expired, attempting refresh...");
      accessToken = await this.refreshAccessToken();

      if (accessToken) {
        // Retry request with new access token
        headers.set("Authorization", `Bearer ${accessToken}`);
        response = await fetch(url, { ...options, headers });
      }
    }

    return response;
  }

  // LOGIN - POST /api/auth/login/
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail ||
          errorData.error ||
          errorData.non_field_errors?.[0] ||
          "Login failed. Please check your credentials."
        );
      }

      const result: AuthResponse = await response.json();
      return result;
    } catch (error: any) {
      console.error("Login error:", error);
      throw new Error(error.message || "Failed to connect to server");
    }
  }

  // REGISTER - POST /api/auth/register/
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Extract first error message from various possible formats
        let errorMessage = "Registration failed";
        if (errorData.email) errorMessage = `Email: ${errorData.email[0]}`;
        else if (errorData.username) errorMessage = `Username: ${errorData.username[0]}`;
        else if (errorData.phone) errorMessage = `Phone: ${errorData.phone[0]}`;
        else if (errorData.password) errorMessage = `Password: ${errorData.password[0]}`;
        else if (errorData.matric_number) errorMessage = `Matric: ${errorData.matric_number[0]}`;
        else if (errorData.detail) errorMessage = errorData.detail;
        else if (errorData.error) errorMessage = errorData.error;
        else if (errorData.non_field_errors) errorMessage = errorData.non_field_errors[0];

        throw new Error(errorMessage);
      }

      const result: AuthResponse = await response.json();
      return result;
    } catch (error: any) {
      console.error("Registration error:", error);
      throw new Error(error.message || "Failed to connect to server");
    }
  }

  // GET PROFILE - GET /api/auth/profile/
  async getProfile(): Promise<AuthResponse["user"]> {
    try {
      const response = await this.authenticatedFetch(
        `${this.baseURL}/api/auth/profile/`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      console.error("Get profile error:", error);
      throw new Error(error.message || "Failed to fetch profile");
    }
  }

  // GET LISTINGS - GET /api/services/listings/
  async getListings(params?: { category?: string; search?: string }): Promise<any> {
    try {
      const url = new URL(`${this.baseURL}/api/services/listings/`);
      if (params?.category) url.searchParams.append("category", params.category);
      if (params?.search) url.searchParams.append("search", params.search);

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error("Failed to fetch listings");
      }

      const result = await response.json();
      return result.results || result;
    } catch (error: any) {
      console.error("Get listings error:", error);
      throw new Error(error.message || "Failed to fetch listings");
    }
  }

  // GET CATEGORIES - GET /api/services/categories/
  async getCategories(): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/api/services/categories/`);

      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      const result = await response.json();
      return result.results || result;
    } catch (error: any) {
      console.error("Get categories error:", error);
      throw new Error(error.message || "Failed to fetch categories");
    }
  }

  // LOGOUT - POST /api/auth/logout/
  async logout(): Promise<void> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) return;

      await this.authenticatedFetch(`${this.baseURL}/api/auth/logout/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      // Clear tokens regardless of response
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    } catch (error) {
      console.error("Logout error:", error);
      // Clear tokens even if logout fails
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
  }
}

export const api = new ApiClient(API_BASE_URL);
