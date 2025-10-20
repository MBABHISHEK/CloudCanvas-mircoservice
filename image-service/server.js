const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
const PORT = process.env.PORT || 3002;
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key_here";

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "abhishek@2003@sql",
  database: process.env.DB_NAME || "cloudcanvas_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "/uploads";
    if (!fs.existsSync(uploadPath))
      fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) =>
    cb(
      null,
      Date.now() +
        "-" +
        Math.round(Math.random() * 1e9) +
        path.extname(file.originalname)
    ),
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    file.mimetype.startsWith("image/")
      ? cb(null, true)
      : cb(new Error("Only image files allowed!"), false),
});

// Auth middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access token required" });

  try {
    req.userId = jwt.verify(token, JWT_SECRET).userId;
    next();
  } catch {
    return res.status(403).json({ message: "Invalid token" });
  }
};

// ------------------- Routes -------------------

// Upload image
app.post(
  "/api/images/upload",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    let connection;
    try {
      if (!req.file)
        return res.status(400).json({ message: "No file uploaded" });
      connection = await pool.getConnection();

      const [result] = await connection.execute(
        `INSERT INTO images (filename, original_name, file_path, file_size, mime_type, user_id, is_public) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          req.file.filename,
          req.file.originalname,
          req.file.path,
          req.file.size,
          req.file.mimetype,
          req.userId,
          req.body.isPublic || 0, // allow setting public/private from frontend
        ]
      );

      res.status(201).json({
        message: "Image uploaded successfully",
        image: {
          id: result.insertId,
          filename: req.file.filename,
          originalName: req.file.originalname,
          url: `/uploads/${req.file.filename}`,
          size: req.file.size,
          isPublic: req.body.isPublic || 0,
          uploadedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    } finally {
      if (connection) connection.release();
    }
  }
);

// Get user's images (dashboard)
app.get("/api/images/my-images", authenticateToken, async (req, res) => {
  try {
    const [images] = await pool.execute(
      `SELECT id, filename, original_name, file_size, mime_type, is_public, uploaded_at FROM images WHERE user_id = ? ORDER BY uploaded_at DESC`,
      [req.userId]
    );
    console.log(images);
    const totalImages = images.length;
    const publicImages = images.filter((img) => img.is_public).length;
    const privateImages = totalImages - publicImages;
    const storageUsed = images.reduce((acc, img) => acc + img.file_size, 0);

    res.json({
      images: images.map((img) => ({
        ...img,
        url: `/uploads/${img.filename}`,
        isPublic: img.is_public,
      })),
      stats: {
        total: totalImages,
        public: publicImages,
        private: privateImages,
        storageUsed, // in bytes
      },
    });
  } catch (error) {
    console.error("Get images error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get public images (gallery)
app.get("/api/images/public", async (req, res) => {
  try {
    // Get all public images with uploader info
    const [images] = await pool.execute(
      `SELECT 
         i.id,
         i.filename,
         i.original_name,
         i.file_path,
         i.file_size,
         i.mime_type,
         i.uploaded_at,
         u.username AS uploaded_by
       FROM images i
       JOIN users u ON i.user_id = u.id
       WHERE i.is_public = 1
       ORDER BY i.uploaded_at DESC`
    );

    res.json({
      images: images.map((img) => ({
        ...img,
        url: `http://localhost:3002${img.file_path.replace(/\\/g, "/")}`, // full URL
      })),
      total: images.length,
    });
  } catch (error) {
    console.error("Get public images error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete image
app.delete("/api/images/:id", authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [images] = await connection.execute(
      "SELECT * FROM images WHERE id = ? AND user_id = ?",
      [req.params.id, req.userId]
    );
    if (images.length === 0)
      return res.status(404).json({ message: "Image not found" });

    const image = images[0];
    try {
      fs.unlinkSync(image.file_path);
    } catch {}

    await connection.execute(
      "DELETE FROM images WHERE id = ? AND user_id = ?",
      [req.params.id, req.userId]
    );
    res.json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// Health check
app.get("/health", async (req, res) => {
  try {
    await pool.execute("SELECT 1");
    res.json({ status: "OK", service: "images" });
  } catch {
    res.status(500).json({ status: "Error", service: "images" });
  }
});

app.listen(PORT, () => console.log(`Image service running on port ${PORT}`));
