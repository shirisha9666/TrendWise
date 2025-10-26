import mongoose from "mongoose";

const articleSchema = new mongoose.Schema(
  {
    // 🔹 Basic info
    title: { type: String, required: true },
    slug: { type: String,  unique: true },

    // 🔹 SEO + Meta info (as ChatGPT generates)
    meta: {
      title: { type: String }, // for OG tags
      description: { type: String },
      keywords: [String],
      ogTitle: { type: String },
      ogDescription: { type: String },
      ogImage: { type: String },
    },

    // 🔹 Media (trending images/videos)
    media: {
      images: [{ type: String }], // scraped from Google Images
      videos: [
        {
          title: { type: String },
          url: { type: String },
        },
      ],
      articles:[]
    },

    // 🔹 Generated content from ChatGPT
    content: { type: String,  }, // full formatted article
    source: { type: String, default: "auto" }, // 'auto' or 'manual'

    // 🔹 Engagement
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],

    // 🔹 For Admin dashboard tracking
    createdByBot: { type: Boolean, default: true },
  },
  { timestamps: true } // automatically adds createdAt & updatedAt
);

export const Article = mongoose.model("Article", articleSchema);
