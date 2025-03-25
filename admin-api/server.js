const express = require("express");
const cors = require("cors");
require("dotenv").config();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const ArticlesDB = require("./modules/articleDB");

const db = new ArticlesDB();
const app = express();

app.use(cors());
app.use(express.json());

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "articles",
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});

const upload = multer({ storage });

// Test Route
app.get("/", (req, res) => {
  res.json({ message: "API Listening" });
});

// API routes

// Create an article with image upload
app.post("/api/articles", upload.single("image"), async (req, res) => {
  try {
    const articleData = {
      title: req.body.title,
      content: req.body.content,
      category: req.body.category,
      published: req.body.published === "true",
      image_url: req.file ? req.file.path : null,
    };

    const article = await db.addArticle(articleData);
    res.status(201).json(article);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all articles (with optional filtering by category)
app.get("/api/articles", async (req, res) => {
  try {
    const { page = 1, perPage = 10, category } = req.query;
    const articles = await db.getArticles(
      Number(page),
      Number(perPage),
      category
    );
    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single article by ID
app.get("/api/articles/:id", async (req, res) => {
  try {
    const article = await db.getArticleById(req.params.id);
    article ? res.json(article) : res.status(404).json({ error: "Not found" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update an article (excluding image)
app.put("/api/articles/:id", async (req, res) => {
  try {
    const updatedArticle = await db.updateArticle(req.params.id, req.body);
    updatedArticle
      ? res.json(updatedArticle)
      : res.status(404).json({ error: "Not found" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete an article
app.delete("/api/articles/:id", async (req, res) => {
  try {
    await db.deleteArticle(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Initialize DB
db.initialize(process.env.MONGODB_CONN_STRING)
  .then(() => {
    console.log("Database initialized successfully");

    // Local server setup
    if (process.env.NODE_ENV !== "production") {
      const HTTP_PORT = process.env.PORT || 3000;
      app.listen(HTTP_PORT, () => {
        console.log(`Server running locally at http://localhost:${HTTP_PORT}`);
      });
    }
  })
  .catch((err) => {
    console.error("Database initialization failed:", err);
  });

// Export app for Vercel
module.exports = app;
