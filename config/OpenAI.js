import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const generateSEOContent = async (topic) => {
  const prompt = `
Generate a full-length SEO-friendly article on the topic: "${topic}".

`;
  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: "You are an expert SEO content writer" },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });
  const output = response.choices[0].message.content;
  try {
    return JSON.parse(output);
  } catch {
    return {
      title: topic,
      slug: topic.replace(/\s+/g, "-").toLowerCase(),
      meta: "",
      media: "",
      content: output,
    };
  }
};
