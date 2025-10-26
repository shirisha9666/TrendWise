import puppeteer from "puppeteer";
import fetch from "node-fetch";
import xml2js from "xml2js";
import googleTrends from "google-trends-api"; // or your existing module


async function getTrendingTopics() {
  try {
    const trends = await googleTrends.realTimeTrends({ geo: "US", category: "all" });
    return trends.storySummaries.trendingStories.slice(0, 10).map((s) => s.title);
  } catch (err) {
    console.error("Error fetching trends:", err.message);
    return ["Breaking News", "Latest Updates"];
  }
}
export const scrapeTrendingContent = async (contentType = "articles") => {
  const trendingTopics = await getTrendingTopics();
  const results = [];
  let browser = null;

  if (contentType === "articles" || contentType === "images" || contentType === "videos") {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }

  for (const topic of trendingTopics) {
    try {
      if (contentType === "articles") {
        const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(topic)}&hl=en-US&gl=US&ceid=US:en`;
        const xml = await (await fetch(rssUrl)).text();
        const parsed = await new xml2js.Parser().parseStringPromise(xml);
        const items = parsed.rss.channel[0].item;

        if (items && items.length > 0) {
          const firstItem = items[0];
          const link = firstItem.link[0];
          const snippet = firstItem.description[0];

          // --- scrape images from the article page
          const { mainImage, images } = await fetchArticleImages(link, browser);

          results.push({
            topic,
            title: firstItem.title[0],
            link,
            content: snippet,
            mainImage,
            images,
            pubDate: firstItem.pubDate[0],
            source: firstItem.source ? firstItem.source[0]._ : null,
          });
        }
      }

      // images/videos logic stays same...
    } catch (err) {
      console.error("Error fetching content for", topic, err.message);
    }
  }

  if (browser) await browser.close();
  return results;
};

// helper to scrape images from any page
async function fetchArticleImages(url, browser) {
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    const mainImage = await page.evaluate(() => {
      const og = document.querySelector('meta[property="og:image"]');
      return og ? og.content : document.querySelector("img")?.src || null;
    });

    const images = await page.evaluate(() =>
      Array.from(document.querySelectorAll("img"))
        .map((img) => img.src)
        .filter((src) => src && src.startsWith("http"))
    );

    await page.close();
    return { mainImage, images };
  } catch (err) {
    console.error("Error fetching images from article:", err.message);
    return { mainImage: null, images: [] };
  }
}



