const fs = require("fs");
const ProgressBar = require("progress");
const puppeteer = require("puppeteer");
const traitTypes = require("./trait-types.json");

async function scrapeXPunkFloors() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--window-size=1920,1080", "--no-sandbox"],
    userDataDir: "profiles/xpunks",
  });
  const punks = require("./data/punks/latest.json");
  const floors = fs.existsSync("./data/xpunks/pending.json")
    ? require("./data/xpunks/pending.json")
    : {};
  const traitValues = Object.keys(punks);

  const bar = new ProgressBar(":bar :current/:total :trait - :prices", {
    total: traitValues.length,
  });

  for (const trait of traitValues) {
    if (Object.keys(floors).includes(trait)) {
      bar.tick({ trait, prices: floors[trait] });
      continue;
    }

    const traitType = traitTypes[trait];
    const link = `https://opensea.io/collection/expansionpunks?search[sortAscending]=true&search[sortBy]=PRICE&search[stringTraits][0][name]=${encodeURIComponent(
      traitType
    )}&search[stringTraits][0][values][0]=${encodeURIComponent(
      trait
    )}&search[toggles][0]=BUY_NOW`;

    const page = await browser.newPage();
    await page.goto(link, { timeout: 60000 });
    await Promise.race([
      page
        .waitForSelector(".AssetsSearchView--assets", { timeout: 60000 })
        .catch(),
      page
        .waitForSelector(".AssetSearchView--no-results", { timeout: 60000 })
        .catch(),
    ]);

    const prices = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll(".AssetCardFooter--price .Price--amount")
      )
        .map((cell) => cell.innerText.replace(/,/, ""))
        .map(parseFloat)
        .sort((a, b) => a - b)
    );

    if (prices.length) {
      floors[trait] = prices;
    }

    fs.writeFileSync(
      "./data/xpunks/pending.json",
      JSON.stringify(floors, null, 2)
    );

    bar.tick({ trait, prices });
  }

  await browser.close();

  fs.rmSync("./data/xpunks/pending.json");
  return floors;
}

async function main() {
  console.log("Scraping Expansion Punk floors...");
  const floors = await scrapeXPunkFloors();

  const dataPath = "./data/xpunks";

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
