import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import googleTrends from "google-trends-api";
import fetch from "node-fetch";
import xml2js from "xml2js";

puppeteer.use(StealthPlugin());

export const scrapeGoogle = async (query, contentType = "articles") => {
  const browser = await puppeteer.launch({
    headless: false, // set to true in production
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36"
  );
  await page.setViewport({ width: 1366, height: 768 });
  await page.setExtraHTTPHeaders({ "accept-language": "en-US,en;q=0.9" });

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  let url;
  let result = null;

  if (contentType === "articles") {
    url = `https://www.google.com/search?q=${encodeURIComponent(
      query
    )}&tbm=nws`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 0 });

    // Scroll to load content
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await wait(1000);
    }

    // Try robust selectors
    const dbsr = await page.$("div.dbsr");
    if (dbsr) {
      result = await page.evaluate((el) => {
        const title = el.querySelector("h3")?.innerText || "";
        const link = el.querySelector("a")?.href || "";
        const snippet = el.querySelector(".VwiC3b")?.innerText || "";
        return { title, link, snippet };
      }, dbsr);
    } else {
      // fallback generic selector
      result = await page.evaluate(() => {
        const h3 = document.querySelector("a h3");
        if (!h3) return null;
        const link = h3.closest("a")?.href || "";
        const title = h3.innerText;
        return { title, link };
      });
    }

    if (!result) throw new Error("No news results found");
  }

  if (contentType === "images") {
    url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(
      query
    )}`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 0 });

    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await wait(1000);
    }

    const imgElement = await page.$("img");
    if (imgElement) {
      const src = await page.evaluate(
        (img) => img.src || img.getAttribute("data-src"),
        imgElement
      );
      result = { image: src };
    } else {
      throw new Error("No images found");
    }
  }

  if (contentType === "videos") {
    url = `https://www.google.com/search?q=${encodeURIComponent(
      query
    )}&tbm=vid`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 0 });

    for (let i = 0; i < 2; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await wait(1000);
    }

    const videoElement = await page.$("div.g");
    if (videoElement) {
      result = await page.evaluate((el) => {
        const title = el.querySelector("h3")?.innerText || "";
        const link = el.querySelector("a")?.href || "";
        return { title, link };
      }, videoElement);
    } else {
      throw new Error("No videos found");
    }
  }

  await browser.close();
  return result;
};

export const scrapeGoogleNewsRSS = async (query, contentType = "articles") => {
  if (contentType === "articles") {
    try {
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(
        query
      )}&hl=en-US&gl=US&ceid=US:en`;

      const response = await fetch(rssUrl);
      const xml = await response.text();

      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(xml);

      const items = result.rss.channel[0].item;
      if (!items || items.length === 0)
        throw new Error("No news results found");

      const firstItem = items[0];
      return {
        title: firstItem.title[0],
        link: firstItem.link[0],
        snippet: firstItem.description[0],
        pubDate: firstItem.pubDate[0],
        source: firstItem["source"] ? firstItem["source"][0]._ : null,
      };
    } catch (err) {
      throw new Error(err.message);
    }
  }

  // IMAGES or VIDEOS via Puppeteer
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36"
  );
  await page.setViewport({ width: 1366, height: 768 });
  await page.setExtraHTTPHeaders({ "accept-language": "en-US,en;q=0.9" });

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let result = null;
  let url;
  if (contentType === "images") {
    url = `https://duckduckgo.com/?q=${encodeURIComponent(
      query
    )}&iax=images&ia=images`;
    await page.goto(url, { waitUntil: "networkidle2", timeout: 0 });

    await page.waitForSelector("img", { timeout: 10000 });

    const result = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll("img"));
      for (let img of imgs) {
        const src = img.src || img.getAttribute("data-src");
        const about = img.alt || "Image related to the search topic"; // ✅ descriptive text
        if (src && src.startsWith("http") && !src.includes("base64")) {
          return { about, image: src };
        }
      }
      return null;
    });

    if (!result) throw new Error("No images found");
    await browser.close();
    return result;
  }

  if (contentType === "videos") {
    url = `https://www.youtube.com/results?search_query=${encodeURIComponent(
      query
    )}`;
    await page.goto(url, { waitUntil: "networkidle2" });

    // Wait for first video thumbnail
    await page.waitForSelector("ytd-video-renderer", { timeout: 10000 });

    const videoElement = await page.$("ytd-video-renderer");
    if (videoElement) {
      result = await page.evaluate((el) => {
        const title = el.querySelector("#video-title")?.innerText || "";
        const link =
          "https://www.youtube.com" +
          (el.querySelector("#video-title")?.getAttribute("href") || "");
        return { title, link };
      }, videoElement);
    } else {
      throw new Error("No videos found");
    }
  }

  await browser.close();
  return result;
};

export const scrapeTrendingContent = async (contentType = "articles") => {
  const trendingTopics = await getTrendingTopics();
  const results = [];

  let browser = null;
  if (contentType === "images" || contentType === "videos") {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }

  for (const topic of trendingTopics) {
    console.log(`Fetching ${contentType} for: ${topic}`);

    try {
      if (contentType === "articles") {
        const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(
          topic
        )}&hl=en-US&gl=US&ceid=US:en`;
        const xml = await (await fetch(rssUrl)).text();
        const parsed = await new xml2js.Parser().parseStringPromise(xml);
        const items = parsed.rss.channel[0].item;
        if (items && items.length > 0) {
          const firstItem = items[0];
          results.push({
            topic,
            title: firstItem.title[0],
            link: firstItem.link[0],
            snippet: firstItem.description[0],
            pubDate: firstItem.pubDate[0],
            source: firstItem.source ? firstItem.source[0]._ : null,
          });
        }
      }

      if (contentType === "images") {
        const page = await browser.newPage();
        await page.goto(
          `https://duckduckgo.com/?q=${encodeURIComponent(
            topic
          )}&iax=images&ia=images`,
          { waitUntil: "networkidle2" }
        );
        await page.waitForSelector("img", { timeout: 10000 });

        const imgResult = await page.evaluate(() => {
          const imgs = Array.from(document.querySelectorAll("img"));
          for (let img of imgs) {
            const src = img.src || img.getAttribute("data-src");
            const title = img.alt || "Untitled image";
            if (src && src.startsWith("http") && !src.includes("base64")) {
              return { title, image: src };
            }
          }
          return null;
        });
        if (imgResult) results.push({ topic, ...imgResult });
        await page.close();
      }

      if (contentType === "videos") {
        const page = await browser.newPage();
        await page.goto(
          `https://www.youtube.com/results?search_query=${encodeURIComponent(topic)}`,
          { waitUntil: "networkidle2" }
        );
        await page.waitForSelector("ytd-video-renderer", { timeout: 10000 });

        const vidResult = await page.evaluate(() => {
          const el = document.querySelector("ytd-video-renderer");
          if (!el) return null;
          const title = el.querySelector("#video-title")?.innerText || "";
          const link =
            "https://www.youtube.com" +
            (el.querySelector("#video-title")?.getAttribute("href") || "");
          return { title, link };
        });
        if (vidResult) results.push({ topic, ...vidResult });
        await page.close();
      }
    } catch (err) {
      console.error("Error fetching content for", topic, err.message);
    }
  }

  if (browser) await browser.close();
  return results;
};

async function getTrendingTopics() {
  try {
    const trends = await googleTrends.realTimeTrends({ geo: "US", category: "all" });
    return trends.storySummaries.trendingStories.slice(0, 10).map((s) => s.title);
  } catch (err) {
    console.error("Error fetching trends:", err.message);
    return ["Breaking News", "Latest Updates"];
  }
}



// async function getTrendingTopics() {
//   try {
//     // const data = await googleTrends.dailyTrends({ geo: "US" });
//     const data = await googleTrends.dailyTrends({ geo: "US" });
//     const parsed = JSON.parse(data);

//     return parsed.default.trendingSearchesDays[0].trendingSearches.map(
//       (t) => t.title.query
//     );
//   } catch (err) {
//     console.error("Error fetching Google trends:", err.message);
//     return ["Breaking News", "Latest Updates"]; // fallback topics
//   }
// }
