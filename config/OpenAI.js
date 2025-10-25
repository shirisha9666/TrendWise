import dotenv from "dotenv";
dotenv.config();
import fetch from "node-fetch";

const HF_KEY = process.env.HUGGINGFACE_API_KEY;
const huggingFaceModelEndpoint = "https://api-inference.huggingface.co/models/sshleifer/distilbart-cnn-12-6";




/**
 * Generate SEO-friendly articles dynamically using Hugging Face model
 * @param {Array} results - Array of objects: [{ title, topic, link }]
 * @returns {Array} seoArticles - Array with generated content
 */
export const generateSEOContentHUGGINGFACE = async (results) => {
  const seoArticles = [];

  for (const item of results) {
    // Create dynamic prompt based on title
//     const prompt = `
// Write a article SEO-friendly article for the following title:
// "${item.title}"
//   `;
  const prompt =`
Write a article SEO-friendly article for the following title:
"${item.title}"



`

    try {
      const response = await fetch(huggingFaceModelEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          options: { wait_for_model: true },
        }),
      });

      let content = "";

      try {
        const data = await response.json();

        // Handle different response formats
        if (Array.isArray(data)) {
          content =
            data[0]?.generated_text ||
            data[0]?.summary_text ||
            JSON.stringify(data[0]);
        } else if (data.generated_text) {
          content = data.generated_text;
        } else if (data.summary_text) {
          content = data.summary_text;
        } else {
          content = JSON.stringify(data);
        }
      } catch (err) {
        const text = await response.text();
        console.error("Failed to parse JSON, raw response:", text);
        content = "Error: could not parse response from Hugging Face API";
      }

      seoArticles.push({
        originalTitle: item.title,
        content,
        topic: item.topic,
        link: item.link,
      });
    } catch (error) {
      console.error("Hugging Face API request failed:", error);
      seoArticles.push({
        originalTitle: item.title,
        content: `Error: ${error.message}`,
        topic: item.topic,
        link: item.link,
      });
    }
  }

  return seoArticles;
};

