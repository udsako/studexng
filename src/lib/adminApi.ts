// src/lib/adminApi.ts
// Admin API client for admin panel endpoints

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface AdminLoginRequest {
  email: string;
  password: string;
}

interface AdminAuthResponse {
  user: {
    id: number;
    username: string;
    email: string;
    is_staff: boolean;
    is_superuser: boolean;
  };
  tokens: {
    access: string;
    refresh: string;
  };
}

interface DashboardStats {
  users: {
    total_users: number;
    active_users: number;
    inactive_users: number;
    vendors: number;
    verified_vendors: number;
    pending_vendors: number;
    new_users_30d: number;
  };
  listings: {
    total_listings: number;
    published_listings: number;
    draft_listings: number;
    category_breakdown: Array<{ category__title: string; count: number }>;
  };
  orders: {
    total_orders: number;
    pending_orders: number;
    completed_orders: number;
    cancelled_orders: number;
    total_revenue: number;
    revenue_30d: number;
    avg_order_value: number;
  };
  timestamp: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  phone: string;
  user_type: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
  profile: {
    is_verified_vendor: boolean;
    business_name?: string;
    matric_number?: string;
    hostel?: string;
  };
}

interface Listing {
  id: number;
  title: string;
  description: string;
  price: string;
  is_available: boolean;
  created_at: string;
  vendor: {
    id: number;
    username: string;
    email: string;
  };
  category: {
    id: number;
    title: string;
  };
}

interface Order {
  id: number;
  status: string;
  total_price: string;
  created_at: string;
  buyer: {
    id: number;
    username: string;
    email: string;
  };
  listing: {
    id: number;
    title: string;
  };
}

class AdminApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // Get admin access token from localStorage
  private getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("admin_access_token");
  }

  // Get admin refresh token from localStorage
  private getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("admin_refresh_token");
  }

  // Refresh admin access token
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
        // Refresh token expired - admin needs to login again
        localStorage.removeItem("admin_access_token");
        localStorage.removeItem("admin_refresh_token");
        localStorage.removeItem("isAdmin");
        window.location.href = "/admin/login";
        return null;
      }

      const data = await response.json();
      const newAccessToken = data.access;
      localStorage.setItem("admin_access_token", newAccessToken);
      return newAccessToken;
    } catch (error) {
      console.error("Admin token refresh failed:", error);
      return null;
    }
  }

  // Make authenticated admin request with automatic token refresh
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

    // If 401 or 403, try refreshing token
    if (response.status === 401 || response.status === 403) {
      console.log("Admin access token expired, attempting refresh...");
      accessToken = await this.refreshAccessToken();

      if (accessToken) {
        // Retry request with new access token
        headers.set("Authorization", `Bearer ${accessToken}`);
        response = await fetch(url, { ...options, headers });
      }
    }

    return response;
  }

  // ADMIN LOGIN - POST /api/auth/login/ (verify is_staff)
  async login(data: AdminLoginRequest): Promise<AdminAuthResponse> {
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
          "Login failed. Please check your credentials."
        );
      }

      const result: AdminAuthResponse = await response.json();

      // Verify user is staff
      if (!result.user.is_staff) {
        throw new Error("Access denied. Admin privileges required.");
      }

      return result;
    } catch (error: any) {
      console.error("Admin login error:", error);
      throw new Error(error.message || "Failed to connect to server");
    }
  }

  // GET DASHBOARD STATS - GET /api/admin/dashboard/
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await this.authenticatedFetch(
        `${this.baseURL}/api/admin/dashboard/`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }

      return await response.json();
    } catch (error: any) {
      console.error("Get dashboard stats error:", error);
      throw new Error(error.message || "Failed to fetch dashboard stats");
    }
  }

  // GET USERS LIST - GET /api/admin/users/
  async getUsers(params?: {
    search?: string;
    user_type?: string;
    is_active?: boolean;
    is_staff?: boolean;
  }): Promise<User[]> {
    try {
      const url = new URL(`${this.baseURL}/api/admin/users/`);
      if (params?.search) url.searchParams.append("search", params.search);
      if (params?.user_type) url.searchParams.append("user_type", params.user_type);
      if (params?.is_active !== undefined)
        url.searchParams.append("is_active", params.is_active.toString());
      if (params?.is_staff !== undefined)
        url.searchParams.append("is_staff", params.is_staff.toString());

      const response = await this.authenticatedFetch(url.toString());

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const result = await response.json();
      return result.results || result;
    } catch (error: any) {
      console.error("Get users error:", error);
      throw new Error(error.message || "Failed to fetch users");
    }
  }

  // GET USER DETAIL - GET /api/admin/users/{id}/
  async getUserDetail(userId: number): Promise<User> {
    try {
      const response = await this.authenticatedFetch(
        `${this.baseURL}/api/admin/users/${userId}/`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user details");
      }

      return await response.json();
    } catch (error: any) {
      console.error("Get user detail error:", error);
      throw new Error(error.message || "Failed to fetch user details");
    }
  }

  // UPDATE USER - PATCH /api/admin/users/{id}/
  async updateUser(
    userId: number,
    data: {
      is_active?: boolean;
      is_staff?: boolean;
      user_type?: string;
      profile?: {
        is_verified_vendor?: boolean;
      };
    }
  ): Promise<User> {
    try {
      const response = await this.authenticatedFetch(
        `${this.baseURL}/api/admin/users/${userId}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update user");
      }

      return await response.json();
    } catch (error: any) {
      console.error("Update user error:", error);
      throw new Error(error.message || "Failed to update user");
    }
  }

  // DELETE USER - DELETE /api/admin/users/{id}/
  async deleteUser(userId: number, hardDelete: boolean = false): Promise<void> {
    try {
      const url = new URL(`${this.baseURL}/api/admin/users/${userId}/`);
      if (hardDelete) url.searchParams.append("hard_delete", "true");

      const response = await this.authenticatedFetch(url.toString(), {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete user");
      }
    } catch (error: any) {
      console.error("Delete user error:", error);
      throw new Error(error.message || "Failed to delete user");
    }
  }

  // GET LISTINGS - GET /api/admin/listings/
  async getListings(params?: {
    search?: string;
    is_available?: boolean;
    category?: number;
  }): Promise<Listing[]> {
    try {
      const url = new URL(`${this.baseURL}/api/admin/listings/`);
      if (params?.search) url.searchParams.append("search", params.search);
      if (params?.is_available !== undefined)
        url.searchParams.append("is_available", params.is_available.toString());
      if (params?.category) url.searchParams.append("category", params.category.toString());

      const response = await this.authenticatedFetch(url.toString());

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

  // GET LISTING DETAIL - GET /api/admin/listings/{id}/
  async getListingDetail(listingId: number): Promise<Listing> {
    try {
      const response = await this.authenticatedFetch(
        `${this.baseURL}/api/admin/listings/${listingId}/`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch listing details");
      }

      return await response.json();
    } catch (error: any) {
      console.error("Get listing detail error:", error);
      throw new Error(error.message || "Failed to fetch listing details");
    }
  }

  // UPDATE LISTING - PATCH /api/admin/listings/{id}/
  async updateListing(
    listingId: number,
    data: {
      is_available?: boolean;
      title?: string;
      description?: string;
      price?: string;
    }
  ): Promise<Listing> {
    try {
      const response = await this.authenticatedFetch(
        `${this.baseURL}/api/admin/listings/${listingId}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update listing");
      }

      return await response.json();
    } catch (error: any) {
      console.error("Update listing error:", error);
      throw new Error(error.message || "Failed to update listing");
    }
  }

  // DELETE LISTING - DELETE /api/admin/listings/{id}/
  async deleteListing(listingId: number): Promise<void> {
    try {
      const response = await this.authenticatedFetch(
        `${this.baseURL}/api/admin/listings/${listingId}/`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete listing");
      }
    } catch (error: any) {
      console.error("Delete listing error:", error);
      throw new Error(error.message || "Failed to delete listing");
    }
  }

  // GET ORDERS - GET /api/admin/orders/
  async getOrders(params?: { status?: string }): Promise<Order[]> {
    try {
      const url = new URL(`${this.baseURL}/api/admin/orders/`);
      if (params?.status) url.searchParams.append("status", params.status);

      const response = await this.authenticatedFetch(url.toString());

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const result = await response.json();
      return result.results || result;
    } catch (error: any) {
      console.error("Get orders error:", error);
      throw new Error(error.message || "Failed to fetch orders");
    }
  }

  // UPDATE ORDER STATUS - PATCH /api/admin/orders/{id}/
  async updateOrderStatus(orderId: number, status: string): Promise<Order> {
    try {
      const response = await this.authenticatedFetch(
        `${this.baseURL}/api/admin/orders/${orderId}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update order status");
      }

      return await response.json();
    } catch (error: any) {
      console.error("Update order error:", error);
      throw new Error(error.message || "Failed to update order status");
    }
  }

  // LOGOUT
  async logout(): Promise<void> {
    try {
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        await this.authenticatedFetch(`${this.baseURL}/api/auth/logout/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh: refreshToken }),
        });
      }
    } catch (error) {
      console.error("Admin logout error:", error);
    } finally {
      // Clear admin tokens and flags
      localStorage.removeItem("admin_access_token");
      localStorage.removeItem("admin_refresh_token");
      localStorage.removeItem("isAdmin");
      localStorage.removeItem("adminName");
      localStorage.removeItem("adminEmail");
    }
  }
}

export const adminApi = new AdminApiClient(API_BASE_URL);
