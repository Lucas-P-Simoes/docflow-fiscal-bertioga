import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";


const siteRoot = new URL("../", import.meta.url);
const workspaceRoot = new URL("../../", import.meta.url);


test("routes the site to the DocFlow interface", async () => {
  const [page, layout] = await Promise.all([
    readFile(new URL("app/page.tsx", siteRoot), "utf8"),
    readFile(new URL("app/layout.tsx", siteRoot), "utf8"),
  ]);

  assert.match(page, /redirect\("\/docflow\/index\.html"\)/);
  assert.match(layout, /DocFlow — Assistente de Documentos/);
  assert.doesNotMatch(page, /codex-preview|_sites-preview|SkeletonPreview/);
});


test("ships the standard letterhead template and fills it in place", async () => {
  const [app, template] = await Promise.all([
    readFile(new URL("public/docflow/app.js", siteRoot), "utf8"),
    readFile(
      new URL("public/docflow/templates/MODELO_FOLHA_COTA.docx", siteRoot),
    ),
  ]);

  assert.ok(template.byteLength > 50_000);
  assert.match(app, /COTA_TEMPLATE_URL\s*=\s*"templates\/MODELO_FOLHA_COTA\.docx"/);
  assert.match(app, /patchDocument/);
  assert.match(app, /keepOriginalStyles:\s*true/);
  assert.match(app, /line_\$\{String\(index \+ 1\)\.padStart\(2, "0"\)\}/);
  assert.doesNotMatch(app, /Montando a folha pautada/);
});


test("keeps the local and hosted DocFlow assets synchronized", async () => {
  const [localApp, hostedApp, localTemplate, hostedTemplate] = await Promise.all([
    readFile(new URL("web/app.js", workspaceRoot)),
    readFile(new URL("site/public/docflow/app.js", workspaceRoot)),
    readFile(new URL("web/templates/MODELO_FOLHA_COTA.docx", workspaceRoot)),
    readFile(
      new URL(
        "site/public/docflow/templates/MODELO_FOLHA_COTA.docx",
        workspaceRoot,
      ),
    ),
  ]);

  assert.deepEqual(hostedApp, localApp);
  assert.deepEqual(hostedTemplate, localTemplate);
});
