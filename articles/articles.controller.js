import { generateSEOContentHUGGINGFACE } from "../config/OpenAI.js";
import {

  scrapeTrendingContent,
} from "../config/scraper.js";
import { Article } from "./articles.model.js";
import slugify from "slugify";
export const createAticles = async (req, res) => {
  try {
    const trendingResults = await scrapeTrendingContent();
    console.log('Trending results:', trendingResults);

    const seoArticles = await generateSEOContentHUGGINGFACE(trendingResults);
    console.log('SEO articles:', seoArticles);

    const savedArticles = [];
for (const item of seoArticles) {
  if (!item.originalTitle) continue;

  const slug = slugify(item.originalTitle, { lower: true, strict: true }) + '-' + Date.now();

  const newArticle = new Article({
    title: item.originalTitle,
    slug,
    meta: {
      title: item.originalTitle,
      description: item.topic || '',
      keywords: item.topic ? item.topic.split(' ') : [],
      ogTitle: item.originalTitle,
      ogDescription: item.topic || '',
      ogImage: item.images.length ? item.images[0] : item.mainImage || null,
    },
    media: {
      images: item.images && item.images.length ? item.images : item.mainImage ? [item.mainImage] : [],
      videos: item.link ? [{ title: item.topic, url: item.link, thumbnail: item.mainImage }] : [],
      articles: item.link ? [{ title: item.originalTitle, url: item.link, thumbnail: item.mainImage }] : [],
    },
    content: item.content,
    source: 'auto',
    createdByBot: true,
  });

  const saved = await newArticle.save();
  savedArticles.push(saved);
}

    return res.status(200).json({
      message: 'Articles saved successfully',
      savedCount: savedArticles,
    });
  } catch (err) {
    console.error('createArticles error:', err);
    return res.status(500).json({ message: err.message });
  }
}


export const updateArticles = async (req, res) => {
  const { id } = req.params;

  try {
    const existingArticle = await Article.findById(id);
    if (!existingArticle) {
      return res.status(404).json({ message: "Article not found" });
    }

    const trendingResults = await scrapeTrendingContent();
    const seoArticles = await generateSEOContentHUGGINGFACE(trendingResults);

    if (!seoArticles.length) {
      return res.status(404).json({ message: "No SEO articles generated" });
    }

    // Pick first SEO article (or use flexible matching)
    const seoArticleToUpdate = seoArticles[0];

    const slug = slugify(seoArticleToUpdate.originalTitle, { lower: true, strict: true }) + "-" + Date.now();
    const updateData = {
      title: seoArticleToUpdate.originalTitle,
      slug,
      meta: {
        title: seoArticleToUpdate.originalTitle,
        description: seoArticleToUpdate.topic || "",
        keywords: seoArticleToUpdate.topic ? seoArticleToUpdate.topic.split(" ") : [],
        ogTitle: seoArticleToUpdate.originalTitle,
        ogDescription: seoArticleToUpdate.topic || "",
        ogImage: seoArticleToUpdate.images?.[0] || seoArticleToUpdate.mainImage || "https://example.com/default-image.jpg",
      },
      media: {
        images: seoArticleToUpdate.images?.length ? seoArticleToUpdate.images : seoArticleToUpdate.mainImage ? [seoArticleToUpdate.mainImage] : [],
        videos: seoArticleToUpdate.link ? [{ title: seoArticleToUpdate.topic, url: seoArticleToUpdate.link, thumbnail: seoArticleToUpdate.mainImage }] : [],
        articles: seoArticleToUpdate.link ? [{ title: seoArticleToUpdate.originalTitle, url: seoArticleToUpdate.link, thumbnail: seoArticleToUpdate.mainImage }] : [],
      },
      content: seoArticleToUpdate.content,
      source: "auto",
      createdByBot: true,
    };

    const updated = await Article.findByIdAndUpdate(id, updateData, { new: true });

    return res.status(200).json({
      message: "Article updated successfully",
      updated,
    });
  } catch (error) {
    console.error("❌ updateArticles error:", error);
    return res.status(500).json({ message: error.message });
  }
};




export const DeletAticles = async (req, res) => {
  const { id } = req.params; // article id
  try {
    const article = await Article.findById(id);
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }
    await Article.findByIdAndDelete(id);
    return res.status(200).json({ message: "Article Deleted Succssefully" });
  } catch (error) {
    console.log("createAticles", error);
    return res.status(500).json({ message: error.message });
  }
};

export const ViewAticles = async (req, res) => {
  const { id } = req.params; // article id
  try {
    const article = await Article.findById(id);
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    return res
      .status(200)
      .json({ message: "Article fetched Succssefully", article });
  } catch (error) {
    console.log("createAticles", error);
    return res.status(500).json({ message: error.message });
  }
};

export const getAllArticles = async (req, res) => {
  try {
    const article = await Article.find().sort({ createdAt: -1 });
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    return res
      .status(200)
      .json({ message: "Article fetched Succssefully", article });
  } catch (error) {
    console.log("createAticles", error);
    return res.status(500).json({ message: error.message });
  }
};
