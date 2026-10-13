import { createRequire } from "node:module";
import {
  mkdir,
  copyFile,
  readFile,
  writeFile,
  readdir,
} from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createHash } from "node:crypto";
import { gzipSync, gunzipSync } from "node:zlib";
const require = createRequire(import.meta.url);
const output = resolve("client/public/report-assets");
await mkdir(output, { recursive: true });
const tess = dirname(require.resolve("tesseract.js/package.json"));
const core = dirname(
  createRequire(require.resolve("tesseract.js")).resolve(
    "tesseract.js-core/package.json"
  )
);
await copyFile(
  resolve(tess, "dist/worker.min.js"),
  resolve(output, "ocr-worker.min.js")
);
for (const file of await readdir(core))
  if (/lstm\.wasm(?:\.js)?$/.test(file))
    await copyFile(resolve(core, file), resolve(output, file));
const pdf = dirname(require.resolve("pdfjs-dist/package.json"));
for (const folder of ["cmaps", "standard_fonts", "wasm"]) {
  const destination = resolve(output, folder);
  await mkdir(destination, { recursive: true });
  for (const file of await readdir(resolve(pdf, folder)))
    await copyFile(resolve(pdf, folder, file), resolve(destination, file));
}
const revision = "87416418657359cb625c412a48b6e1d6d41c29bd";
const hashes = {
  chi_sim: "a5fcb6f0db1e1d6d8522f39db4e848f05984669172e584e8d76b6b3141e1f730",
  eng: "7d4322bd2a7749724879683fc3912cb542f19906c83bcc1a52132556427170b2",
};
for (const [language, hash] of Object.entries(hashes)) {
  const cache = resolve(output, language + ".traineddata.gz");
  try {
    if (
      createHash("sha256")
        .update(gunzipSync(await readFile(cache)))
        .digest("hex") === hash
    )
      continue;
  } catch {}
  const response = await fetch(
    `https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/${revision}/${language}.traineddata`,
    { signal: AbortSignal.timeout(30_000) }
  );
  if (!response.ok)
    throw new Error("OCR language download failed: " + language);
  const data = Buffer.from(await response.arrayBuffer());
  if (createHash("sha256").update(data).digest("hex") !== hash)
    throw new Error("OCR language checksum failed: " + language);
  await writeFile(cache, gzipSync(data));
}
console.log(
  "Report assets ready: PDF fonts, OCR worker/core, simplified Chinese + English."
);
