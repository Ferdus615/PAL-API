const mongoose = require("mongoose");
const Article = require("./articleSchema");

class ArticlesDB {
  constructor() {
    if (mongoose.connection.readyState === 1) {
      this.connection = mongoose.connection;
    } else {
      this.connection = null;
    }
  }

  async initialize(dbURL) {
    if (this.connection) {
      console.log("Already connected to MongoDB.");
      return;
    }

    try {
      this.connection = await mongoose.connect(dbURL, {
        serverSelectionTimeoutMS: 3000,
      });
      console.log("Connected to MongoDB");

      await Article.createIndexes();
    } catch (err) {
      console.error("MongoDB connection error:", err);
      throw new Error("Failed to connect to MongoDB.");
    }
  }

  async addArticle(data) {
    try {
      const newArticle = new Article(data);
      return await newArticle.save();
    } catch (err) {
      throw new Error("Error adding article: " + err.message);
    }
  }

  async getArticles(page = 1, perPage = 10, category) {
    try {
      const filter = category ? { category } : {};
      return await Article.find(filter)
        .sort({ createdAt: -1 })
        .limit(perPage)
        .skip((page - 1) * perPage);
    } catch (err) {
      throw new Error("Error fetching articles: " + err.message);
    }
  }

  async getArticleById(id) {
    try {
      return await Article.findById(id);
    } catch (err) {
      throw new Error("Error fetching article by ID: " + err.message);
    }
  }

  async updateArticle(id, data) {
    try {
      return await Article.findByIdAndUpdate(id, data, { new: true });
    } catch (err) {
      throw new Error("Error updating article: " + err.message);
    }
  }

  async deleteArticle(id) {
    try {
      return await Article.findByIdAndDelete(id);
    } catch (err) {
      throw new Error("Error deleting article: " + err.message);
    }
  }
}

module.exports = ArticlesDB;
