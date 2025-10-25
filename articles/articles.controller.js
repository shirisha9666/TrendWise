import { generateSEOContentHUGGINGFACE } from "../config/OpenAI.js";
import {
  scrapeGoogle,
  scrapeGoogleNewsRSS,
  scrapeTrendingContent,
} from "../config/scraper.js";
import { Article } from "./articles.model.js";

import slugify from "slugify";

export const createAticles = async (req, res) => {
  const { contentType } = req.body;

  try {
    let trendingResults = await scrapeTrendingContent(contentType);
    const seoArticles = await generateSEOContentHUGGINGFACE(trendingResults);
    const savedArticles = [];

    for (const item of seoArticles) {
      // ✅ define slug first
      const slug = slugify(item.originalTitle, { lower: true, strict: true });

      // ✅ check if article with same slug already exists
      const existing = await Article.findOne({ slug });
      if (existing) {
        console.log("⏩ Skipping duplicate article:", slug);
        continue;
      }

      // ✅ create article only if not exists
      const newArticle = new Article({
        title: item.originalTitle,
        slug,
        meta: {
          title: item.originalTitle,
          description: item.topic,
          keywords: item.topic.split(" "),
          ogTitle: item.originalTitle,
          ogDescription: item.topic,
          ogImage: "https://example.com/default-image.jpg",
        },
        media: {
          videos: [
            {
              title: item.topic,
              url: item.link,
            },
          ],
        },
        content: item.content,
        source: "auto",
        createdByBot: true,
      });

      const saved = await newArticle.save();
      savedArticles.push(saved);
    }

    console.log("✅ Articles saved successfully:", savedArticles.length);
    return res.status(200).json({
      message: "Articles saved successfully",
      savedCount: savedArticles.length,
    });
  } catch (error) {
    console.log("createAticles", error);
    return res.status(500).json({ message: error.message });
  }
};

// export const UpdateAticles = async (req, res) => {
//   const { id } = req.parmas; // article id
//   const { contentType } = req.body;

//   try {
//     let trendingResults = await scrapeTrendingContent(contentType);
//     const seoArticles = await generateSEOContentHUGGINGFACE(trendingResults);
//     const savedArticles = [];
//     for (const item of seoArticles) {
//       const newArticle = new Article({
//         title: item.originalTitle,
//         slug: slugify(item.originalTitle, { lower: true, strict: true }),
//         meta: {
//           title: item.originalTitle,
//           description: item.topic,
//           keywords: item.topic.split(" "),
//           ogTitle: item.originalTitle,
//           ogDescription: item.topic,
//           ogImage: "https://example.com/default-image.jpg",
//         },
//         media: {
//           videos: [
//             {
//               title: item.topic,
//               url: item.link,
//             },
//           ],
//         },
//         content: item.content,
//         source: "auto",
//         createdByBot: true,
//       });

//       const saved = await Article.save();
//       savedArticles.push(saved);
//     }

//     console.log("✅ Articles saved successfully:", savedArticles.length);
//     return savedArticles;
//     // return res.status(200).json(seoArticles)
//   } catch (error) {
//     console.log("createAticles", error);
//     return res.status(500).json({ message: error.message });
//   }
// };

export const updateArticles = async (req, res) => {
  const { id } = req.params; // ✅ fixed typo
  const { contentType } = req.body;

  try {
    // Fetch trending content
    const trendingResults = await scrapeTrendingContent(contentType);
    const seoArticles = await generateSEOContentHUGGINGFACE(trendingResults);

    const updatedArticles = [];

    for (const item of seoArticles) {
      // Update existing article by ID
      const updated = await Article.findByIdAndUpdate(
        id,
        {
          title: item.originalTitle,
          slug: slugify(item.originalTitle, { lower: true, strict: true }),
          meta: {
            title: item.originalTitle,
            description: item.topic,
            keywords: item.topic.split(" "),
            ogTitle: item.originalTitle,
            ogDescription: item.topic,
            ogImage: "https://example.com/default-image.jpg",
          },
          media: {
            videos: [
              {
                title: item.topic,
                url: item.link,
              },
            ],
          },
          content: item.content,
          source: "auto",
          createdByBot: true,
        },
        { new: true } // return updated document
      );

      if (updated) updatedArticles.push(updated);
    }

    console.log("✅ Articles updated successfully:", updatedArticles.length);
    return res.status(200).json({
      message: "Articles updated successfully",
      updatedArticles,
    });
  } catch (error) {
    console.error("updateArticles error:", error);
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
