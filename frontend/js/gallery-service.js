// Gallery Service Client
class GalleryService {
  constructor() {
    this.baseURL = "http://localhost:3003/api";
  }

  async getPublicImages(page = 1, limit = 12) {
    try {
      const response = await fetch(
        `${this.baseURL}/gallery/public?page=${page}&limit=${limit}`
      );
      const data = await response.json();

      if (response.ok) {
        return { success: true, images: data.images, total: data.total };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      return { success: false, error: "Network error occurred" };
    }
  }

  async searchImages(query, page = 1, limit = 12) {
    try {
      const response = await fetch(
        `${this.baseURL}/gallery/search?q=${encodeURIComponent(
          query
        )}&page=${page}&limit=${limit}`
      );
      const data = await response.json();

      if (response.ok) {
        return { success: true, images: data.images, total: data.total };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      return { success: false, error: "Network error occurred" };
    }
  }

  async getImageDetails(imageId) {
    try {
      const response = await fetch(`${this.baseURL}/gallery/images/${imageId}`);
      const data = await response.json();

      if (response.ok) {
        return { success: true, image: data.image };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      return { success: false, error: "Network error occurred" };
    }
  }
}

// Create global gallery service instance
window.galleryService = new GalleryService();
