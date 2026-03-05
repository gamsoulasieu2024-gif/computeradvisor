# PC Components Data Sources Guide

## 🎯 Quick Start

### Option 1: Use Pre-Compiled Database (Recommended for MVP)

Download our curated database snapshot:

```bash
# Download from GitHub releases
wget https://github.com/your-repo/pc-components-db/releases/latest/download/components-db.zip
unzip components-db.zip -d data/catalog/
```

**Includes:**
- 2,000+ GPUs (all NVIDIA RTX 20/30/40, AMD RX 6000/7000)
- 1,500+ CPUs (Intel 10th-14th gen, AMD Ryzen 3000-7000)
- 300+ motherboards (popular models)
- 200+ cases (major brands)
- 150+ PSUs (80+ certified)
- 200+ coolers (air and AIO)
- 300+ RAM kits
- 400+ storage devices

### Option 2: Scrape Fresh Data

#### GPU Data (TechPowerUp)

```bash
npm install cheerio axios

# Run scraper
node scripts/scrapers/techpowerup-gpu-scraper.js
```

```javascript
// scripts/scrapers/techpowerup-gpu-scraper.js
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function scrapeGpuDatabase() {
  const gpus = [];

  // TechPowerUp has paginated GPU list
  for (let page = 1; page <= 50; page++) {
    const url = `https://www.techpowerup.com/gpu-specs/?mfgr=NVIDIA&mobile=No&released=2020-2026&sort=name&page=${page}`;

    try {
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);

      $('table.processors tr').each((i, row) => {
        const cells = $(row).find('td');
        if (cells.length < 8) return;

        gpus.push({
          name: $(cells[0]).text().trim(),
          chip: $(cells[1]).text().trim(),
          release_date: $(cells[2]).text().trim(),
          bus: $(cells[3]).text().trim(),
          memory: $(cells[4]).text().trim(),
          gpu_clock: $(cells[5]).text().trim(),
          memory_clock: $(cells[6]).text().trim(),
          shaders: $(cells[7]).text().trim()
        });
      });

      console.log(`Scraped page ${page}, total GPUs: ${gpus.length}`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
    } catch (err) {
      console.error(`Error on page ${page}:`, err.message);
    }
  }

  fs.writeFileSync('techpowerup-gpus-raw.json', JSON.stringify(gpus, null, 2));
  console.log(`✅ Scraped ${gpus.length} GPUs`);
}

scrapeGpuDatabase();
```

#### CPU Data (CPU-World or PassMark)

```javascript
// scripts/scrapers/passmark-cpu-scraper.js
// PassMark provides CSV export at:
// https://www.cpubenchmark.net/CPU_mega_page.html

const csv = require('csv-parser');
const fs = require('fs');

const cpus = [];

fs.createReadStream('passmark-cpus.csv')
  .pipe(csv())
  .on('data', (row) => {
    cpus.push({
      name: row['CPU Name'],
      score: parseInt(row['CPU Mark']),
      rank: parseInt(row['Rank']),
      value: parseFloat(row['CPU Value']),
      price: parseFloat(row['Price (USD)'].replace('$', '').replace(',', ''))
    });
  })
  .on('end', () => {
    fs.writeFileSync('passmark-cpus.json', JSON.stringify(cpus, null, 2));
    console.log(`✅ Processed ${cpus.length} CPUs`);
  });
```

### Option 3: Community Contribution System

Create `/app/admin/submit-component/page.tsx`:

```typescript
// Allow users to submit missing components
// Admin reviews and approves
// Auto-validates against schema
```

## 📦 Recommended Starting Datasets

### Minimal Viable Database (50-100 each)

- Top 50 GPUs: RTX 40/30 series, RX 7000/6000 series
- Top 50 CPUs: Intel 12th-14th gen, AMD Ryzen 5000-7000
- Top 30 motherboards per socket
- Top 30 popular cases
- Top 20 PSUs (550W-1000W range)
- Top 20 coolers (popular air + AIO)

### Full Production Database (1000+ each)

- All modern GPUs (2020+)
- All modern CPUs (2019+)
- 200+ motherboards
- 100+ cases
- 100+ PSUs
- 100+ coolers

## 🔄 Data Update Strategy

### Weekly Updates

- Price updates (if using API)
- New releases (manual check)

### Monthly Updates

- Full re-scrape of GPU/CPU databases
- Review community submissions

### Quarterly Updates

- Deprecate old/EOL components
- Add new generation releases

## 💰 Pricing Data

### Free Options:

1. **CamelCamelCamel** - Historical Amazon prices  
2. **Manual curation** - Update prices monthly  
3. **Community pricing** - Users submit prices they see

### Paid Options:

1. **Amazon Product Advertising API** - Requires approval  
2. **Newegg API** - Developer program  
3. **Rainforest API** - $50/month for Amazon data

### Recommended for MVP:

Manual pricing updates every 2 weeks for top 500 components.

## 📊 Data Quality Checklist

Before going live, ensure:

- [ ] At least 50 GPUs covering $200-$2000 range
- [ ] At least 50 CPUs covering budget to enthusiast
- [ ] At least 30 motherboards per major socket (AM5, LGA1700, AM4)
- [ ] At least 30 cases across form factors (ITX, mATX, ATX)
- [ ] At least 20 PSUs across wattages (550W, 650W, 750W, 850W+)
- [ ] All components have tier ratings (1-10)
- [ ] All components have at least estimated pricing
- [ ] All GPUs have: VRAM, TDP, length, power connectors
- [ ] All CPUs have: cores, threads, TDP, socket
- [ ] All motherboards have: socket, RAM slots, M.2 slots, headers

