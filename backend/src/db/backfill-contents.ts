import pool from "./index";
import { extractTextFromUrl } from "../services/content-extractor";

async function backfill() {
  console.log("Backfilling resource contents...\n");

  // Get all PDF/document resources that don't have content yet
  const result = await pool.query(
    `SELECT r.id, r.title, r.type, r.url
     FROM resources r
     LEFT JOIN resource_contents rc ON rc.resource_id = r.id
     WHERE r.type IN ('pdf', 'document')
       AND rc.resource_id IS NULL
     ORDER BY r.created_at DESC`,
  );

  const resources = result.rows;
  console.log(`Found ${resources.length} resources to process.\n`);

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < resources.length; i++) {
    const r = resources[i];
    const label = `[${i + 1}/${resources.length}] "${r.title}" (${r.type})`;

    try {
      process.stdout.write(`${label} — downloading... `);

      const extracted = await extractTextFromUrl(r.url, r.type);

      if (!extracted || !extracted.content) {
        console.log(`no extractable content — skipped`);
        skipped++;
        continue;
      }

      await pool.query(
        `INSERT INTO resource_contents (resource_id, content)
         VALUES ($1, $2)
         ON CONFLICT (resource_id) DO UPDATE
           SET content = EXCLUDED.content, extracted_at = NOW()`,
        [r.id, extracted.content],
      );

      const preview = extracted.content.slice(0, 60).replace(/\n/g, " ");
      console.log(`✓ ${extracted.method} — "${preview}..."`);
      success++;
    } catch (err) {
      console.log(`✗ failed — ${err instanceof Error ? err.message : err}`);
      failed++;
    }
  }

  console.log(`\nDone. ${success} succeeded, ${failed} failed, ${skipped} skipped.`);
  await pool.end();
}

backfill().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
