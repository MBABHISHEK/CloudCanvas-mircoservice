// Image Service Client
class ImageService {
  constructor() {
    this.baseURL = "http://localhost:3002/api";
  }

  getAuthHeaders() {
    const token = localStorage.getItem("cloudCanvasToken");
    return {
      Authorization: token ? `Bearer ${token}` : "",
    };
  }

  async uploadImage(formData) {
    try {
      const response = await fetch(`${this.baseURL}/images/upload`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: formData,
      });

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
  async getUserImages() {
    try {
      const response = await fetch(`${this.baseURL}/images/my-images`, {
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();
      console.log(data);
      console.log(response);

      if (response.ok) {
        // Convert file_path to a proper URL
        const imagesWithUrl = data.images.map((img) => ({
          ...img,
          url: `http://localhost:3002/${img.file_path.replace(/\\/g, "/")}`,
        }));
        console.log(imagesWithUrl);
        return { success: true, images: imagesWithUrl };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      return { success: false, error: "Network error occurred" };
    }
  }

  async deleteImage(imageId) {
    try {
      const response = await fetch(`${this.baseURL}/images/${imageId}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      return { success: false, error: "Network error occurred" };
    }
  }
}

// Create global image service instance
window.imageService = new ImageService();
