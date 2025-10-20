class ImageService {
  constructor() {
    this.baseURL = "http://localhost:3002/api";
  }

  getAuthHeaders() {
    const token = localStorage.getItem("cloudCanvasToken");
    return { Authorization: token ? `Bearer ${token}` : "" };
  }

  // Dashboard - current user images + stats
  async getUserImagesWithStats() {
    try {
      const res = await fetch(`${this.baseURL}/images/my-images`, {
        headers: this.getAuthHeaders(),
      });
      const data = await res.json();
      console.log(data);
      if (!res.ok) return { success: false, error: data.message };
      console.log(res.ok);
      const images = (data.images || []).map((img) => ({
        ...img,
        url: img.url.startsWith("http")
          ? img.url
          : `http://localhost:3002${img.url.startsWith("/") ? "" : "/"}${
              img.url
            }`,
      }));

      console.log(images.url);
      const total = images.length;
      const publicCount = images.filter((i) => i.is_public === 1).length;
      const privateCount = total - publicCount;
      const storageUsed = images.reduce((acc, i) => acc + i.file_size, 0);
      console.log(images.length);
      return {
        success: true,
        images,
        stats: {
          total,
          public: publicCount,
          private: privateCount,
          storageUsed,
        },
      };
    } catch (err) {
      return { success: false, error: "Network error" };
    }
  }

  // Gallery - all images
  async getAllImages() {
    try {
      const res = await fetch(`${this.baseURL}/images/public`);
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message };

      const images = data.images.map((img) => ({
        ...img,
        url: `http://localhost:3002/${img.file_path.replace(/\\/g, "/")}`,
      }));
      return { success: true, images };
    } catch (err) {
      return { success: false, error: "Network error" };
    }
  }

  async uploadImage(formData) {
    try {
      const res = await fetch(`${this.baseURL}/images/upload`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: formData,
      });
      const data = await res.json();
      console.log(res.ok);
      return res.ok
        ? { success: true, image: data.image }
        : { success: false, error: data.message };
    } catch (err) {
      return { success: false, error: "Network error" };
    }
  }

  async deleteImage(imageId) {
    try {
      const res = await fetch(`${this.baseURL}/images/${imageId}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      });
      const data = await res.json();
      return res.ok
        ? { success: true }
        : { success: false, error: data.message };
    } catch (err) {
      return { success: false, error: "Network error" };
    }
  }
}

window.imageService = new ImageService();
