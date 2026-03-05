/**
 * PassMark CPU CSV → JSON converter
 *
 * PassMark provides a CPU list CSV export from:
 *   https://www.cpubenchmark.net/CPU_mega_page.html
 *
 * Download that CSV manually as `passmark-cpus.csv` into scripts/data-sources/,
 * then run:
 *
 *   node scripts/scrapers/passmark-cpu-scraper.js
 *
 * This will produce `scripts/data-sources/passmark-cpus.json` which is
 * consumed by the seed-database.ts script.
 */

const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const INPUT_PATH = path.join(
  __dirname,
  "../data-sources/passmark-cpus.csv"
);
const OUTPUT_PATH = path.join(
  __dirname,
  "../data-sources/passmark-cpus.json"
);

function parsePrice(value) {
  if (!value) return null;
  const cleaned = String(value)
    .replace("$", "")
    .replace(/,/g, "")
    .trim();
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : null;
}

function scrape() {
  if (!fs.existsSync(INPUT_PATH)) {
    console.error(
      `Input CSV not found at ${INPUT_PATH}. Download PassMark CPU CSV and place it there first.`
    );
    process.exit(1);
  }

  const cpus = [];

  fs.createReadStream(INPUT_PATH)
    .pipe(csv())
    .on("data", (row) => {
      // Column names may change; adjust to your CSV as needed.
      const name = row["CPU Name"] || row["Name"] || "";
      if (!name) return;

      const cpu = {
        id: row["Id"] || row["id"] || undefined,
        name,
        score: row["CPU Mark"] ? parseInt(row["CPU Mark"], 10) : undefined,
        rank: row["Rank"] ? parseInt(row["Rank"], 10) : undefined,
        value: row["CPU Value"] ? parseFloat(row["CPU Value"]) : undefined,
        price: parsePrice(row["Price (USD)"]),
        cores: row["Cores"] || row["# of Cores"] || undefined,
        threads: row["Threads"] || row["# of Threads"] || undefined,
        base_clock: row["Base Clock"] || undefined,
        turbo_clock: row["Turbo Clock"] || undefined,
        tdp: row["TDP"] || undefined,
        socket: row["Socket"] || undefined,
        release_date: row["Release Date"] || undefined,
        has_igpu: row["Integrated GPU"] || row["iGPU"] || undefined,
        max_memory_speed: row["Max Memory Speed"] || undefined,
        pcie_version: row["PCIe Version"] || undefined,
      };

      cpus.push(cpu);
    })
    .on("end", () => {
      fs.writeFileSync(OUTPUT_PATH, JSON.stringify(cpus, null, 2), "utf8");
      console.log(`✅ Processed ${cpus.length} CPUs → ${OUTPUT_PATH}`);
    })
    .on("error", (err) => {
      console.error("Error reading CSV:", err);
      process.exit(1);
    });
}

scrape();

