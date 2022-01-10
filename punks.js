const fs = require("fs");
const puppeteer = require("puppeteer");

async function scrapePunkFloors() {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
    args: ["--window-size=1920,1080", "--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.goto("https://www.larvalabs.com/cryptopunks/attributes");

  const rows = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("table tbody tr")).map((row) =>
      Array.from(row.querySelectorAll("td")).map((cell) => cell.innerText)
    );
  });

  const traits = {};

  for (const row of rows) {
    const [name, _, __, ___, floor] = row;
    const multiplier = floor.match(/K/) ? 1000 : 1;
    const floorPrice =
      parseFloat(floor.replace("K", "").replace("Ξ", "")) * multiplier;

    if (floorPrice) {
      traits[name === "1 Attributes" ? "1 Attribute" : name] = floorPrice;
    }
  }

  await browser.close();

  return traits;
}

async function main() {
  console.log("Scraping Cryptopunk floors...");
  const floors = await scrapePunkFloors();

  const dataPath = "./data/punks";

  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true });
  }

  const filename = `${dataPath}/${new Date()
    .toISOString()
    .replace(/:/g, "-")}.json`;

  console.log(`Writing ${filename}`);
  fs.writeFileSync(filename, JSON.stringify(floors, null, 2));
  console.log(`Writing ${dataPath}/latest.json`);
  fs.writeFileSync(`${dataPath}/latest.json`, JSON.stringify(floors, null, 2));
}

main();
