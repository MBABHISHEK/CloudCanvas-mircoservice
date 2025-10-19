const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "abhishek@2003@sql",
  database: process.env.DB_NAME || "library_database",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Routes
app.get("/api/gallery/public", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    // Get total count
    const [countResult] = await pool.execute(
      "SELECT COUNT(*) as total FROM image_metadata WHERE is_public = TRUE"
    );
    const total = countResult[0].total;

    // Get images with pagination
    const [images] = await pool.execute(
      `SELECT im.*, 
                    GROUP_CONCAT(it.tag) as tags
             FROM image_metadata im
             LEFT JOIN image_tags it ON im.id = it.image_id
             WHERE im.is_public = TRUE
             GROUP BY im.id
             ORDER BY im.created_at DESC
             LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    // Parse tags from comma-separated string to array
    const imagesWithTags = images.map((image) => ({
      ...image,
      tags: image.tags ? image.tags.split(",") : [],
    }));

    res.json({
      images: imagesWithTags,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get public images error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

app.get("/api/gallery/search", async (req, res) => {
  try {
    const query = req.query.q;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    if (!query) {
      return res.status(400).json({ message: "Search query required" });
    }

    // Get total count for search
    const [countResult] = await pool.execute(
      `SELECT COUNT(DISTINCT im.id) as total 
             FROM image_metadata im
             LEFT JOIN image_tags it ON im.id = it.image_id
             WHERE im.is_public = TRUE 
             AND (im.title LIKE ? OR im.description LIKE ? OR it.tag LIKE ?)`,
      [`%${query}%`, `%${query}%`, `%${query}%`]
    );
    const total = countResult[0].total;

    // Search images with pagination
    const [images] = await pool.execute(
      `SELECT im.*, 
                    GROUP_CONCAT(it.tag) as tags
             FROM image_metadata im
             LEFT JOIN image_tags it ON im.id = it.image_id
             WHERE im.is_public = TRUE 
             AND (im.title LIKE ? OR im.description LIKE ? OR it.tag LIKE ?)
             GROUP BY im.id
             ORDER BY im.created_at DESC
             LIMIT ? OFFSET ?`,
      [`%${query}%`, `%${query}%`, `%${query}%`, limit, offset]
    );

    // Parse tags
    const imagesWithTags = images.map((image) => ({
      ...image,
      tags: image.tags ? image.tags.split(",") : [],
    }));

    res.json({
      images: imagesWithTags,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

app.get("/api/gallery/images/:id", async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    const [images] = await connection.execute(
      `SELECT im.*, 
                    GROUP_CONCAT(it.tag) as tags
             FROM image_metadata im
             LEFT JOIN image_tags it ON im.id = it.image_id
             WHERE im.image_id = ? AND im.is_public = TRUE
             GROUP BY im.id`,
      [req.params.id]
    );

    if (images.length === 0) {
      return res.status(404).json({ message: "Image not found" });
    }

    const image = images[0];

    // Increment view count
    await connection.execute(
      "UPDATE image_metadata SET views = views + 1 WHERE id = ?",
      [image.id]
    );

    // Parse tags
    image.tags = image.tags ? image.tags.split(",") : [];

    res.json({ image });
  } catch (error) {
    console.error("Get image details error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// Endpoint called by image service when an image is uploaded
app.post("/api/gallery/images", async (req, res) => {
  let connection;
  try {
    const { imageId, userId, title, description, tags } = req.body;

    connection = await pool.getConnection();

    // Start transaction
    await connection.beginTransaction();

    // Insert image metadata
    const [result] = await connection.execute(
      `INSERT INTO image_metadata (image_id, user_id, title, description) 
             VALUES (?, ?, ?, ?)`,
      [imageId, userId, title || "", description || ""]
    );

    const metadataId = result.insertId;

    // Insert tags if provided
    if (tags && tags.length > 0) {
      const tagValues = tags.map((tag) => [metadataId, tag.trim()]);
      await connection.query(
        "INSERT INTO image_tags (image_id, tag) VALUES ?",
        [tagValues]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: "Image metadata created successfully",
      image: {
        id: metadataId,
        imageId,
        userId,
        title: title || "",
        description: description || "",
        tags: tags || [],
      },
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Create image metadata error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// Endpoint called by image service when an image is deleted
app.delete("/api/gallery/images/:imageId", async (req, res) => {
  try {
    await pool.execute("DELETE FROM image_metadata WHERE image_id = ?", [
      req.params.imageId,
    ]);

    res.json({ message: "Image metadata deleted successfully" });
  } catch (error) {
    console.error("Delete image metadata error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Health check
app.get("/health", async (req, res) => {
  try {
    await pool.execute("SELECT 1");
    res.json({ status: "OK", service: "gallery" });
  } catch (error) {
    res.status(500).json({ status: "Error", service: "gallery" });
  }
});

app.listen(PORT, () => {
  console.log(`Gallery service running on port ${PORT}`);
});
