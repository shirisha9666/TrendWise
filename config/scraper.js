import puppeteer from "puppeteer";
import fetch from "node-fetch";
import xml2js from "xml2js";
import googleTrends from 'google-trends-api';
import os from "os"

const isWindows = os.platform() === "win32";
const isLinux = os.platform() === "linux";
const isRender = isLinux && (process.env.RENDER === "true" || process.env.CHROME_PATH);

console.log("🖥️ Platform:", os.platform());
console.log("🌍 RENDER:", process.env.RENDER);
console.log("🧩 CHROME_PATH:", process.env.CHROME_PATH);

const browser = await puppeteer.launch({
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
  ],
  executablePath: isRender
    ? process.env.CHROME_PATH || "/usr/bin/google-chrome-stable"
    : undefined, // ✅ use bundled Chromium for local (Windows/Mac)
});

console.log("✅ Puppeteer launched successfully!");










export const fetchArticleMedia = async (url, browser) => {
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });

    // Get main image (og:image)
    const mainImage = await page.$eval(
      'meta[property="og:image"]',
      el => el.content,
    ).catch(() => null);

    // Get all images from the page
    const images = await page.$$eval('img', imgs =>
      imgs.map(img => img.src).filter(src => src && src.startsWith('http'))
    );

    // Optionally get videos (YouTube, Vimeo, etc.)
    const videos = await page.$$eval('video, iframe[src*="youtube"], iframe[src*="vimeo"]', v =>
      v.map(el => ({
        url: el.src || el.getAttribute('data-src'),
        thumbnail: null
      }))
    );

    await page.close();
    return { mainImage, images, videos };
  } catch (err) {
    console.error("fetchArticleMedia error:", err.message);
    return {
      mainImage: null,
      images: [],
      videos: []
    };
  }
};


// 2️⃣ Scrape images for a topic (Google search fallback)

export const fetchImagesForTopic = async (topic, browser) => {
  try {
    const page = await browser.newPage();
    await page.goto(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(topic)}`, { waitUntil: 'domcontentloaded' });

    const images = await page.$$eval('img', imgs =>
      imgs.map(img => img.src).filter(src => src && src.startsWith('http'))
    );

    await page.close();

    return {
      mainImage: images[0] || null,
      images
    };
  } catch (err) {
    console.error("fetchImagesForTopic error:", err.message);
    return { mainImage: null, images: [] };
  }
};



async function getTrendingTopicsRSS() {
  try {
    const rssUrl = `https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en`;
    const xml = await (await fetch(rssUrl)).text();
    const parsed = await new xml2js.Parser().parseStringPromise(xml);
    const items = parsed.rss.channel[0].item.slice(0, 10); // top 10
    return items.map(item => ({
      title: item.title[0],
      link: item.link[0],
      snippet: item.description[0],
      pubDate: item.pubDate[0],
      source: item.source ? item.source[0]._ : null,
    }));
  } catch (err) {
    console.error('Error fetching RSS:', err.message);
    return [];
  }
}


async function fetchArticleImages(url, browser) {
  if (!browser) return { mainImage: null, images: [] };
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    const images = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs
        .map(img => img.src)
        .filter(src => src && src.startsWith('http') && !src.includes('base64'));
    });
    await page.close();
    return {
      mainImage: images.length ? images[0] : null,
      images,
    };
  } catch (err) {
    console.error('Error scraping images:', err.message);
    return { mainImage: null, images: [] };
  }
}

export const fetchVideosForTopic = async (topic, browser) => {
  try {
    const page = await browser.newPage();
    await page.goto(`https://www.youtube.com/results?search_query=${encodeURIComponent(topic)}`, { waitUntil: 'domcontentloaded' });

    const videos = await page.$$eval('ytd-video-renderer a#video-title', links =>
      links.slice(0, 5).map(link => ({
        url: 'https://www.youtube.com' + link.getAttribute('href'),
        thumbnail: null,
      }))
    );

    await page.close();
    return videos;
  } catch (err) {
    console.error("fetchVideosForTopic error:", err.message);
    return [];
  }
};




async function getTrendingTopics() {
  try {
    const res = await fetch("https://trends.google.com/trends/trendingsearches/daily/rss?geo=US");
    const xml = await res.text();
    const parsed = await xml2js.parseStringPromise(xml);

    const items = parsed?.rss?.channel?.[0]?.item;
    if (!Array.isArray(items)) {
      throw new Error("Invalid RSS structure");
    }

    return items.slice(0, 10).map(i => i.title?.[0] || "Unknown Topic");
  } catch (err) {
    console.error("Error fetching trends:", err.message);
    return ["Breaking News", "Latest Updates"];
  }
}




export const scrapeTrendingContent = async (contentType = "articles", limit = 5) => {
  const trendingTopics = await getTrendingTopics();
  const results = [];

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  // only 3 topics for speed
  for (const topic of trendingTopics.slice(0, 3)) {
    try {
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(topic)}&hl=en-US&gl=US&ceid=US:en`;
      const xml = await (await fetch(rssUrl)).text();
      const parsed = await new xml2js.Parser().parseStringPromise(xml);
      const items = (parsed.rss.channel[0].item || []).slice(0, limit);

      for (const item of items) {
        const link = item.link?.[0];
        const snippet = item.description?.[0] || "";

        if (!link) continue;

        const page = await browser.newPage();
        try {
          await page.goto(link, { waitUntil: "networkidle2", timeout: 25000 });

          const media = await page.evaluate(() => {
            const getMeta = (name) =>
              document.querySelector(`meta[property='${name}']`)?.content ||
              document.querySelector(`meta[name='${name}']`)?.content ||
              null;

            const allImgs = Array.from(document.querySelectorAll("img"))
              .map((img) => img.src)
              .filter(
                (src) =>
                  src &&
                  src.startsWith("http") &&
                  !src.includes("googleusercontent.com") &&
                  !src.includes("gstatic.com")
              );

            const ogImage = getMeta("og:image") || getMeta("twitter:image") || allImgs[0] || null;
            const videos = Array.from(document.querySelectorAll("video source"))
              .map((v) => v.src)
              .filter((src) => src && src.startsWith("http"))
              .slice(0, 3);

            return {
              mainImage: ogImage,
              images: allImgs.slice(0, 5),
              videos,
            };
          });

          results.push({
            topic,
            title: item.title?.[0] || topic,
            link,
            content: snippet,
            mainImage: media.mainImage,
            images: media.images.length ? media.images : [media.mainImage],
            videos: media.videos,
            pubDate: item.pubDate?.[0],
            source: item.source ? item.source[0]._ : "Google News",
          });
        } catch (err) {
          console.warn(`⚠️ Failed to fetch images for: ${link}`, err.message);
          results.push({
            topic,
            title: item.title?.[0] || topic,
            link,
            content: snippet,
            mainImage: "https://example.com/default-image.jpg",
            images: ["https://example.com/default-image.jpg"],
            videos: [],
            pubDate: item.pubDate?.[0],
            source: "fallback",
          });
        } finally {
          await page.close();
        }
      }
    } catch (err) {
      console.error("Error scraping topic:", topic, err.message);
      results.push({
        topic,
        title: topic,
        link: null,
        content: `Trending topic: ${topic}`,
        mainImage: "https://example.com/default-image.jpg",
        images: ["https://example.com/default-image.jpg"],
        videos: [],
        pubDate: new Date().toISOString(),
        source: "auto",
      });
    }
  }

  await browser.close();
  return results;
};