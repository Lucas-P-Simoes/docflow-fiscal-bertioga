import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";


const siteRoot = new URL("../", import.meta.url);


test("serves the DocFlow interface at the site root without exposing its asset path", async () => {
  const [page, layout, worker, docflowPage, docflowApp, manifest] = await Promise.all([
    readFile(new URL("app/page.tsx", siteRoot), "utf8"),
    readFile(new URL("app/layout.tsx", siteRoot), "utf8"),
    readFile(new URL("worker/index.ts", siteRoot), "utf8"),
    readFile(new URL("public/docflow/index.html", siteRoot), "utf8"),
    readFile(new URL("public/docflow/app.js", siteRoot), "utf8"),
    readFile(new URL("public/docflow/manifest.webmanifest", siteRoot), "utf8"),
  ]);

  assert.match(worker, /url\.pathname === "\/" \|\| url\.pathname === "\/index\.html"/);
  assert.match(worker, /new URL\("\/docflow\/", request\.url\)/);
  assert.match(worker, /return await serveDocFlowAtRoot\(request, env\)/);
  assert.match(docflowPage, /<base href="\/docflow\/" \/>/);
  assert.match(docflowApp, /LEGACY_DOCFLOW_PATHS/);
  assert.match(docflowApp, /window\.history\.replaceState/);
  assert.match(manifest, /"start_url": "\/"/);
  assert.match(manifest, /"scope": "\/"/);
  assert.match(layout, /Fiscal Bertioga — Assistente de Documentos/);
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
  assert.match(app, /COTA_STEPS\s*=\s*\["Conteúdo", "Revisão", "Assinatura e download"\]/);
  assert.match(app, /COTA_TOTAL_LINES\s*=\s*32/);
  assert.match(app, /COTA_PARAGRAPH_GAP_LINES\s*=\s*1/);
  assert.match(app, /COTA_SIGNATURE_GAP_LINES\s*=\s*1/);
  assert.match(app, /MAX_COTA_LINES\s*=\s*COTA_TOTAL_LINES - COTA_SIGNATURE_GAP_LINES - COTA_SIGNATURE_BLOCK_LINES/);
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
  assert.doesNotMatch(app, /pageHeading\("Etapa 1", "Escreva a ideia principal"/);
  assert.ok(app.indexOf('panelHeader("Texto-base"') < app.indexOf('data-bind="cota.useAI"'));
  assert.ok(app.indexOf('data-bind="cota.useAI"') < app.indexOf('data-bind="cota.baseText"'));
  assert.match(app, /function cotaTextLayout\(text\)/);
  assert.match(app, /measureCotaLine\(candidate\) <= COTA_LINE_WIDTH_PX/);
  assert.match(app, /kind:\s*"paragraph-gap"/);
  assert.match(app, /function justifyCotaLine\(text\)/);
  assert.match(app, /COTA_JUSTIFIED_WIDTH_PX - measureCotaLine\(naturalText\)/);
  assert.match(app, /const alignment = isSignature \? AlignmentType\.CENTER : AlignmentType\.LEFT/);
  assert.doesNotMatch(app, /AlignmentType\.DISTRIBUTE/);
  assert.match(app, /type:\s*PatchType\.DOCUMENT/);
  assert.match(app, /data-signature-target="cota"/);
  assert.match(app, /state\.cota\.signerProfileId = profile\.id/);
  assert.match(app, /text:\s*c\.signer\.trim\(\)/);
  assert.match(app, /bold:\s*line\.kind === "signature-name"/);
  assert.match(app, /italics:\s*line\.kind === "signature-role"/);
  assert.match(app, /line_\$\{String\(index \+ 1\)\.padStart\(2, "0"\)\}/);
  assert.doesNotMatch(app, /Montando a folha pautada/);
});


test("highlights missing document fields and clears the error after correction", async () => {
  const [app, styles] = await Promise.all([
    readFile(new URL("public/docflow/app.js", siteRoot), "utf8"),
    readFile(new URL("public/docflow/styles.css", siteRoot), "utf8"),
  ]);

  assert.match(app, /function showFieldValidationMessage/);
  assert.match(app, /classList\.add\("is-validation-error"\)/);
  assert.match(app, /setAttribute\("aria-invalid", "true"\)/);
  assert.match(app, /function clearValidationHighlight\(target\)/);
  assert.match(app, /validationFields:\s*\[\]/);
  assert.match(app, /function applyValidationHighlights/);
  assert.match(app, /requestAnimationFrame\(applyValidationHighlights\)/);
  assert.match(app, /document\.addEventListener\("input",[\s\S]*?clearValidationHighlight\(target\)/);
  assert.match(app, /document\.addEventListener\("change",[\s\S]*?clearValidationHighlight\(target\)/);
  assert.match(app, /!r\.neighborhood\.trim\(\) && '\[data-bind="report\.neighborhood"\]'/);
  assert.match(app, /!r\.map && '\[data-upload-kind="report-map"\]'/);
  assert.match(app, /!reportStreets\(\)\.length && '\[data-bind="report\.streets"\]'/);
  assert.match(app, /!c\.signatories\.length \|\| invalidSignatory/);
  assert.match(app, /\[data-signature-target="cota"\]/);
  assert.match(styles, /input\.is-validation-error/);
  assert.match(styles, /border-color:\s*#c23a32/);
  assert.match(styles, /\.upload-box\.is-validation-error/);
  assert.match(styles, /\.field:has\(\.is-validation-error\)/);
});


test("provides a safe rich-text editor for correspondence content and keeps formatting in Word", async () => {
  const [app, styles] = await Promise.all([
    readFile(new URL("public/docflow/app.js", siteRoot), "utf8"),
    readFile(new URL("public/docflow/styles.css", siteRoot), "utf8"),
  ]);

  assert.match(app, /function renderRichTextEditor/);
  assert.match(app, /contenteditable="true"/);
  assert.match(app, /data-rich-command="undo"/);
  assert.match(app, /data-rich-command="redo"/);
  assert.match(app, /data-rich-command="bold"/);
  assert.match(app, /data-rich-command="italic"/);
  assert.match(app, /data-rich-command="underline"/);
  assert.match(app, /data-rich-command="justifyFull"/);
  assert.match(app, /data-rich-command="insertUnorderedList"/);
  assert.match(app, /data-rich-command="insertOrderedList"/);
  assert.match(app, /data-rich-command="insert-table"/);
  assert.match(app, /data-rich-command="removeFormat"/);
  assert.match(app, /function sanitizeRichTextHtml/);
  assert.match(app, /RICH_TEXT_BLOCKED_TAGS/);
  assert.match(app, /state\.correspondence\.finalHtml = state\.correspondence\.baseHtml/);
  assert.match(app, /c\.finalHtml = ""/);
  assert.match(app, /function richCorrespondenceDocumentBlocks/);
  assert.match(app, /richCorrespondenceDocumentBlocks\(c\.finalHtml, c\.finalText, \{ official: true \}\)/);
  assert.match(app, /underline: \{\}/);
  assert.match(app, /listPrefix: node\.tagName === "OL"/);
  assert.match(app, /richTextTable\(node, \{ official \}\)/);
  assert.match(app, /spacing: \{ before: 0, after: 360, line: 360 \}/);
  assert.match(app, /\[data-rich-editor="correspondence\.base"\]/);
  assert.match(app, /\[data-rich-editor="correspondence\.final"\]/);
  assert.match(styles, /\.rich-editor-toolbar/);
  assert.match(styles, /\.rich-editor-shell:has\(\.rich-editor\.is-validation-error\)/);
  assert.match(styles, /\.rich-editor table/);
});


test("keeps the editable and deployable DocFlow assets synchronized", async () => {
  const [
    sourceApp,
    builtApp,
    sourceTemplate,
    builtTemplate,
    sourceTechnicalOpinionTemplate,
    builtTechnicalOpinionTemplate,
    sourceNotificationTemplate,
    builtNotificationTemplate,
    sourceMemorandumTemplate,
    builtMemorandumTemplate,
    sourceLoginImage,
    builtLoginImage,
    sourceDrainageSystemImage,
    builtDrainageSystemImage,
    sourceDrainageBlockImage,
    builtDrainageBlockImage,
  ] = await Promise.all([
    readFile(new URL("public/docflow/app.js", siteRoot)),
    readFile(new URL("dist/client/docflow/app.js", siteRoot)),
    readFile(new URL("public/docflow/templates/MODELO_FOLHA_COTA.docx", siteRoot)),
    readFile(
      new URL("dist/client/docflow/templates/MODELO_FOLHA_COTA.docx", siteRoot),
    ),
    readFile(new URL("public/docflow/templates/MODELO_PARECER_TECNICO.docx", siteRoot)),
    readFile(
      new URL("dist/client/docflow/templates/MODELO_PARECER_TECNICO.docx", siteRoot),
    ),
    readFile(new URL("public/docflow/templates/MODELO_NOTIFICACAO.docx", siteRoot)),
    readFile(
      new URL("dist/client/docflow/templates/MODELO_NOTIFICACAO.docx", siteRoot),
    ),
    readFile(new URL("public/docflow/templates/MODELO_MEMORANDO.docx", siteRoot)),
    readFile(
      new URL("dist/client/docflow/templates/MODELO_MEMORANDO.docx", siteRoot),
    ),
    readFile(new URL("public/docflow/assets/bertioga-praia-login.png", siteRoot)),
    readFile(new URL("dist/client/docflow/assets/bertioga-praia-login.png", siteRoot)),
    readFile(new URL("public/docflow/images/drenagem-sistema-v1.png", siteRoot)),
    readFile(new URL("dist/client/docflow/images/drenagem-sistema-v1.png", siteRoot)),
    readFile(new URL("public/docflow/images/drenagem-bloco-v1.png", siteRoot)),
    readFile(new URL("dist/client/docflow/images/drenagem-bloco-v1.png", siteRoot)),
  ]);

  assert.deepEqual(builtApp, sourceApp);
  assert.deepEqual(builtTemplate, sourceTemplate);
  assert.deepEqual(builtTechnicalOpinionTemplate, sourceTechnicalOpinionTemplate);
  assert.deepEqual(builtNotificationTemplate, sourceNotificationTemplate);
  assert.deepEqual(builtMemorandumTemplate, sourceMemorandumTemplate);
  assert.deepEqual(builtLoginImage, sourceLoginImage);
  assert.deepEqual(builtDrainageSystemImage, sourceDrainageSystemImage);
  assert.deepEqual(builtDrainageBlockImage, sourceDrainageBlockImage);
});


test("requires an account and keeps registrations and encrypted API keys in D1", async () => {
  const [app, page, worker, authWorker, dbAuth, schema, hosting, migration] = await Promise.all([
    readFile(new URL("public/docflow/app.js", siteRoot), "utf8"),
    readFile(new URL("public/docflow/index.html", siteRoot), "utf8"),
    readFile(new URL("worker/index.ts", siteRoot), "utf8"),
    readFile(new URL("worker/auth.ts", siteRoot), "utf8"),
    readFile(new URL("db/auth.ts", siteRoot), "utf8"),
    readFile(new URL("db/schema.ts", siteRoot), "utf8"),
    readFile(new URL(".openai/hosting.json", siteRoot), "utf8"),
    readFile(new URL("drizzle/0000_vengeful_zodiak.sql", siteRoot), "utf8"),
  ]);

  assert.match(page, /id="authGate"/);
  assert.doesNotMatch(page, /class="auth-brand"/);
  assert.match(page, /id="loginForm"/);
  assert.match(page, /id="registerForm"/);
  assert.match(page, /id="siteShell"[^>]*is-hidden[^>]*hidden/);
  assert.match(page, /criptografada antes de ser salva no D1/);
  assert.match(
    await readFile(new URL("public/docflow/styles.css", siteRoot), "utf8"),
    /url\("assets\/bertioga-praia-login\.png"\)/,
  );
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
  assert.match(worker, /CLOUDFLARE_BACKEND_ORIGIN/);
  assert.match(worker, /proxyApiToPersonalCloudflare/);
  assert.match(worker, /docflow-fiscal-bertioga\.lucaspsimoes22\.workers\.dev/);
  assert.match(worker, /https:\/\/api\.openai\.com\/v1\/responses/);
  assert.match(worker, /openAICredentialForUser/);
  assert.match(worker, /"Cache-Control": "no-store"/);
  assert.match(authWorker, /PBKDF2/);
  assert.match(authWorker, /PASSWORD_ITERATIONS = 100_000/);
  assert.match(authWorker, /timingSafeEqual/);
  assert.match(authWorker, /AES-GCM/);
  assert.match(authWorker, /HttpOnly; SameSite=Lax/);
  assert.match(authWorker, /createPendingUser\(env\.DB/);
  assert.match(dbAuth, /INSERT INTO users/);
  assert.match(dbAuth, /INSERT INTO sessions/);
  assert.match(dbAuth, /await db\.batch\(\[/);
  assert.match(schema, /openaiCredentials/);
  assert.match(schema, /export const users/);
  assert.match(schema, /sessions/);
  assert.match(hosting, /"d1": "DB"/);
  assert.match(migration, /CREATE TABLE `users`/);
  assert.match(migration, /CREATE TABLE `openai_credentials`/);
});


test("keeps new registrations pending and limits user approval to the configured administrator", async () => {
  const [app, page, styles, worker, authWorker, adminWorker, constants, dbAuth, dbAdmin, dbCardAccess, schema, migration, cardMigration] = await Promise.all([
    readFile(new URL("public/docflow/app.js", siteRoot), "utf8"),
    readFile(new URL("public/docflow/index.html", siteRoot), "utf8"),
    readFile(new URL("public/docflow/styles.css", siteRoot), "utf8"),
    readFile(new URL("worker/index.ts", siteRoot), "utf8"),
    readFile(new URL("worker/auth.ts", siteRoot), "utf8"),
    readFile(new URL("worker/admin.ts", siteRoot), "utf8"),
    readFile(new URL("worker/constants.ts", siteRoot), "utf8"),
    readFile(new URL("db/auth.ts", siteRoot), "utf8"),
    readFile(new URL("db/admin.ts", siteRoot), "utf8"),
    readFile(new URL("db/card-access.ts", siteRoot), "utf8"),
    readFile(new URL("db/schema.ts", siteRoot), "utf8"),
    readFile(new URL("drizzle/0003_free_thor.sql", siteRoot), "utf8"),
    readFile(new URL("drizzle/0009_nostalgic_thanos.sql", siteRoot), "utf8"),
  ]);

  assert.match(page, /id="adminButton"[^>]*is-hidden/);
  assert.match(page, /id="adminPendingBadge"/);
  assert.match(page, /class="admin-bell-icon"/);
  assert.match(page, /Enviar solicitação de cadastro/);
  assert.match(page, /aprovação do administrador/);
  assert.match(app, /createAdminState/);
  assert.match(app, /state\.auth\.user\?\.isAdmin/);
  assert.match(app, /classList\.toggle\("has-pending", pendingCount > 0\)/);
  assert.match(app, /apiRequest\("\/api\/admin\/users"\)/);
  assert.match(app, /approve-admin-user/);
  assert.match(app, /reject-admin-user/);
  assert.match(app, /delete-admin-user/);
  assert.match(app, /Excluir usuário definitivamente/);
  assert.match(app, /method: "DELETE"/);
  assert.match(app, /Último acesso/);
  assert.match(app, /HOME_CARD_OPTIONS/);
  assert.match(app, /data-admin-card-user=/);
  assert.match(app, /role="switch"/);
  assert.match(app, /apiRequest\(`\/api\/admin\/users\/\$\{encodeURIComponent\(userId\)\}\/cards`/);
  assert.match(app, /homeCardVisibilityAttribute\("drainage"\)/);
  assert.match(app, /Este card não está liberado para a sua conta/);
  assert.match(app, /key: "drainage", label: "Drenagem", mark: "QD"/);
  assert.match(app, /Nenhum card está liberado para sua conta/);
  assert.match(styles, /\.admin-button/);
  assert.match(styles, /\.admin-button\.has-pending \.admin-bell-icon/);
  assert.match(styles, /color:\s*#b42318/);
  assert.match(styles, /\.admin-user-item/);
  assert.match(styles, /\.admin-card-toggle input:checked \+ \.admin-card-switch/);
  assert.match(worker, /url\.pathname === "\/api\/admin\/users"/);
  assert.match(worker, /handleAdminUserMutation/);
  assert.match(worker, /handleAdminUserCardAccess/);
  assert.match(constants, /ADMIN_EMAIL = "lucaspsimoes22@gmail\.com"/);
  assert.match(adminWorker, /authenticated\.account\.isAdmin/);
  assert.match(adminWorker, /authenticated\.account\.email !== ADMIN_EMAIL/);
  assert.match(adminWorker, /status !== "approved" && status !== "rejected"/);
  assert.match(adminWorker, /request\.method !== "PATCH" && request\.method !== "DELETE"/);
  assert.match(adminWorker, /env\.DOCUMENTS\.delete/);
  assert.match(adminWorker, /updateUserCardAccess\(env\.DB/);
  assert.match(authWorker, /authJson\(\s*202,/);
  assert.match(authWorker, /Seu cadastro aguarda aprovação do administrador/);
  assert.match(authWorker, /Seu cadastro foi recusado/);
  assert.match(authWorker, /cards: account\.cardAccess/);
  assert.match(dbAuth, /SET last_login_at = \?, updated_at = \?/);
  assert.match(dbAuth, /u\.status = 'approved'/);
  assert.match(dbAdmin, /CASE status/);
  assert.match(dbAdmin, /WHERE id = \? AND is_admin = 0/);
  assert.match(dbAdmin, /DELETE FROM sessions WHERE user_id = \?/);
  assert.match(dbAdmin, /DELETE FROM users WHERE id = \? AND is_admin = 0/);
  assert.match(dbAdmin, /FROM generated_documents/);
  assert.match(dbAdmin, /FROM user_card_permissions/);
  assert.match(dbCardAccess, /HOME_CARD_KEYS/);
  assert.match(dbCardAccess, /ON CONFLICT\(user_id, card_key\) DO UPDATE SET/);
  assert.match(dbCardAccess, /WHERE id = \? AND is_admin = 0/);
  assert.match(schema, /status:\s*text\("status"/);
  assert.match(schema, /isAdmin:\s*integer\("is_admin"/);
  assert.match(schema, /lastLoginAt:\s*integer\("last_login_at"/);
  assert.match(schema, /userCardPermissions/);
  assert.match(migration, /lucaspsimoes22@gmail\.com/);
  assert.match(migration, /SET `last_login_at`/);
  assert.match(migration, /PRAGMA optimize/);
  assert.match(cardMigration, /CREATE TABLE `user_card_permissions`/);
  assert.match(cardMigration, /PRIMARY KEY\(`user_id`, `card_key`\)/);
});


test("labels every available document, including the technical opinion, as ready", async () => {
  const [app, styles] = await Promise.all([
    readFile(new URL("public/docflow/app.js", siteRoot), "utf8"),
    readFile(new URL("public/docflow/styles.css", siteRoot), "utf8"),
  ]);

  assert.equal((app.match(/card-status is-ready/g) || []).length, 7);
  assert.equal((app.match(/card-status is-development/g) || []).length, 0);
  assert.match(app, /data-action="start-report">[\s\S]*?card-status is-ready">Pronto<\/span>[\s\S]*?<h3>Parecer técnico<\/h3>/);
  assert.match(app, /card-status is-ready">Pronto<\/span>[\s\S]*?<h3>Folha de cota<\/h3>/);
  assert.match(app, /data-kind="memorando">[\s\S]*?card-status is-ready">Pronto<\/span>[\s\S]*?<h3>Memorando<\/h3>/);
  assert.match(app, /data-kind="oficio">[\s\S]*?card-status is-ready">Pronto<\/span>[\s\S]*?<h3>Ofício<\/h3>/);
  assert.match(app, /data-action="start-notification">[\s\S]*?card-status is-ready">Pronto<\/span>[\s\S]*?<h3>Notificação<\/h3>/);
  assert.match(app, /data-action="start-warning">[\s\S]*?card-status is-ready">Pronto<\/span>[\s\S]*?<h3>Advertência<\/h3>/);
  assert.match(app, /data-action="start-drainage">[\s\S]*?card-status is-ready">Pronto<\/span>[\s\S]*?<h3>Quantitativo de drenagem<\/h3>/);
  assert.match(styles, /\.card-status\s*\{/);
  assert.match(styles, /\.card-status\.is-ready\s*\{/);
});


test("builds a guided drainage quantity survey with traceable formulas and Excel export", async () => {
  const [app, styles, systemImage, blockImage] = await Promise.all([
    readFile(new URL("public/docflow/app.js", siteRoot), "utf8"),
    readFile(new URL("public/docflow/styles.css", siteRoot), "utf8"),
    readFile(new URL("public/docflow/images/drenagem-sistema-v1.png", siteRoot)),
    readFile(new URL("public/docflow/images/drenagem-bloco-v1.png", siteRoot)),
  ]);

  assert.ok(systemImage.byteLength > 100_000);
  assert.ok(blockImage.byteLength > 100_000);
  assert.match(app, /DRAINAGE_STEPS\s*=\s*\["Dados da obra", "Serviços", "Parâmetros", "Quantitativos", "Memória e Excel"\]/);
  assert.match(app, /function calculateDrainageStructure/);
  assert.match(app, /const meanPerimeter = 2 \* \(\(internalLength \+ wall\) \+ \(internalWidth \+ wall\)\)/);
  assert.match(app, /const modularArea = modularWidth \* modularHeight/);
  assert.match(app, /Math\.ceil\(required \/ commercialLength\)/);
  assert.match(app, /data-drainage-adopted=/);
  assert.match(app, /function buildDrainageWorkbook/);
  assert.match(app, /"01 - Resumo"/);
  assert.match(app, /"07 - Composições"/);
  assert.match(app, /print-drainage-memory/);
  assert.match(app, /docflow-drainage-draft/);
  assert.match(styles, /\.drainage-service-grid/);
  assert.match(styles, /\.drainage-results-table/);
  assert.match(styles, /body\.is-printing-drainage/);
});


test("builds technical opinions from the supplied model with map, streets, photos, and fixed sections", async () => {
  const [app, template, documentWorker] = await Promise.all([
    readFile(new URL("public/docflow/app.js", siteRoot), "utf8"),
    readFile(new URL("public/docflow/templates/MODELO_PARECER_TECNICO.docx", siteRoot)),
    readFile(new URL("worker/documents.ts", siteRoot), "utf8"),
  ]);

  assert.ok(template.byteLength > 2_000_000);
  assert.match(app, /TECHNICAL_OPINION_TEMPLATE_URL\s*=\s*"templates\/MODELO_PARECER_TECNICO\.docx"/);
  assert.match(app, /REPORT_STEPS\s*=\s*\["Identificação", "Mapa e vias", "Fotografias", "Parecer e assinaturas", "Revisão"\]/);
  assert.match(app, /renderSingleImageUpload\("report-map"/);
  assert.match(app, /data-file="report-photos"/);
  assert.match(app, /data-bind="report\.streets"/);
  assert.match(app, /data-bind="report\.findings"/);
  assert.match(app, /data-bind="report\.impacts"/);
  assert.match(app, /data-bind="report\.recommendations"/);
  assert.match(app, /data-report-signature-choice=/);
  assert.doesNotMatch(app, /event\.target === elements\.signatureDialog/);
  assert.match(app, /state\.report\.responsibles\.push/);
  assert.match(app, /state\.report\.responsibles = state\.report\.responsibles\.filter/);
  assert.match(app, /signatures\.map\(\(signature\) => new TableCell/);
  assert.match(app, /cells\.slice\(index, index \+ 2\)/);
  assert.match(app, /columnWidths: \[columnWidth, columnWidth\]/);
  assert.match(app, /technicalHeading\("INTRODUÇÃO"\)/);
  assert.match(app, /technicalHeading\("MAPA DAS VIAS VISTORIADAS"\)/);
  assert.match(app, /technicalHeading\("CONSIDERAÇÕES FINAIS:"\)/);
  assert.match(app, /technicalHeading\("ANEXO FOTOGRÁFICO"\)/);
  assert.match(app, /technical_opinion_content:\s*\{[\s\S]*?type:\s*PatchType\.DOCUMENT/);
  assert.match(app, /keepOriginalStyles:\s*true/);
  assert.match(app, /await finishDownload\(blob, filename, "Parecer técnico"\)/);
  assert.match(documentWorker, /"Parecer técnico"/);
});


test("builds memoranda and oficios from the same supplied Bertioga model", async () => {
  const [app, template] = await Promise.all([
    readFile(new URL("public/docflow/app.js", siteRoot), "utf8"),
    readFile(new URL("public/docflow/templates/MODELO_MEMORANDO.docx", siteRoot)),
  ]);

  assert.ok(template.byteLength > 200_000 && template.byteLength < 280_000);
  assert.match(app, /OFFICIAL_CORRESPONDENCE_TEMPLATE_URL\s*=\s*"templates\/MODELO_MEMORANDO\.docx"/);
  assert.match(app, /function isOfficialCorrespondenceFlow/);
  assert.match(app, /\["memorando", "oficio"\]\.includes/);
  assert.match(app, /function renderOfficialCorrespondenceInfo/);
  assert.match(app, /data-bind="correspondence\.place"/);
  assert.match(app, /data-bind="correspondence\.date"/);
  assert.match(app, /data-bind="correspondence\.number"/);
  assert.match(app, /data-bind="correspondence\.recipient"/);
  assert.match(app, /data-bind="correspondence\.salutation"/);
  assert.match(app, /data-rich-editor="correspondence\.base"/);
  assert.match(app, /data-signature-target="correspondence"/);
  assert.match(app, /signatories:\s*\[\]/);
  assert.match(app, /state\.correspondence\.signatories\.push/);
  assert.match(app, /data-action="remove-correspondence-signature"/);
  assert.match(app, /function correspondenceSignatureTable/);
  assert.match(app, /signatories\.slice\(index, index \+ 2\)/);
  assert.match(app, /columnSpan:\s*2/);
  assert.match(app, /correspondenceSignatureTable\(c\.signatories, \{ official: true \}\)/);
  assert.match(app, /data-file="correspondence-photos"/);
  assert.match(app, /data-correspondence-photo-caption/);
  assert.match(app, /data-action="remove-correspondence-photo"/);
  assert.match(app, /async function buildOfficialCorrespondenceDocument/);
  assert.match(app, /\$\{type\.label\} nº \$\{c\.number\.trim\(\)\}/);
  assert.match(app, /font:\s*"Arial",\s*size:\s*24/);
  assert.match(app, /spacing:\s*\{\s*before:\s*0,\s*after:\s*360,\s*line:\s*360\s*\}/);
  assert.match(app, /memorandum_content:\s*\{[\s\S]*?type:\s*PatchType\.DOCUMENT/);
  assert.match(app, /imageRunFor\(photo\.file, 500, 570/);
  assert.match(app, /Imagem \$\{String\(index \+ 1\)\.padStart\(2, "0"\)\} - \$\{photo\.caption\.trim\(\)\}/);
  assert.match(app, /Toda foto anexada a\$\{type\.article\} \$\{typeLower\} precisa ter uma legenda/);
  assert.match(app, /keepOriginalStyles:\s*true/);
  assert.match(app, /await finishDownload\(blob, filename, type\.label\)/);
});


test("offers every municipal secretariat in the official correspondence recipient dropdown", async () => {
  const app = await readFile(new URL("public/docflow/app.js", siteRoot), "utf8");
  const secretariats = [
    ["SA", "Secretaria Municipal de Administração"],
    ["SD", "Secretaria Municipal de Desenvolvimento Social, Trabalho e Renda"],
    ["SE", "Secretaria Municipal de Educação"],
    ["SL", "Secretaria Municipal de Esporte e Lazer"],
    ["SF", "Secretaria Municipal da Fazenda"],
    ["SG", "Secretaria Municipal de Governo e Gestão Institucional"],
    ["SM", "Secretaria Municipal de Meio Ambiente"],
    ["SO", "Secretaria Municipal de Obras e Habitação"],
    ["SP", "Secretaria Municipal de Planejamento Urbano"],
    ["SS", "Secretaria Municipal de Saúde"],
    ["SC", "Secretaria Municipal de Segurança"],
    ["SU", "Secretaria Municipal de Serviços Urbanos"],
    ["SB", "Secretaria Municipal de Trânsito e Mobilidade"],
    ["ST", "Secretaria Municipal de Turismo e Cultura"],
  ];

  for (const [acronym, name] of secretariats) {
    assert.ok(app.includes(`{ acronym: "${acronym}", name: "${name}" }`));
  }

  assert.match(app, /data-correspondence-recipient-select/);
  assert.match(app, /Outro destinatário ou setor/);
  assert.match(app, /secretariat \? `\$\{secretariat\.acronym\} — \$\{secretariat\.name\}` : ""/);
});


test("offers common formal salutations with a custom fallback", async () => {
  const app = await readFile(new URL("public/docflow/app.js", siteRoot), "utf8");
  const salutations = [
    "Sr.,",
    "Sra.,",
    "Sr.(a),",
    "Senhor,",
    "Senhora,",
    "Senhor(a),",
    "Prezado Senhor,",
    "Prezada Senhora,",
    "Prezado(a) Senhor(a),",
    "Sr. Diretor,",
    "Sra. Diretora,",
    "Sr.(a) Diretor(a),",
    "Sr. Secretário,",
    "Sra. Secretária,",
    "Sr.(a) Secretário(a),",
    "Sr. Chefe,",
    "Sra. Chefe,",
    "Sr.(a) Chefe,",
    "Excelentíssimo Senhor,",
    "Excelentíssima Senhora,",
    "Excelentíssimo(a) Senhor(a),",
    "Ilustríssimo Senhor,",
    "Ilustríssima Senhora,",
    "Ilustríssimo(a) Senhor(a),",
    "Vossa Senhoria,",
    "Vossa Excelência,",
    "Doutor,",
    "Doutora,",
    "Doutor(a),",
    "Engenheiro,",
    "Engenheira,",
    "Engenheiro(a),",
    "Arquiteto,",
    "Arquiteta,",
    "Arquiteto(a),",
    "À autoridade competente,",
    "A quem possa interessar,",
  ];

  for (const salutation of salutations) {
    assert.ok(app.includes(`  "${salutation}",`));
  }

  assert.match(app, /data-correspondence-salutation-select/);
  assert.match(app, /Outro tratamento/);
  assert.match(app, /selectedValue === OTHER_SALUTATION_VALUE \? "" : selectedValue/);
});


test("builds notifications and warnings from the same Bertioga model with fillable fields, signatures, and optional photos", async () => {
  const [app, template] = await Promise.all([
    readFile(new URL("public/docflow/app.js", siteRoot), "utf8"),
    readFile(new URL("public/docflow/templates/MODELO_NOTIFICACAO.docx", siteRoot)),
  ]);

  assert.ok(template.byteLength > 70_000 && template.byteLength < 120_000);
  assert.match(app, /NOTIFICATION_TEMPLATE_URL\s*=\s*"templates\/MODELO_NOTIFICACAO\.docx"/);
  assert.match(app, /warning:\s*createNotificationState\(persisted, "warning"\)/);
  assert.match(app, /flow === "notification" \|\| flow === "warning"/);
  assert.match(app, /data-bind="\$\{notice\.key\}\.city"/);
  assert.match(app, /data-bind="\$\{notice\.key\}\.date"/);
  assert.match(app, /data-bind="\$\{notice\.key\}\.number"/);
  assert.match(app, /data-bind="\$\{notice\.key\}\.process"/);
  assert.match(app, /data-bind="\$\{notice\.key\}\.work"/);
  assert.match(app, /data-bind="\$\{notice\.key\}\.contractor"/);
  assert.match(app, /data-bind="\$\{notice\.key\}\.baseText"/);
  assert.match(app, /data-signature-target="notice"/);
  assert.match(app, /data-file="\$\{notice\.key\}-photos"/);
  assert.match(app, /data-notification-photo-caption/);
  assert.match(app, /async function buildNotificationDocument/);
  assert.match(app, /font:\s*"Arial",\s*size:\s*24/);
  assert.match(app, /type:\s*PatchType\.DOCUMENT/);
  assert.match(app, /keepOriginalStyles:\s*true/);
  assert.match(app, /title:\s*warning \? "ADVERTÊNCIA" : "NOTIFICAÇÃO"/);
  assert.match(app, /text:\s*`\$\{n\.number\.trim\(\)\} \$\{notice\.title\}`/);
  assert.match(app, /await finishDownload\(blob, filename, notice\.label\)/);
  assert.match(app, /Imagem \$\{String\(index \+ 1\)\.padStart\(2, "0"\)\} - \$\{photo\.caption\.trim\(\)\}/);
});


test("saves reusable signatures per account and formats name and role correctly", async () => {
  const [app, page, styles, worker, signatureWorker, signatureDb, schema, migration] = await Promise.all([
    readFile(new URL("public/docflow/app.js", siteRoot), "utf8"),
    readFile(new URL("public/docflow/index.html", siteRoot), "utf8"),
    readFile(new URL("public/docflow/styles.css", siteRoot), "utf8"),
    readFile(new URL("worker/index.ts", siteRoot), "utf8"),
    readFile(new URL("worker/signatures.ts", siteRoot), "utf8"),
    readFile(new URL("db/signatures.ts", siteRoot), "utf8"),
    readFile(new URL("db/schema.ts", siteRoot), "utf8"),
    readFile(new URL("drizzle/0002_rainy_wendigo.sql", siteRoot), "utf8"),
  ]);

  assert.match(page, /id="signatureButton"/);
  assert.match(page, /id="signatureDialog"/);
  assert.match(page, /id="signatureProfileForm"/);
  assert.match(app, /OTHER_SIGNATURE_VALUE\s*=\s*"__other__"/);
  assert.match(app, /Outro — cadastrar nova assinatura/);
  assert.match(app, /apiRequest\("\/api\/signatures"\)/);
  assert.match(app, /data-report-signature-choice=/);
  assert.match(app, /data-signature-target="correspondence"/);
  assert.match(app, /data-signature-target="notice"/);
  assert.match(app, /technicalRun\(signature\.name, \{ bold: true \}\)/);
  assert.match(app, /technicalRun\(signature\.role\)/);
  assert.match(app, /text: signatory\.role\.trim\(\), font: "Arial", size: 24, bold: false, italics: true/);
  assert.match(app, /officialCorrespondenceRun\(signatory\.role\.trim\(\), false, true\)/);
  assert.match(app, /new TextRun\(\{ text: signatory\.role\.trim\(\), bold: false, italics: true/);
  assert.match(styles, /\.signature-profile-list/);
  assert.match(styles, /\.signature-preview em/);
  assert.match(worker, /url\.pathname === "\/api\/signatures"/);
  assert.match(worker, /handleSignatureMutation/);
  assert.match(signatureWorker, /authenticateRequest\(request, env\)/);
  assert.match(signatureDb, /WHERE user_id = \?/);
  assert.match(signatureDb, /WHERE id = \? AND user_id = \?/);
  assert.match(schema, /signatureProfiles/);
  assert.match(schema, /idx_signature_profiles_user_name/);
  assert.match(migration, /CREATE TABLE `signature_profiles`/);
  assert.match(migration, /PRAGMA optimize/);
});


test("keeps a private account history for every generated document", async () => {
  const [app, page, worker, documentWorker, documentDb, schema, hosting, wrangler, migration] = await Promise.all([
    readFile(new URL("public/docflow/app.js", siteRoot), "utf8"),
    readFile(new URL("public/docflow/index.html", siteRoot), "utf8"),
    readFile(new URL("worker/index.ts", siteRoot), "utf8"),
    readFile(new URL("worker/documents.ts", siteRoot), "utf8"),
    readFile(new URL("db/documents.ts", siteRoot), "utf8"),
    readFile(new URL("db/schema.ts", siteRoot), "utf8"),
    readFile(new URL(".openai/hosting.json", siteRoot), "utf8"),
    readFile(new URL("wrangler.jsonc", siteRoot), "utf8"),
    readFile(new URL("drizzle/0001_nappy_bloodscream.sql", siteRoot), "utf8"),
  ]);

  assert.match(page, /<strong>Fiscal Bertioga<\/strong>/);
  assert.doesNotMatch(page, /<strong>DocFlow<\/strong>/);
  assert.match(page, /data-action="show-history"/);
  assert.doesNotMatch(app, /Escolha o documento/);
  assert.doesNotMatch(app, /O que você quer preparar\?/);
  assert.doesNotMatch(app, /history-callout/);
  assert.doesNotMatch(app, /home-history-button/);
  assert.match(app, /Histórico de documentos/);
  assert.match(app, /apiRequest\("\/api\/documents"/);
  assert.match(app, /requestOptions\.body instanceof FormData/);
  assert.equal((app.match(/await finishDownload\(/g) || []).length, 4);
  assert.match(app, /data-action="download-history"/);
  assert.match(app, /\/api\/documents\/\$\{encodeURIComponent\(documentId\)\}\/download/);
  assert.match(worker, /url\.pathname === "\/api\/documents"/);
  assert.match(worker, /handleDocumentDownload/);
  assert.match(documentWorker, /authenticateRequest\(request, env\)/);
  assert.match(documentWorker, /env\.DOCUMENTS\.put/);
  assert.match(documentWorker, /env\.DOCUMENTS\.delete/);
  assert.match(documentWorker, /getGeneratedDocument\(env\.DB, authenticated\.account\.id, documentId\)/);
  assert.match(documentWorker, /Content-Disposition/);
  assert.match(documentDb, /WHERE user_id = \?/);
  assert.match(documentDb, /WHERE id = \? AND user_id = \?/);
  assert.match(schema, /generatedDocuments/);
  assert.match(schema, /idx_generated_documents_user_created/);
  assert.match(hosting, /"r2": "DOCUMENTS"/);
  assert.match(wrangler, /"binding": "DOCUMENTS"/);
  assert.match(migration, /CREATE TABLE `generated_documents`/);
  assert.match(migration, /CREATE INDEX `idx_generated_documents_user_created`/);
  assert.match(migration, /PRAGMA optimize/);
});


test("lets each account rename, delete, preview, and download its history as PDF", async () => {
  const [app, page, styles, worker, documentWorker, documentDb, docxPreview, html2canvas, jspdf, jszip] = await Promise.all([
    readFile(new URL("public/docflow/app.js", siteRoot), "utf8"),
    readFile(new URL("public/docflow/index.html", siteRoot), "utf8"),
    readFile(new URL("public/docflow/styles.css", siteRoot), "utf8"),
    readFile(new URL("worker/index.ts", siteRoot), "utf8"),
    readFile(new URL("worker/documents.ts", siteRoot), "utf8"),
    readFile(new URL("db/documents.ts", siteRoot), "utf8"),
    readFile(new URL("public/docflow/vendor/docx-preview.min.js", siteRoot)),
    readFile(new URL("public/docflow/vendor/html2canvas.min.js", siteRoot)),
    readFile(new URL("public/docflow/vendor/jspdf.umd.min.js", siteRoot)),
    readFile(new URL("public/docflow/vendor/jszip.min.js", siteRoot)),
  ]);

  assert.match(page, /id="renameDialog"/);
  assert.match(page, /vendor\/jszip\.min\.js/);
  assert.match(page, /vendor\/docx-preview\.min\.js/);
  assert.match(page, /vendor\/html2canvas\.min\.js/);
  assert.match(page, /vendor\/jspdf\.umd\.min\.js/);
  assert.ok(docxPreview.byteLength > 70_000);
  assert.ok(html2canvas.byteLength > 190_000);
  assert.ok(jspdf.byteLength > 400_000);
  assert.ok(jszip.byteLength > 90_000);

  assert.match(app, /data-action="preview-history-pdf"/);
  assert.match(app, /data-action="download-history-pdf"/);
  assert.match(app, /data-action="rename-history"/);
  assert.match(app, /data-action="delete-history"/);
  assert.match(app, /window\.docxPreview\.renderAsync/);
  assert.match(app, /window\.html2canvas/);
  assert.match(app, /window\.jspdf/);
  assert.match(app, /pdf\.output\("blob"\)/);
  assert.match(app, /window\.open\("", "_blank"\)/);
  assert.match(app, /\.pdf`/);
  assert.doesNotMatch(page, /https?:\/\/[^"']+\.(?:js|mjs)/);
  assert.match(styles, /\.history-item-actions/);
  assert.match(styles, /\.pdf-render-host/);

  assert.match(worker, /handleDocumentMutation/);
  assert.match(worker, /const documentMutation = url\.pathname\.match/);
  assert.match(documentWorker, /request\.method === "PATCH"/);
  assert.match(documentWorker, /request\.method === "DELETE"/);
  assert.match(documentWorker, /renameGeneratedDocument\(\s*env\.DB,\s*authenticated\.account\.id/);
  assert.match(documentWorker, /deleteGeneratedDocument\(env\.DB, authenticated\.account\.id, documentId\)/);
  assert.match(documentDb, /UPDATE generated_documents[\s\S]*?WHERE id = \? AND user_id = \?/);
  assert.match(documentDb, /DELETE FROM generated_documents[\s\S]*?WHERE id = \? AND user_id = \?/);
});


test("adds private Kanban boards with member permissions, files, comments, history, notifications, and priorities", async () => {
  const [app, page, styles, worker, kanbanWorker, kanbanDb, schema, initialMigration, boardMigration, collaborationMigration, scheduleMigration, priorityMigration] = await Promise.all([
    readFile(new URL("public/docflow/app.js", siteRoot), "utf8"),
    readFile(new URL("public/docflow/index.html", siteRoot), "utf8"),
    readFile(new URL("public/docflow/styles.css", siteRoot), "utf8"),
    readFile(new URL("worker/index.ts", siteRoot), "utf8"),
    readFile(new URL("worker/kanban.ts", siteRoot), "utf8"),
    readFile(new URL("db/kanban.ts", siteRoot), "utf8"),
    readFile(new URL("db/schema.ts", siteRoot), "utf8"),
    readFile(new URL("drizzle/0004_loud_brood.sql", siteRoot), "utf8"),
    readFile(new URL("drizzle/0005_free_sasquatch.sql", siteRoot), "utf8"),
    readFile(new URL("drizzle/0006_gifted_crusher_hogan.sql", siteRoot), "utf8"),
    readFile(new URL("drizzle/0008_flaky_king_bedlam.sql", siteRoot), "utf8"),
    readFile(new URL("drizzle/0010_wonderful_morlocks.sql", siteRoot), "utf8"),
  ]);

  assert.match(page, /id="kanbanButton"/);
  assert.match(page, /data-action="show-kanban"/);
  assert.match(page, /id="notificationButton"/);
  assert.match(page, /class="notification-bell"/);
  assert.match(page, /id="notificationBadge"/);
  assert.match(page, /id="kanbanCardDialog"/);
  assert.match(page, /id="kanbanAssigneeList"/);
  assert.match(page, /id="kanbanBoardDialog"/);
  assert.match(page, /id="kanbanBoardMemberList"/);
  assert.match(page, /id="kanbanHistoryDialog"/);
  assert.match(page, /id="kanbanHistoryDialogContent"/);
  assert.match(page, /id="kanbanAttachmentInput"/);
  assert.match(page, /id="kanbanAttachmentList"/);
  assert.doesNotMatch(page, /id="kanbanCommentInput"/);
  assert.doesNotMatch(page, /Novo comentário/);
  assert.doesNotMatch(page, /Adicionar comentário/);
  assert.match(page, /id="kanbanCardTimeline"/);
  assert.match(page, /id="kanbanCardStartDate"/);
  assert.match(page, /id="kanbanCardDurationDays"/);
  assert.match(page, /id="kanbanSchedulePreview"/);
  assert.match(page, /id="kanbanTimelineTitle">Histórico</);
  assert.match(page, /Somente as pessoas selecionadas poderão visualizar o quadro e editar seus cartões/);
  assert.match(app, /const KANBAN_COLUMNS = \[/);
  assert.match(app, /id: "todo"/);
  assert.match(app, /id: "doing"/);
  assert.match(app, /id: "done"/);
  assert.match(app, /apiRequest\(`\/api\/kanban\$\{query\}`\)/);
  assert.match(app, /data-action="select-kanban-board"/);
  assert.match(app, /data-action="open-kanban-history"/);
  assert.match(app, /openKanbanHistoryDialog/);
  assert.match(app, /data-action="edit-kanban-board"/);
  assert.match(app, /data-action="edit-kanban-board">Renomear quadro/);
  assert.match(app, /data-action="delete-kanban-board">Excluir quadro/);
  assert.match(app, /board\.isOwner \? `<button[\s\S]*?Renomear quadro[\s\S]*?Excluir quadro/);
  assert.match(app, /Histórico —/);
  assert.match(app, /data-kanban-board-member/);
  assert.match(app, /\/api\/kanban\/cards\/\$\{encodeURIComponent\(cardId\)\}/);
  assert.match(app, /data-kanban-column/);
  assert.match(app, /data-kanban-status/);
  assert.match(app, /data-kanban-priority/);
  assert.match(app, /const KANBAN_PRIORITIES = \[/);
  assert.match(app, /function compareKanbanCardsByPriority/);
  assert.match(app, /function changeKanbanCardPriority/);
  assert.match(app, /data-kanban-assignee/);
  assert.match(app, /const optimisticCard = \{ \.\.\.card, status,/);
  assert.match(app, /moveKanbanCardInView\(cardId, status\)/);
  assert.match(app, /uploadKanbanAttachments/);
  assert.doesNotMatch(app, /addKanbanComment/);
  assert.match(app, /Descrição salva nesta alteração/);
  assert.match(app, /function getKanbanSchedule/);
  assert.match(app, /Faltam \$\{daysRemaining\} dias/);
  assert.match(app, /Em atraso há/);
  assert.match(app, /startDate: card\.startDate/);
  assert.match(app, /deleteKanbanAttachment/);
  assert.match(app, /download\?view=1/);
  assert.match(app, /Visualizar <span aria-hidden="true">↗<\/span>/);
  assert.match(app, /target="_blank" rel="noopener noreferrer"/);
  assert.match(app, /\/api\/kanban\/cards\/\$\{encodeURIComponent\(cardId\)\}\/details/);
  assert.match(app, /formData\.append\("files", file, file\.name\)/);
  assert.match(app, /A alteração foi desfeita/);
  assert.doesNotMatch(app, /event\.target === elements\.kanbanCardDialog/);
  assert.match(app, /const savedCard = payload\.card;/);
  assert.match(app, /savedCard\.startDate !== startDate \|\| savedDurationDays !== durationDays/);
  assert.match(app, /O servidor não confirmou a data de início e a vigência/);
  assert.match(app, /state\.kanban\.cards = state\.kanban\.cards\.map\(\(item\) => item\.id === cardId \? savedCard : item\);/);
  assert.match(app, /cardElement\.outerHTML = renderKanbanCard\(card\);/);
  assert.doesNotMatch(app, /closeDialog\(elements\.kanbanCardDialog\);\s*await loadKanban/);
  assert.match(app, /setInterval\([\s\S]*?30_000/);
  assert.match(styles, /\.kanban-board/);
  assert.match(styles, /\.kanban-board-sidebar/);
  assert.match(styles, /\.kanban-board-history-button/);
  assert.match(styles, /\.kanban-history-dialog/);
  assert.match(styles, /\.kanban-card\.is-syncing/);
  assert.match(styles, /\.kanban-priority-control\.is-high/);
  assert.match(styles, /\.kanban-priority-control\.is-medium/);
  assert.match(styles, /\.kanban-priority-control\.is-low/);
  assert.match(styles, /@keyframes kanban-syncing/);
  assert.match(styles, /\.kanban-attachment-list/);
  assert.match(styles, /\.kanban-attachment-preview/);
  assert.match(styles, /\.kanban-card-timeline/);
  assert.match(styles, /overflow-wrap:\s*anywhere/);
  assert.match(styles, /\.notification-button/);
  assert.match(styles, /\.notification-badge/);
  assert.match(styles, /\.notification-popover\.is-expanded/);
  assert.match(styles, /\.notification-actions/);
  assert.match(app, /notificationTotalCount: 0/);
  assert.match(app, /notificationsExpanded: false/);
  assert.match(app, /notifications\.slice\(0, 5\)/);
  assert.match(app, /Ver todas as notificações/);
  assert.match(app, /toggleNotificationExpansion/);
  assert.match(app, /\?all=1/);

  assert.match(worker, /url\.pathname === "\/api\/kanban"/);
  assert.match(worker, /url\.pathname === "\/api\/kanban\/boards"/);
  assert.match(worker, /handleKanbanBoardMutation/);
  assert.match(worker, /handleKanbanNotificationMutation/);
  assert.match(worker, /handleKanbanCardDetails/);
  assert.match(worker, /handleKanbanCardComments/);
  assert.match(worker, /handleKanbanCardAttachments/);
  assert.match(worker, /handleKanbanAttachmentMutation/);
  assert.match(kanbanWorker, /authenticateRequest\(request, env\)/);
  assert.match(kanbanWorker, /listApprovedKanbanPeople/);
  assert.match(kanbanWorker, /getKanbanCardAccess/);
  assert.match(kanbanWorker, /Somente o criador pode gerenciar este quadro/);
  assert.match(kanbanWorker, /Você não tem permissão para editar este cartão/);
  assert.match(kanbanWorker, /Selecione somente participantes deste quadro/);
  assert.match(kanbanWorker, /Informe a data de início e os dias de vigência da tarefa/);
  assert.match(kanbanWorker, /isValidIsoDate/);
  assert.match(kanbanWorker, /const KANBAN_PRIORITIES = new Set<KanbanPriority>/);
  assert.match(kanbanWorker, /Escolha uma prioridade válida para o cartão/);
  assert.match(kanbanWorker, /Selecione somente pessoas com acesso aprovado/);
  assert.match(kanbanWorker, /MAX_ATTACHMENT_BYTES = 10 \* 1024 \* 1024/);
  assert.match(kanbanWorker, /env\.DOCUMENTS\.put/);
  assert.match(kanbanWorker, /env\.DOCUMENTS\.get/);
  assert.match(kanbanWorker, /removeStoredAttachments/);
  assert.match(kanbanWorker, /Content-Disposition/);
  assert.match(kanbanWorker, /searchParams\.get\("view"\) === "1"/);
  assert.match(kanbanWorker, /previewInline \? "inline" : "attachment"/);
  assert.match(kanbanWorker, /isPreviewableAttachmentType/);
  assert.match(kanbanWorker, /searchParams\.get\("all"\) === "1"/);
  assert.match(kanbanDb, /WHERE status = 'approved'/);
  assert.match(kanbanDb, /listAccessibleKanbanBoards/);
  assert.match(kanbanDb, /listKanbanActivity/);
  assert.match(kanbanDb, /activityStatement/);
  assert.match(kanbanDb, /const newlyAssigned = values\.assigneeIds\.filter/);
  assert.match(kanbanDb, /listKanbanNotificationRecipientIds/);
  assert.match(kanbanDb, /WHERE board_id = \? AND user_id <> \?/);
  assert.match(kanbanDb, /appendKanbanNotifications/);
  assert.match(kanbanDb, /criou o cartão/);
  assert.match(kanbanDb, /atualizou o cartão/);
  assert.match(kanbanDb, /adicionou uma atualização no cartão/);
  assert.match(kanbanDb, /totalCount: Number\(total\?\.count \|\| 0\)/);
  assert.match(kanbanDb, /createKanbanCardComment/);
  assert.match(kanbanDb, /createKanbanCardAttachments/);
  assert.match(kanbanDb, /listKanbanCardActivity/);
  assert.match(kanbanDb, /adicionou uma descrição ao cartão/);
  assert.match(kanbanDb, /removeu a descrição do cartão/);
  assert.match(kanbanDb, /details: descriptionChanged && values\.description/);
  assert.match(kanbanDb, /alterou a data de início do cartão/);
  assert.match(kanbanDb, /alterou a vigência do cartão/);
  assert.match(kanbanDb, /CASE c\.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END/);
  assert.match(kanbanDb, /alterou a prioridade do cartão/);
  assert.match(schema, /kanbanBoards/);
  assert.match(schema, /kanbanBoardMembers/);
  assert.match(schema, /kanbanCards/);
  assert.match(schema, /kanbanActivity/);
  assert.match(schema, /details: text\("details"\)/);
  assert.match(schema, /startDate: text\("start_date"\)/);
  assert.match(schema, /durationDays: integer\("duration_days"\)/);
  assert.match(schema, /priority: text\("priority"/);
  assert.match(schema, /kanbanCardAssignees/);
  assert.match(schema, /kanbanNotifications/);
  assert.match(schema, /kanbanCardComments/);
  assert.match(schema, /kanbanCardAttachments/);
  assert.match(initialMigration, /CREATE TABLE `kanban_cards`/);
  assert.match(initialMigration, /CREATE TABLE `kanban_card_assignees`/);
  assert.match(initialMigration, /CREATE TABLE `kanban_notifications`/);
  assert.match(initialMigration, /PRAGMA optimize/);
  assert.match(boardMigration, /CREATE TABLE `kanban_boards`/);
  assert.match(boardMigration, /CREATE TABLE `kanban_board_members`/);
  assert.match(boardMigration, /CREATE TABLE `kanban_activity`/);
  assert.match(boardMigration, /ALTER TABLE `kanban_cards` ADD `board_id`/);
  assert.match(boardMigration, /Quadro existente/);
  assert.match(collaborationMigration, /CREATE TABLE `kanban_card_comments`/);
  assert.match(collaborationMigration, /CREATE TABLE `kanban_card_attachments`/);
  assert.match(collaborationMigration, /idx_kanban_card_comments_card_created/);
  assert.match(collaborationMigration, /idx_kanban_card_attachments_card_created/);
  assert.match(collaborationMigration, /PRAGMA optimize/);
  assert.match(scheduleMigration, /ALTER TABLE `kanban_cards` ADD `start_date` text/);
  assert.match(scheduleMigration, /ALTER TABLE `kanban_cards` ADD `duration_days` integer/);
  assert.match(priorityMigration, /ALTER TABLE `kanban_cards` ADD `priority` text DEFAULT 'medium' NOT NULL/);
  assert.match(priorityMigration, /idx_kanban_cards_board_status_priority_position/);
});


test("publishes a shared process guide that only the administrator can manage", async () => {
  const [app, page, styles, worker, processWorker, processDb, schema, migration] = await Promise.all([
    readFile(new URL("public/docflow/app.js", siteRoot), "utf8"),
    readFile(new URL("public/docflow/index.html", siteRoot), "utf8"),
    readFile(new URL("public/docflow/styles.css", siteRoot), "utf8"),
    readFile(new URL("worker/index.ts", siteRoot), "utf8"),
    readFile(new URL("worker/processes.ts", siteRoot), "utf8"),
    readFile(new URL("db/processes.ts", siteRoot), "utf8"),
    readFile(new URL("db/schema.ts", siteRoot), "utf8"),
    readFile(new URL("drizzle/0011_stale_wither.sql", siteRoot), "utf8"),
  ]);

  assert.match(page, /id="processesButton"/);
  assert.match(page, /data-action="show-processes"/);
  assert.match(page, /id="processGuideDialog"/);
  assert.match(page, /id="processGuideChecklist"/);
  assert.match(page, /id="processGuideLinks"/);
  assert.match(app, /function renderProcesses\(\)/);
  assert.match(app, /apiRequest\("\/api\/processes"\)/);
  assert.match(app, /data-action="add-process-guide"/);
  assert.match(app, /data-action="edit-process-guide"/);
  assert.match(app, /data-action="delete-process-guide"/);
  assert.match(app, /rel="noopener noreferrer"/);
  assert.match(styles, /\.processes-button/);
  assert.match(styles, /\.process-guide-checklist/);
  assert.match(styles, /\.process-guide-links/);
  assert.match(worker, /url\.pathname === "\/api\/processes"/);
  assert.match(worker, /handleProcessMutation/);
  assert.match(processWorker, /authenticateRequest\(request, env\)/);
  assert.match(processWorker, /authenticated\.account\.isAdmin && authenticated\.account\.email === ADMIN_EMAIL/);
  assert.match(processWorker, /url\.protocol !== "https:" && url\.protocol !== "http:"/);
  assert.match(processDb, /title: "Aditivo de prazo"/);
  assert.match(processDb, /índice pluviométrico a partir de 13\/08\/2026/);
  assert.match(processDb, /Ordem de Serviço foi assinada somente em 13\/08\/2026/);
  assert.match(processDb, /apps\.spaguas\.sp\.gov\.br/);
  assert.match(processDb, /servicos\.receitafederal\.gov\.br/);
  assert.match(processDb, /www10\.fazenda\.sp\.gov\.br/);
  assert.match(processDb, /www\.dividaativa\.pge\.sp\.gov\.br/);
  assert.match(schema, /export const processGuides/);
  assert.match(schema, /export const contentSeeds/);
  assert.match(migration, /CREATE TABLE `process_guides`/);
  assert.match(migration, /CREATE TABLE `content_seeds`/);
  assert.match(migration, /idx_process_guides_updated_at/);
  assert.match(migration, /PRAGMA optimize/);
});
