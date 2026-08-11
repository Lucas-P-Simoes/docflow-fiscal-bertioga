import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";


const siteRoot = new URL("../", import.meta.url);


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
  assert.match(app, /COTA_TEXT_STYLE\s*=\s*\{\s*font:\s*"Arial",\s*size:\s*24/);
  assert.match(app, /COTA_HEADER_FIELD_STYLE\s*=\s*\{[^}]*bold:\s*true,\s*italics:\s*false/);
  assert.match(app, /const processNumber = String\(c\.processNumber \|\| ""\)\.trim\(\)/);
  assert.doesNotMatch(app, /c\.sheetNumber \? ` \$\{c\.sheetNumber\}`/);
  assert.match(app, /Arial 12 e alinhamento justificado/);
  assert.match(app, /useAI:\s*false/);
  assert.match(app, /contextImage:\s*null/);
  assert.match(app, /data-bind="cota\.useAI"/);
  assert.match(app, /renderSingleImageUpload\("cota-context"/);
  assert.match(app, /imageDataUrl = await optimizeImage\(c\.contextImage\.file\)/);
  assert.match(app, /imageDataUrl,/);
  assert.match(app, /state\.cota\.finalText = state\.cota\.baseText\.trim\(\)/);
  assert.match(app, /A imagem será enviada somente para a análise e não aparecerá no Word/);
  assert.doesNotMatch(app, /panelHeader\("Assistência opcional da IA"/);
  assert.ok(app.indexOf('panelHeader("Texto-base"') < app.indexOf('data-bind="cota.useAI"'));
  assert.ok(app.indexOf('data-bind="cota.useAI"') < app.indexOf('data-bind="cota.baseText"'));
  assert.match(app, /line_\$\{String\(index \+ 1\)\.padStart\(2, "0"\)\}/);
  assert.doesNotMatch(app, /Montando a folha pautada/);
});


test("keeps the editable and deployable DocFlow assets synchronized", async () => {
  const [sourceApp, builtApp, sourceTemplate, builtTemplate] = await Promise.all([
    readFile(new URL("public/docflow/app.js", siteRoot)),
    readFile(new URL("dist/client/docflow/app.js", siteRoot)),
    readFile(new URL("public/docflow/templates/MODELO_FOLHA_COTA.docx", siteRoot)),
    readFile(
      new URL("dist/client/docflow/templates/MODELO_FOLHA_COTA.docx", siteRoot),
    ),
  ]);

  assert.deepEqual(builtApp, sourceApp);
  assert.deepEqual(builtTemplate, sourceTemplate);
});


test("requires an account and keeps each encrypted API key in D1", async () => {
  const [app, page, worker, authWorker, schema, hosting, migration] = await Promise.all([
    readFile(new URL("public/docflow/app.js", siteRoot), "utf8"),
    readFile(new URL("public/docflow/index.html", siteRoot), "utf8"),
    readFile(new URL("worker/index.ts", siteRoot), "utf8"),
    readFile(new URL("worker/auth.ts", siteRoot), "utf8"),
    readFile(new URL("db/schema.ts", siteRoot), "utf8"),
    readFile(new URL(".openai/hosting.json", siteRoot), "utf8"),
    readFile(new URL("drizzle/0000_vengeful_zodiak.sql", siteRoot), "utf8"),
  ]);

  assert.match(page, /id="authGate"/);
  assert.match(page, /id="loginForm"/);
  assert.match(page, /id="registerForm"/);
  assert.match(page, /id="siteShell"[^>]*is-hidden[^>]*hidden/);
  assert.match(page, /criptografada antes de ser salva no D1/);
  assert.match(app, /bootstrapAuth\(\)/);
  assert.match(app, /fetch\("\/api\/auth\/session"|apiRequest\("\/api\/auth\/session"/);
  assert.match(app, /apiRequest\("\/api\/account\/api-key"/);
  assert.match(app, /fetch\("\/api\/openai"/);
  assert.doesNotMatch(app, /fetch\("https:\/\/api\.openai\.com/);
  assert.doesNotMatch(app, /docflow-api-key|sessionStorage/);
  assert.doesNotMatch(app, /Authorization:\s*`Bearer/);
  assert.match(app, /maxOutputTokens:\s*256/);
  assert.match(app, /reasoningEffort:\s*"none"/);
  assert.match(page, /chave será criptografada no servidor/);
  assert.match(worker, /url\.pathname === "\/api\/auth\/register"/);
  assert.match(worker, /url\.pathname === "\/api\/auth\/login"/);
  assert.match(worker, /url\.pathname === "\/api\/account\/api-key"/);
  assert.match(worker, /url\.pathname === "\/api\/openai"/);
  assert.match(worker, /https:\/\/api\.openai\.com\/v1\/responses/);
  assert.match(worker, /openAICredentialForUser/);
  assert.match(worker, /"Cache-Control": "no-store"/);
  assert.match(authWorker, /PBKDF2/);
  assert.match(authWorker, /PASSWORD_ITERATIONS = 600_000/);
  assert.match(authWorker, /timingSafeEqual/);
  assert.match(authWorker, /AES-GCM/);
  assert.match(authWorker, /HttpOnly; SameSite=Lax/);
  assert.match(schema, /openaiCredentials/);
  assert.match(schema, /sessions/);
  assert.match(hosting, /"d1": "DB"/);
  assert.match(migration, /CREATE TABLE `users`/);
  assert.match(migration, /CREATE TABLE `openai_credentials`/);
});


test("labels the cota as ready and all other document cards as in development", async () => {
  const [app, styles] = await Promise.all([
    readFile(new URL("public/docflow/app.js", siteRoot), "utf8"),
    readFile(new URL("public/docflow/styles.css", siteRoot), "utf8"),
  ]);

  assert.equal((app.match(/card-status is-ready/g) || []).length, 1);
  assert.equal((app.match(/card-status is-development/g) || []).length, 5);
  assert.match(app, /card-status is-ready">Pronto<\/span>[\s\S]*?<h3>Folha de cota<\/h3>/);
  assert.match(styles, /\.card-status\s*\{/);
  assert.match(styles, /\.card-status\.is-ready\s*\{/);
});
