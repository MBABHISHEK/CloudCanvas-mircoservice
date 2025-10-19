const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

// MySQL connection pool (single database)
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "abhishek@2003@sql",
  database: process.env.DB_NAME || "cloudcanvas_db",
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

    // Validate numbers
    if (limit < 1 || offset < 0) {
      return res.status(400).json({ message: "Invalid pagination values" });
    }

    // Total count
    const [countResult] = await pool.execute(
      "SELECT COUNT(*) as total FROM image_metadata WHERE is_public = TRUE"
    );
    const total = countResult[0].total;

    // Fetch images with tags, LIMIT/OFFSET interpolated
    const [images] = await pool.query(`
      SELECT im.*, GROUP_CONCAT(it.tag) as tags
      FROM image_metadata im
      LEFT JOIN image_tags it ON im.id = it.image_id
      WHERE im.is_public = TRUE
      GROUP BY im.id
      ORDER BY im.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    // Add proper URL field for each image
    const imagesWithUrl = images.map((img) => ({
      ...img,
      tags: img.tags ? img.tags.split(",") : [],
      url: `http://localhost:3002/${img.file_path.replace(/\\/g, "/")}`,
    }));

    res.json({
      images: imagesWithUrl,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get public images error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

app.post("/api/gallery/images", async (req, res) => {
  let connection;
  try {
    const { imageId, userId, title, description, tags } = req.body;
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [result] = await connection.execute(
      "INSERT INTO image_metadata (image_id, user_id, title, description) VALUES (?, ?, ?, ?)",
      [imageId, userId, title || "", description || ""]
    );
    const metadataId = result.insertId;

    if (tags && tags.length > 0) {
      const tagValues = tags.map((tag) => [metadataId, tag.trim()]);
      await connection.query(
        "INSERT INTO image_tags (image_id, tag) VALUES ?",
        [tagValues]
      );
    }

    await connection.commit();
    res.status(201).json({
      message: "Image metadata created",
      image: { id: metadataId, imageId, userId, title, description, tags },
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Create image metadata error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

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

app.get("/health", async (req, res) => {
  try {
    await pool.execute("SELECT 1");
    res.json({ status: "OK", service: "gallery" });
  } catch {
    res.status(500).json({ status: "Error", service: "gallery" });
  }
});

app.listen(PORT, () => console.log(`Gallery service running on port ${PORT}`));
