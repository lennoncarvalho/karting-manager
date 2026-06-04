#!/usr/bin/env node
/**
 * Best-effort migration helper for Step 7 of `.junie/plans/app-v2-resume.md`.
 *
 * Inputs:
 *   - ../frontend/src/translations/{en,pt-BR}.json (v1 i18n source of truth)
 *   - src/locale/messages.xlf                     (Angular-extracted template)
 *
 * Outputs:
 *   - src/locale/messages.en.xlf    (English targets)
 *   - src/locale/messages.pt-BR.xlf (Portuguese targets — pass-through where
 *                                   source already is the desired string)
 *
 * Strategy
 * --------
 * Angular auto-generates `id="<hash>"` per `<source>` text. v1 uses dotted
 * JSON keys ("nav.rankings"). To bridge them we build a flat lookup from
 * leaf VALUE → translated value, then resolve each `<trans-unit>`'s
 * `<source>` against the pt-BR JSON values.
 *
 * Limitations
 * -----------
 * - Library `<trans-unit>`s (ngb.*) are skipped (ng-bootstrap ships its
 *   own locale bundles).
 * - Strings present in templates but absent from v1 JSON remain
 *   untranslated; `i18nMissingTranslation: "warning"` will surface them.
 * - Multi-line / interpolated `<source>` blocks are matched on the
 *   collapsed-whitespace form.
 *
 * Usage: `npm run i18n:sync`
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, '..');
const REPO = resolve(ROOT, '..');

const SRC_XLF = resolve(ROOT, 'src/locale/messages.xlf');
const EN_OUT = resolve(ROOT, 'src/locale/messages.en.xlf');
const PT_OUT = resolve(ROOT, 'src/locale/messages.pt-BR.xlf');
const V1_EN = resolve(REPO, 'frontend/src/translations/en.json');
const V1_PT = resolve(REPO, 'frontend/src/translations/pt-BR.json');

/** Walk a nested object and yield every leaf string with its dotted path. */
function* leaves(obj, prefix = '') {
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') yield* leaves(v, path);
    else if (typeof v === 'string') yield [path, v];
  }
}

const collapse = (s) => s.replace(/\s+/g, ' ').trim();

async function main() {
  const xlfRaw = await readFile(SRC_XLF, 'utf8');
  const enJson = JSON.parse(await readFile(V1_EN, 'utf8'));
  const ptJson = JSON.parse(await readFile(V1_PT, 'utf8'));

  // NB: Although angular.json declares sourceLocale "pt-BR", in this
  // codebase the literal template strings are written in English (the
  // declaration only controls which file the `extract-i18n` builder
  // labels as the source). So the lookup is collapsed-English → pt-BR.
  const enToPt = new Map();
  const ptByPath = new Map(Array.from(leaves(ptJson)));
  for (const [path, enVal] of leaves(enJson)) {
    const ptVal = ptByPath.get(path);
    if (ptVal != null) enToPt.set(collapse(enVal), ptVal);
  }

  const unitRe = /<trans-unit\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/trans-unit>/g;
  const srcRe = /<source>([\s\S]*?)<\/source>/;

  let enUnits = '';
  let ptUnits = '';
  let mapped = 0;
  let unmapped = 0;
  let skipped = 0;

  for (const m of xlfRaw.matchAll(unitRe)) {
    const id = m[1];
    const block = m[2];
    if (id.startsWith('ngb.')) {
      skipped++;
      continue;
    }
    const srcMatch = block.match(srcRe);
    if (!srcMatch) continue;
    const sourceRaw = srcMatch[1];
    const sourceCollapsed = collapse(sourceRaw);

    const ptTarget = enToPt.get(sourceCollapsed);
    // English locale: source is already English, target = pass-through.
    const enBlock = block.replace(
      srcRe,
      `<source>${sourceRaw}</source>\n        <target>${sourceRaw}</target>`,
    );
    const ptBlock = ptTarget
      ? block.replace(srcRe, `<source>${sourceRaw}</source>\n        <target>${ptTarget}</target>`)
      : block;

    if (ptTarget) mapped++;
    else unmapped++;

    enUnits += `      <trans-unit id="${id}" datatype="html">${enBlock}</trans-unit>\n`;
    ptUnits += `      <trans-unit id="${id}" datatype="html">${ptBlock}</trans-unit>\n`;
  }

  const enXlf = `<?xml version="1.0" encoding="UTF-8" ?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file source-language="pt-BR" target-language="en" datatype="plaintext" original="ng2.template">
    <body>
${enUnits}    </body>
  </file>
</xliff>
`;
  const ptXlf = `<?xml version="1.0" encoding="UTF-8" ?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file source-language="pt-BR" target-language="pt-BR" datatype="plaintext" original="ng2.template">
    <body>
${ptUnits}    </body>
  </file>
</xliff>
`;

  await writeFile(EN_OUT, enXlf, 'utf8');
  await writeFile(PT_OUT, ptXlf, 'utf8');

  console.log(`i18n:sync done — mapped=${mapped} unmapped=${unmapped} skipped(ngb.*)=${skipped}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
