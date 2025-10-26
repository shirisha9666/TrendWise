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
};



 const generateSlug = (text) => {
  // if (!text) text = "untitled";
  let slug = text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");

  return slug;
};


// export const createAticles = async (req, res) => {
//   const { contentType } = req.body;

//   try {
//     const trendingResults = await scrapeTrendingContent(contentType);
//     const seoArticles = await generateSEOContentHUGGINGFACE(trendingResults);
//     const savedArticles = [];

//     for (const item of seoArticles) {
//       let slug = generateSlug(item.originalTitle);
//       let counter = 1;

//       // Avoid duplicate slugs
//       while (await Article.findOne({ slug })) {
//         slug = `${generateSlug(item.originalTitle)}-${counter}`;
//         counter++;
//       }

//       const newArticle = new Article({
//         title: item.originalTitle,
//         slug,
//         meta: {
//           title: item.originalTitle,
//           description: item.topic,
//           keywords: item.topic ? item.topic.split(" ") : [],
//           ogTitle: item.originalTitle,
//           ogDescription: item.topic,
//           ogImage: item.mainImage || "https://source.unsplash.com/600x400/?news",
//         },
//         media: {
//           images: item.images && item.images.length ? item.images : [],
//           videos: [],
//           articles: item.link
//             ? [{ title: item.originalTitle, url: item.link, thumbnail: item.mainImage || (item.images[0] || null) }]
//             : [],
//         },
//         content: item.content || "",
//         source: "auto",
//         createdByBot: true,
//       });

//       const saved = await newArticle.save();
//       savedArticles.push(saved);
//     }

//     return res.status(200).json({
//       message: "Articles saved successfully",
//       savedCount: savedArticles,
//     });
//   } catch (error) {
//     console.error("createArticles", error);
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
