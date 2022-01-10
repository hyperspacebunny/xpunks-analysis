const fs = require("fs");
const xpunkFloors = require("./data/xpunks/latest.json");
const punkTraitFloor = require("./data/punks/latest.json");

async function main() {
  const xpunkTraitFloor = Object.keys(xpunkFloors).reduce(
    (data, trait) => ({
      ...data,
      [trait]: Math.min(...xpunkFloors[trait]),
    }),
    {}
  );

  const xpunkFloorDelta = Object.keys(xpunkFloors).reduce(
    (data, trait) => ({
      ...data,
      [trait]: xpunkFloors[trait][1] - xpunkFloors[trait][0],
    }),
    {}
  );

  const punkCollectionFloor = Math.min(
    ...Object.values(punkTraitFloor).filter((p) => !!p)
  );
  const xpunkCollectionFloor = Math.min(
    ...Object.values(xpunkTraitFloor).filter((p) => !!p)
  );

  const rows = [];

  for (const trait of Object.keys(xpunkTraitFloor)) {
    if (!punkTraitFloor[trait] || !xpunkTraitFloor[trait]) continue;
    const punkMultiplier = punkTraitFloor[trait] / punkCollectionFloor;
    const xpunkMultiplier = xpunkTraitFloor[trait] / xpunkCollectionFloor;
    const expectedFloor = punkMultiplier * xpunkCollectionFloor;

    rows.push([
      trait,
      punkTraitFloor[trait].toFixed(4),
      punkMultiplier.toFixed(4),
      xpunkTraitFloor[trait].toFixed(4),
      xpunkMultiplier.toFixed(4),
      expectedFloor.toFixed(4),
      (xpunkTraitFloor[trait] - expectedFloor).toFixed(4),
      xpunkFloorDelta[trait].toFixed(4),
    ]);
  }

  const template = fs.readFileSync("./docs/index.template.html").toString();
  fs.writeFileSync(
    `./docs/index.html`,
    template.replace("{{data}}", JSON.stringify(rows))
  );
}

main();
