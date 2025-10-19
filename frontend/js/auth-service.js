// Authentication Service Client
class AuthService {
  constructor() {
    this.baseURL = "http://localhost:3001/api";
    this.token = localStorage.getItem("cloudCanvasToken");
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem("cloudCanvasToken", token);
  }

  getAuthHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: this.token ? `Bearer ${this.token}` : "",
    };
  }

  async register(userData) {
    try {
      const response = await fetch(`${this.baseURL}/auth/register`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        this.setToken(data.token);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      return { success: false, error: "Network error occurred" };
    }
  }

  async login(credentials) {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        this.setToken(data.token);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      return { success: false, error: "Network error occurred" };
    }
  }

  async getCurrentUser() {
    if (!this.token) return null;

    try {
      const response = await fetch(`${this.baseURL}/auth/me`, {
        headers: this.getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        return data.user;
      } else {
        this.logout();
        return null;
      }
    } catch (error) {
      return null;
    }
  }

  logout() {
    this.token = null;
    localStorage.removeItem("cloudCanvasToken");
  }

  isAuthenticated() {
    return !!this.token;
  }
}

// Create global auth service instance
window.authService = new AuthService();
