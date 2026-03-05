/**
 * TechPowerUp GPU scraper
 *
 * Scrapes GPU metadata from https://www.techpowerup.com/gpu-specs/
 * and writes a raw JSON file that can be normalized by the seed script.
 *
 * Usage:
 *   node scripts/scrapers/techpowerup-gpu-scraper.js
 *
 * Notes:
 * - This is an unofficial scraper; respect TechPowerUp's terms of use.
 * - Add delays between requests to avoid hammering their servers.
 * - By default this targets modern desktop GPUs (configurable below).
 */

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");

// Basic configuration – tweak as needed
const OUTPUT_PATH = path.join(
  __dirname,
  "../data-sources/techpowerup-gpus.json"
);

// Example filter: only 2020+ desktop GPUs, any vendor
// You can further parameterize by brand, mobile=No, etc.
const BASE_URL =
  "https://www.techpowerup.com/gpu-specs/?mobile=No&released=2020-2026&sort=name&page=";

// Safety limit; adjust upward once you're confident the scraper is stable
const MAX_PAGES = 10;
const REQUEST_DELAY_MS = 1000;

async function scrapePage(page) {
  const url = `${BASE_URL}${page}`;
  console.log(`Fetching page ${page}: ${url}`);

  const { data } = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; PCBuildAdvisorBot/0.1; +https://example.com)",
    },
  });

  const $ = cheerio.load(data);
  const rows = $("table.processors tr");

  const gpus = [];

  rows.each((i, row) => {
    const cells = $(row).find("td");
    if (cells.length < 8) return;

    const name = $(cells[0]).text().trim();
    if (!name) return;

    const chip = $(cells[1]).text().trim();
    const releaseDate = $(cells[2]).text().trim();
    const bus = $(cells[3]).text().trim();
    const memory = $(cells[4]).text().trim();
    const gpuClock = $(cells[5]).text().trim();
    const memClock = $(cells[6]).text().trim();
    const shaders = $(cells[7]).text().trim();

    gpus.push({
      id: `${page}-${i}`,
      name,
      gpu_chip: chip,
      release_date: releaseDate,
      bus,
      memory_size: memory,
      core_clock: gpuClock,
      memory_clock: memClock,
      shaders,
      // Placeholders for additional fields that might be scraped later:
      tdp: null,
      power_connectors: null,
      pcie_version: null,
      length: null,
      slot_width: null,
      outputs: null,
    });
  });

  console.log(`  -> found ${gpus.length} GPUs on page ${page}`);
  return gpus;
}

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scrapeGpuDatabase() {
  const allGpus = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    try {
      const pageGpus = await scrapePage(page);
      if (pageGpus.length === 0) {
        console.log(`No results on page ${page}, stopping.`);
        break;
      }
      allGpus.push(...pageGpus);
      console.log(`Total GPUs so far: ${allGpus.length}`);
      await delay(REQUEST_DELAY_MS);
    } catch (err) {
      console.error(`Error scraping page ${page}:`, err.message);
      break;
    }
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allGpus, null, 2), "utf8");
  console.log(`\n✅ Scraped ${allGpus.length} GPUs → ${OUTPUT_PATH}`);
}

scrapeGpuDatabase().catch((err) => {
  console.error("Scrape failed:", err);
  process.exit(1);
});

