/* DocFlow — aplicação web independente para geração de documentos. */

const LEGACY_DOCFLOW_PATHS = new Set(["/docflow/", "/docflow/index.html"]);
if (LEGACY_DOCFLOW_PATHS.has(window.location.pathname)) {
  window.history.replaceState(
    null,
    "",
    `/${window.location.search}${window.location.hash}`,
  );
}

const REPORT_STEPS = ["Informações", "Fotografias", "Conteúdo e formato", "Revisão"];
const COTA_STEPS = ["Conteúdo", "Revisão", "Assinatura e download"];
const OFFICIAL_CORRESPONDENCE_STEPS = ["Dados do documento", "Conteúdo", "Revisão e download"];
const CORRESPONDENCE_STEPS = ["Dados do documento", "Conteúdo", "Revisão e download"];
const NOTIFICATION_STEPS = ["Dados da notificação", "Conteúdo e anexos", "Revisão e download"];
const WARNING_STEPS = ["Dados da advertência", "Conteúdo e anexos", "Revisão e download"];
const CORRESPONDENCE_TYPES = {
  memorando: {
    label: "Memorando",
    article: "o",
    completed: "concluído",
    description: "Comunicação interna objetiva entre setores, unidades ou responsáveis.",
    recipientPrefix: "À",
  },
  oficio: {
    label: "Ofício",
    article: "o",
    completed: "concluído",
    description: "Comunicação formal dirigida a órgãos, entidades ou destinatários externos.",
    recipientPrefix: "Ao(À) Senhor(a)",
  },
  notificacao: {
    label: "Notificação",
    article: "a",
    completed: "concluída",
    description: "Comunicação formal de ciência, solicitação, ocorrência ou providência.",
    recipientPrefix: "Destinatário",
  },
  advertencia: {
    label: "Advertência",
    article: "a",
    completed: "concluída",
    description: "Registro formal de orientação ou advertência, com fatos informados pelo usuário.",
    recipientPrefix: "Destinatário",
  },
};
const MUNICIPAL_SECRETARIATS = [
  { acronym: "SA", name: "Secretaria Municipal de Administração" },
  { acronym: "SD", name: "Secretaria Municipal de Desenvolvimento Social, Trabalho e Renda" },
  { acronym: "SE", name: "Secretaria Municipal de Educação" },
  { acronym: "SL", name: "Secretaria Municipal de Esporte e Lazer" },
  { acronym: "SF", name: "Secretaria Municipal da Fazenda" },
  { acronym: "SG", name: "Secretaria Municipal de Governo e Gestão Institucional" },
  { acronym: "SM", name: "Secretaria Municipal de Meio Ambiente" },
  { acronym: "SO", name: "Secretaria Municipal de Obras e Habitação" },
  { acronym: "SP", name: "Secretaria Municipal de Planejamento Urbano" },
  { acronym: "SS", name: "Secretaria Municipal de Saúde" },
  { acronym: "SC", name: "Secretaria Municipal de Segurança" },
  { acronym: "SU", name: "Secretaria Municipal de Serviços Urbanos" },
  { acronym: "SB", name: "Secretaria Municipal de Trânsito e Mobilidade" },
  { acronym: "ST", name: "Secretaria Municipal de Turismo e Cultura" },
];
const OFFICIAL_SALUTATIONS = [
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
const MAX_COTA_TEXT = 2500;
const COTA_TOTAL_LINES = 32;
const COTA_PARAGRAPH_GAP_LINES = 1;
const COTA_SIGNATURE_GAP_LINES = 1;
const COTA_SIGNATURE_BLOCK_LINES = 3;
const MAX_COTA_LINES = COTA_TOTAL_LINES - COTA_SIGNATURE_GAP_LINES - COTA_SIGNATURE_BLOCK_LINES;
const COTA_LINE_WIDTH_PX = 296;
const COTA_JUSTIFIED_WIDTH_PX = 304;
const COTA_TEMPLATE_URL = "templates/MODELO_FOLHA_COTA.docx";
const OFFICIAL_CORRESPONDENCE_TEMPLATE_URL = "templates/MODELO_MEMORANDO.docx";
const NOTIFICATION_TEMPLATE_URL = "templates/MODELO_NOTIFICACAO.docx";
const COTA_TEXT_STYLE = { font: "Arial", size: 24, language: { value: "pt-BR" } };
const COTA_HEADER_FIELD_STYLE = { ...COTA_TEXT_STYLE, bold: true, italics: false };
const MAX_CORRESPONDENCE_TEXT = 7000;
const ACCEPTED_IMAGES = ["image/jpeg", "image/png", "image/bmp", "image/gif", "image/webp"];
const OTHER_SIGNATURE_VALUE = "__other__";
const OTHER_RECIPIENT_VALUE = "__other_recipient__";
const OTHER_SALUTATION_VALUE = "__other_salutation__";

const PHOTO_PROMPT = `Você é um inspetor de pavimentação urbana. Examine somente o pavimento, a calçada, a sarjeta e os dispositivos de drenagem visíveis na fotografia.

Descreva apenas defeitos claramente visíveis, como acúmulo de água, empoçamento, afundamento, recalque, desnível, desalinhamento de blocos, perda de intertravamento, abertura excessiva de juntas, peças quebradas ou ausentes, buraco, desgaste, desagregação, falha de recomposição, trinca em superfície contínua ou obstrução visível de drenagem.

Regras: não confunda juntas normais entre blocos com trincas; não trate reflexos, sombras, tintas, marcações, textos ou linhas refletidas na água como defeitos; não invente causa, consequência, medida, material oculto ou responsabilidade; não descreva pessoas, veículos, mapas, endereços, datas, coordenadas ou marcas d'água.

Responda em português do Brasil com uma única frase técnica e objetiva de até 35 palavras. Não use título, lista, rótulo ou prefixo. Se nenhum defeito estiver claramente visível, responda exatamente: "Não foi identificada patologia visível na fotografia."`;

const COTA_PROMPT = `Você é exclusivamente um revisor de texto administrativo, não um autor criativo. Reescreva o texto-base em português formal, claro e objetivo, adequado a um processo administrativo. Faça apenas correções de ortografia, concordância, pontuação, coesão e formalidade.

Preserve rigorosamente o significado e todas as informações existentes. Não acrescente fato, nome, cargo, setor, local, endereço, data, número, protocolo, lei, prazo, causa, risco, diagnóstico, medida técnica ou conclusão que não esteja no texto-base. Não transforme uma constatação simples em laudo técnico. Não acrescente título, saudação, assunto, assinatura nem comentários sobre a revisão.

Mantenha aproximadamente o mesmo tamanho do original e retorne somente o texto final, sem aspas e sem introdução.`;

const CORRESPONDENCE_PROMPT = `Você é exclusivamente um revisor de correspondência administrativa, não um autor criativo. Reescreva o texto-base em português formal, claro, objetivo e adequado ao tipo de documento informado. Faça apenas correções de ortografia, concordância, pontuação, coesão e formalidade.

Preserve rigorosamente o significado e todas as informações existentes. Não acrescente fato, nome, cargo, setor, local, endereço, data, número, protocolo, lei, prazo, causa, penalidade, obrigação, risco, diagnóstico ou conclusão que não esteja no texto-base. Não acrescente cabeçalho, título, assunto, destinatário, saudação, despedida, assinatura nem comentários sobre a revisão.

Retorne somente o corpo do texto revisado, sem aspas e sem introdução.`;

const elements = {
  authGate: document.querySelector("#authGate"),
  siteShell: document.querySelector("#siteShell"),
  loginTab: document.querySelector("#loginTab"),
  registerTab: document.querySelector("#registerTab"),
  loginForm: document.querySelector("#loginForm"),
  registerForm: document.querySelector("#registerForm"),
  loginEmail: document.querySelector("#loginEmail"),
  loginPassword: document.querySelector("#loginPassword"),
  registerName: document.querySelector("#registerName"),
  registerEmail: document.querySelector("#registerEmail"),
  registerPassword: document.querySelector("#registerPassword"),
  registerPasswordConfirmation: document.querySelector("#registerPasswordConfirmation"),
  loginFeedback: document.querySelector("#loginFeedback"),
  registerFeedback: document.querySelector("#registerFeedback"),
  adminButton: document.querySelector("#adminButton"),
  adminPendingBadge: document.querySelector("#adminPendingBadge"),
  kanbanButton: document.querySelector("#kanbanButton"),
  notificationButton: document.querySelector("#notificationButton"),
  notificationBadge: document.querySelector("#notificationBadge"),
  notificationPopover: document.querySelector("#notificationPopover"),
  notificationList: document.querySelector("#notificationList"),
  accountName: document.querySelector("#accountName"),
  view: document.querySelector("#view"),
  main: document.querySelector("#main"),
  sidebar: document.querySelector("#sidebar"),
  stepNav: document.querySelector("#stepNav"),
  flowEyebrow: document.querySelector("#flowEyebrow"),
  flowTitle: document.querySelector("#flowTitle"),
  flowDescription: document.querySelector("#flowDescription"),
  actionBar: document.querySelector("#actionBar"),
  backButton: document.querySelector("#backButton"),
  nextButton: document.querySelector("#nextButton"),
  actionHint: document.querySelector("#actionHint"),
  apiButton: document.querySelector("#apiButton"),
  apiButtonLabel: document.querySelector("#apiButtonLabel"),
  apiDialog: document.querySelector("#apiDialog"),
  apiForm: document.querySelector("#apiForm"),
  apiKeyInput: document.querySelector("#apiKeyInput"),
  apiKeyHelp: document.querySelector("#apiKeyHelp"),
  modelSelect: document.querySelector("#modelSelect"),
  customModelField: document.querySelector("#customModelField"),
  customModelInput: document.querySelector("#customModelInput"),
  apiFeedback: document.querySelector("#apiFeedback"),
  testApiButton: document.querySelector("#testApiButton"),
  removeApiButton: document.querySelector("#removeApiButton"),
  signatureDialog: document.querySelector("#signatureDialog"),
  signatureProfileList: document.querySelector("#signatureProfileList"),
  signatureProfileForm: document.querySelector("#signatureProfileForm"),
  signatureProfileId: document.querySelector("#signatureProfileId"),
  signatureNameInput: document.querySelector("#signatureNameInput"),
  signatureRoleInput: document.querySelector("#signatureRoleInput"),
  signatureFormTitle: document.querySelector("#signatureFormTitle"),
  signatureFeedback: document.querySelector("#signatureFeedback"),
  saveSignatureButton: document.querySelector("#saveSignatureButton"),
  cancelSignatureEditButton: document.querySelector("#cancelSignatureEditButton"),
  messageDialog: document.querySelector("#messageDialog"),
  messageIcon: document.querySelector("#messageIcon"),
  messageTitle: document.querySelector("#messageTitle"),
  messageText: document.querySelector("#messageText"),
  messageActions: document.querySelector("#messageActions"),
  renameDialog: document.querySelector("#renameDialog"),
  renameForm: document.querySelector("#renameForm"),
  renameInput: document.querySelector("#renameInput"),
  renameFeedback: document.querySelector("#renameFeedback"),
  renameSubmitButton: document.querySelector("#renameSubmitButton"),
  kanbanCardDialog: document.querySelector("#kanbanCardDialog"),
  kanbanCardForm: document.querySelector("#kanbanCardForm"),
  kanbanCardFormTitle: document.querySelector("#kanbanCardFormTitle"),
  kanbanCardId: document.querySelector("#kanbanCardId"),
  kanbanCardTitle: document.querySelector("#kanbanCardTitle"),
  kanbanCardDescription: document.querySelector("#kanbanCardDescription"),
  kanbanCardStatus: document.querySelector("#kanbanCardStatus"),
  kanbanAssigneeList: document.querySelector("#kanbanAssigneeList"),
  kanbanCardFeedback: document.querySelector("#kanbanCardFeedback"),
  saveKanbanCardButton: document.querySelector("#saveKanbanCardButton"),
  toast: document.querySelector("#toast"),
  saveStatus: document.querySelector("#saveStatus"),
};

const persisted = readStorage("docflow-preferences", {});

function createHistoryState() {
  return {
    open: false,
    loading: false,
    loaded: false,
    items: [],
    error: "",
    busy: new Map(),
    pdfCache: new Map(),
    renameDocumentId: null,
  };
}

function createAdminState() {
  return {
    open: false,
    loading: false,
    loaded: false,
    users: [],
    error: "",
    busy: new Map(),
  };
}

function createKanbanState() {
  return {
    open: false,
    loading: false,
    loaded: false,
    cards: [],
    people: [],
    error: "",
    busy: new Map(),
    editingCardId: "",
    notifications: [],
    unreadCount: 0,
    notificationsLoading: false,
    notificationsOpen: false,
  };
}

const state = {
  auth: {
    user: null,
  },
  flow: null,
  step: 0,
  api: {
    hasKey: false,
    lastFour: "",
    model: "gpt-5.6-terra",
    customModel: "",
  },
  signatures: createSignatureConfigurationState(),
  report: createReportState(persisted),
  cota: createCotaState(persisted),
  correspondence: createCorrespondenceState(persisted),
  notification: createNotificationState(persisted, "notification"),
  warning: createNotificationState(persisted, "warning"),
  analysis: { running: false, total: 0, done: 0 },
  generation: { running: false, progress: 0, message: "" },
  lastDownload: null,
  history: createHistoryState(),
  admin: createAdminState(),
  kanban: createKanbanState(),
  messageCallbacks: new Map(),
  validationFields: [],
};

let toastTimer = null;
let saveTimer = null;
let cotaTemplatePromise = null;
let cotaMeasureContext = null;
let officialCorrespondenceTemplatePromise = null;
let notificationTemplatePromise = null;
let pendingSignatureTarget = null;
let notificationPollTimer = null;
let draggedKanbanCardId = "";

function createSignatureConfigurationState() {
  return {
    loading: false,
    loaded: false,
    saving: false,
    items: [],
    error: "",
  };
}

function createReportState(saved = {}) {
  return {
    organization: saved.organization || "",
    department: saved.department || "",
    logo: null,
    date: todayInputValue(),
    title: "Relatório Fotográfico",
    introduction: "",
    introImage: null,
    photos: [],
    order: "name",
    topics: [],
    responsibles: [],
    onePerPage: Boolean(saved.onePerPage),
    startPhotosNewPage: saved.startPhotosNewPage !== false,
    complete: false,
  };
}

function createCotaState(saved = {}) {
  return {
    organization: saved.organization || "",
    department: saved.department || "",
    sheetNumber: "",
    processNumber: "",
    year: String(new Date().getFullYear()),
    baseText: "",
    finalText: "",
    useAI: false,
    contextImage: null,
    signerProfileId: "",
    signer: "",
    signerRole: "",
    complete: false,
  };
}

function createCorrespondenceState(saved = {}) {
  return {
    kind: "memorando",
    organization: saved.organization || "",
    department: saved.department || "",
    number: "",
    place: saved.memorandumCity || "Bertioga",
    date: todayInputValue(),
    recipient: "",
    recipientSecretariat: "",
    recipientRole: "",
    salutation: "",
    salutationOption: "",
    subject: "",
    baseText: "",
    baseHtml: "",
    finalText: "",
    finalHtml: "",
    signatories: [],
    photos: [],
    complete: false,
  };
}

function createNotificationState(saved = {}, kind = "notification") {
  return {
    city: saved[`${kind}City`] || "Bertioga",
    date: todayInputValue(),
    number: "",
    process: "",
    work: "",
    contractor: "",
    baseText: "",
    finalText: "",
    signatories: [{ id: makeId(`${kind}-signer`), profileId: "", name: "", role: "" }],
    photos: [],
    complete: false,
  };
}

function todayInputValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function scheduleSave() {
  clearTimeout(saveTimer);
  elements.saveStatus.textContent = "Salvando preferências…";
  saveTimer = setTimeout(() => {
    try {
      const preferences = {
        organization: state.report.organization || state.cota.organization || state.correspondence.organization,
        department: state.report.department || state.cota.department || state.correspondence.department,
        onePerPage: state.report.onePerPage,
        startPhotosNewPage: state.report.startPhotosNewPage,
        memorandumCity: state.correspondence.kind === "memorando" ? state.correspondence.place : (persisted.memorandumCity || "Bertioga"),
        notificationCity: state.notification.city,
        warningCity: state.warning.city,
      };
      localStorage.setItem("docflow-preferences", JSON.stringify(preferences));
      elements.saveStatus.textContent = "Preferências locais";
    } catch {
      elements.saveStatus.textContent = "Preferências desta sessão";
    }
  }, 350);
}

function e(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  if (!value) return "Não informada";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function formatDateLong(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  const months = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  const monthName = months[Number(month) - 1];
  return monthName ? `${Number(day)} de ${monthName} de ${year}` : formatDate(value);
}

function slugify(value, fallback = "documento") {
  const slug = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70);
  return slug || fallback;
}

function makeId(prefix) {
  if (crypto?.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getSelectedModel(api = state.api) {
  return api.model === "custom" ? api.customModel.trim() : api.model;
}

function isApiReady() {
  return Boolean(state.api.hasKey && getSelectedModel());
}

function updateApiBadge() {
  const connected = isApiReady();
  elements.apiButton.classList.toggle("is-connected", connected);
  elements.apiButtonLabel.textContent = connected ? modelDisplayName(getSelectedModel()) : "Configurar IA";
}

function modelDisplayName(model) {
  const labels = {
    "gpt-5.6-sol": "GPT-5.6 Sol",
    "gpt-5.6-terra": "GPT-5.6 Terra",
    "gpt-5.6-luna": "GPT-5.6 Luna",
  };
  return labels[model] || model || "Configurar IA";
}

function sortedSignatureProfiles() {
  return [...state.signatures.items].sort((left, right) =>
    `${left.name}\n${left.role}`.localeCompare(`${right.name}\n${right.role}`, "pt-BR", { sensitivity: "base" }),
  );
}

function signatureSelectOptions(selectedProfileId = "", placeholder = "Selecione uma assinatura") {
  const profiles = sortedSignatureProfiles();
  const statusLabel = state.signatures.loading
    ? "Carregando assinaturas…"
    : state.signatures.error
      ? "Não foi possível carregar as assinaturas"
      : placeholder;
  return `<option value="" ${selectedProfileId ? "" : "selected"}>${e(statusLabel)}</option>
    ${profiles.map((profile) => `<option value="${e(profile.id)}" ${profile.id === selectedProfileId ? "selected" : ""}>${e(profile.name)} — ${e(profile.role)}</option>`).join("")}
    <option value="${OTHER_SIGNATURE_VALUE}">Outro — cadastrar nova assinatura</option>`;
}

function signaturePreview(profile, emptyText = "Nenhuma assinatura selecionada") {
  if (!profile?.name || !profile?.role) {
    return `<div class="signature-preview is-empty"><span>${e(emptyText)}</span></div>`;
  }
  return `<div class="signature-preview"><strong>${e(profile.name)}</strong><em>${e(profile.role)}</em></div>`;
}

function renderCorrespondenceSignatureSelector() {
  const c = state.correspondence;
  return `<label class="field signature-select-field">
      <span>Adicionar pessoa</span>
      <select data-signature-target="correspondence" ${state.signatures.loading ? "disabled" : ""}>${signatureSelectOptions("", "Selecione uma pessoa")}</select>
    </label>
    <div class="selected-signature-list">
      ${c.signatories.length ? c.signatories.map((signature, index) => `<article class="selected-signature-card">
        <span class="signatory-index">${String(index + 1).padStart(2, "0")}</span>
        <div class="signature-profile-copy"><strong>${e(signature.name)}</strong><em>${e(signature.role)}</em></div>
        <button class="icon-button" type="button" data-action="remove-correspondence-signature" data-index="${index}" aria-label="Remover assinatura de ${e(signature.name)}" title="Remover">×</button>
      </article>`).join("") : `<div class="signature-profile-state"><strong>Nenhuma assinatura selecionada</strong><span>Use o dropdown acima para adicionar uma ou mais pessoas.</span></div>`}
    </div>`;
}

async function loadSignatureProfiles() {
  if (!state.auth.user || state.signatures.loading) return;
  state.signatures.loading = true;
  state.signatures.error = "";
  render();
  try {
    const payload = await apiRequest("/api/signatures");
    state.signatures.items = Array.isArray(payload.signatures) ? payload.signatures : [];
    state.signatures.loaded = true;
  } catch (error) {
    state.signatures.error = error.message;
  } finally {
    state.signatures.loading = false;
    render();
    if (elements.signatureDialog.open) renderSignatureProfileList();
  }
}

function setSignatureFeedback(message = "", kind = "error") {
  elements.signatureFeedback.textContent = message;
  elements.signatureFeedback.className = `inline-feedback${message ? "" : " is-hidden"}${kind === "error" ? " is-error" : ""}`;
}

function resetSignatureProfileForm() {
  elements.signatureProfileForm.reset();
  elements.signatureProfileId.value = "";
  elements.signatureFormTitle.textContent = "Adicionar assinatura";
  elements.saveSignatureButton.textContent = "Salvar assinatura";
  elements.cancelSignatureEditButton.classList.add("is-hidden");
  setSignatureFeedback("");
}

function renderSignatureProfileList() {
  const profiles = sortedSignatureProfiles();
  if (state.signatures.loading) {
    elements.signatureProfileList.innerHTML = `<div class="signature-profile-state">Carregando assinaturas…</div>`;
    return;
  }
  if (state.signatures.error) {
    elements.signatureProfileList.innerHTML = `<div class="signature-profile-state is-error"><strong>Não foi possível carregar</strong><span>${e(state.signatures.error)}</span><button class="button button-secondary" type="button" data-action="reload-signatures">Tentar novamente</button></div>`;
    return;
  }
  elements.signatureProfileList.innerHTML = profiles.length
    ? profiles.map((profile) => `<article class="signature-profile-item">
        <div class="signature-profile-copy"><strong>${e(profile.name)}</strong><em>${e(profile.role)}</em></div>
        <div class="signature-profile-actions">
          <button class="button button-quiet" type="button" data-action="edit-signature-profile" data-id="${e(profile.id)}">Editar</button>
          <button class="icon-button" type="button" data-action="delete-signature-profile" data-id="${e(profile.id)}" aria-label="Excluir assinatura de ${e(profile.name)}" title="Excluir">×</button>
        </div>
      </article>`).join("")
    : `<div class="signature-profile-state"><strong>Nenhuma assinatura cadastrada</strong><span>Preencha o nome e o cargo abaixo para criar a primeira.</span></div>`;
}

function openSignatureConfiguration(options = {}) {
  if (options.pendingTarget) pendingSignatureTarget = options.pendingTarget;
  resetSignatureProfileForm();
  renderSignatureProfileList();
  openDialog(elements.signatureDialog);
  if (options.focusForm) requestAnimationFrame(() => elements.signatureNameInput.focus());
}

function closeSignatureConfiguration() {
  pendingSignatureTarget = null;
  resetSignatureProfileForm();
  closeDialog(elements.signatureDialog);
}

function editSignatureProfile(profileId) {
  const profile = state.signatures.items.find((item) => item.id === profileId);
  if (!profile) return;
  elements.signatureProfileId.value = profile.id;
  elements.signatureNameInput.value = profile.name;
  elements.signatureRoleInput.value = profile.role;
  elements.signatureFormTitle.textContent = "Editar assinatura";
  elements.saveSignatureButton.textContent = "Salvar alterações";
  elements.cancelSignatureEditButton.classList.remove("is-hidden");
  setSignatureFeedback("");
  elements.signatureNameInput.focus();
}

function applySignatureProfile(target, profile) {
  if (!target || !profile) return;
  if (target.type === "report") {
    if (state.report.responsibles.some((item) => item.profileId === profile.id)) {
      showToast("Essa assinatura já foi adicionada ao relatório.");
      return;
    }
    state.report.responsibles.push({ profileId: profile.id, name: profile.name, role: profile.role });
  } else if (target.type === "cota") {
    state.cota.signerProfileId = profile.id;
    state.cota.signer = profile.name;
    state.cota.signerRole = profile.role;
  } else if (target.type === "correspondence") {
    if (state.correspondence.signatories.some((item) => item.profileId === profile.id)) {
      showToast("Essa assinatura já foi adicionada ao documento.");
      return;
    }
    state.correspondence.signatories.push({ profileId: profile.id, name: profile.name, role: profile.role });
  } else if (target.type === "notice") {
    const signatory = noticeState().signatories.find((item) => item.id === target.signatoryId);
    if (signatory) {
      signatory.profileId = profile.id;
      signatory.name = profile.name;
      signatory.role = profile.role;
    }
  }
}

function updateSignatureReferences(profile) {
  state.report.responsibles = state.report.responsibles.map((item) =>
    item.profileId === profile.id ? { profileId: profile.id, name: profile.name, role: profile.role } : item,
  );
  if (state.cota.signerProfileId === profile.id) {
    state.cota.signer = profile.name;
    state.cota.signerRole = profile.role;
  }
  state.correspondence.signatories = state.correspondence.signatories.map((item) =>
    item.profileId === profile.id ? { profileId: profile.id, name: profile.name, role: profile.role } : item,
  );
  [state.notification, state.warning].forEach((notice) => {
    notice.signatories.forEach((signatory) => {
      if (signatory.profileId === profile.id) {
        signatory.name = profile.name;
        signatory.role = profile.role;
      }
    });
  });
}

async function saveSignatureProfile() {
  if (state.signatures.saving) return;
  const profileId = elements.signatureProfileId.value;
  const name = elements.signatureNameInput.value.trim();
  const role = elements.signatureRoleInput.value.trim();
  if (!name || !role) {
    setSignatureFeedback("Informe o nome e o cargo ou função.");
    return;
  }

  state.signatures.saving = true;
  elements.saveSignatureButton.disabled = true;
  elements.saveSignatureButton.textContent = profileId ? "Salvando…" : "Cadastrando…";
  setSignatureFeedback("");
  try {
    const payload = await apiRequest(
      profileId ? `/api/signatures/${encodeURIComponent(profileId)}` : "/api/signatures",
      { method: profileId ? "PATCH" : "POST", body: { name, role } },
    );
    const previous = state.signatures.items.find((item) => item.id === profileId);
    const signature = { ...previous, ...payload.signature, name, role };
    if (profileId) {
      state.signatures.items = state.signatures.items.map((item) => item.id === profileId ? signature : item);
      updateSignatureReferences(signature);
    } else {
      state.signatures.items.push(signature);
    }

    const target = pendingSignatureTarget;
    if (target) applySignatureProfile(target, signature);
    resetSignatureProfileForm();
    renderSignatureProfileList();
    render();
    showToast(profileId ? "Assinatura atualizada." : "Assinatura cadastrada.");
    if (target) {
      pendingSignatureTarget = null;
      closeDialog(elements.signatureDialog);
      focusMain();
    }
  } catch (error) {
    setSignatureFeedback(error.message);
  } finally {
    state.signatures.saving = false;
    elements.saveSignatureButton.disabled = false;
    if (elements.signatureProfileId.value) elements.saveSignatureButton.textContent = "Salvar alterações";
    else elements.saveSignatureButton.textContent = "Salvar assinatura";
  }
}

function confirmSignatureProfileDelete(profileId) {
  const profile = state.signatures.items.find((item) => item.id === profileId);
  if (!profile) return;
  closeDialog(elements.signatureDialog);
  showMessage({
    title: "Excluir assinatura?",
    text: `${profile.name} — ${profile.role} deixará de aparecer nos dropdowns. Documentos em preenchimento manterão os dados já selecionados.`,
    actions: [
      { label: "Cancelar", onClick: () => openSignatureConfiguration() },
      { label: "Excluir", primary: true, onClick: () => deleteSignatureProfile(profile, pendingSignatureTarget) },
    ],
  });
}

async function deleteSignatureProfile(profile, targetAfterDelete = null) {
  try {
    await apiRequest(`/api/signatures/${encodeURIComponent(profile.id)}`, { method: "DELETE" });
    state.signatures.items = state.signatures.items.filter((item) => item.id !== profile.id);
    state.report.responsibles = state.report.responsibles.map((item) =>
      item.profileId === profile.id ? { ...item, profileId: "" } : item,
    );
    if (state.cota.signerProfileId === profile.id) state.cota.signerProfileId = "";
    state.correspondence.signatories = state.correspondence.signatories.map((item) =>
      item.profileId === profile.id ? { ...item, profileId: "" } : item,
    );
    [state.notification, state.warning].forEach((notice) => {
      notice.signatories.forEach((signatory) => {
        if (signatory.profileId === profile.id) signatory.profileId = "";
      });
    });
    render();
    showToast("Assinatura excluída.");
    if (targetAfterDelete) {
      openSignatureConfiguration({ pendingTarget: targetAfterDelete, focusForm: true });
    } else {
      pendingSignatureTarget = null;
    }
  } catch (error) {
    pendingSignatureTarget = null;
    showMessage({ title: "Não foi possível excluir", text: error.message, kind: "error" });
  }
}

function handleSignatureSelection(select) {
  const target = select.dataset.signatureTarget === "report"
    ? { type: "report" }
    : select.dataset.signatureTarget === "cota"
      ? { type: "cota" }
    : select.dataset.signatureTarget === "correspondence"
      ? { type: "correspondence" }
      : { type: "notice", signatoryId: select.dataset.id };
  if (select.value === OTHER_SIGNATURE_VALUE) {
    if (target.type === "cota") select.value = state.cota.signerProfileId;
    else if (target.type === "correspondence") select.value = "";
    else if (target.type === "notice") {
      select.value = noticeState().signatories.find((item) => item.id === target.signatoryId)?.profileId || "";
    } else select.value = "";
    openSignatureConfiguration({ pendingTarget: target, focusForm: true });
    return;
  }
  const profile = state.signatures.items.find((item) => item.id === select.value);
  if (profile) applySignatureProfile(target, profile);
  render();
}

class ApiRequestError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

async function apiRequest(url, options = {}) {
  const requestOptions = { ...options };
  const headers = new Headers(requestOptions.headers || {});
  headers.set("Accept", "application/json");
  if (requestOptions.body && typeof requestOptions.body !== "string" && !(requestOptions.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
    requestOptions.body = JSON.stringify(requestOptions.body);
  }
  requestOptions.headers = headers;

  let response;
  try {
    response = await fetch(url, requestOptions);
  } catch {
    throw new ApiRequestError("Não foi possível acessar o servidor. Verifique sua conexão.", 0);
  }

  let data = {};
  try {
    data = await response.json();
  } catch {
    // Mantém uma mensagem segura quando a resposta não é JSON.
  }
  if (!response.ok) {
    throw new ApiRequestError(data?.error?.message || "Não foi possível concluir a solicitação.", response.status);
  }
  return data;
}

function showAuthView(view) {
  const isRegister = view === "register";
  elements.loginForm.classList.toggle("is-hidden", isRegister);
  elements.registerForm.classList.toggle("is-hidden", !isRegister);
  elements.loginTab.classList.toggle("is-active", !isRegister);
  elements.registerTab.classList.toggle("is-active", isRegister);
  elements.loginTab.setAttribute("aria-selected", String(!isRegister));
  elements.registerTab.setAttribute("aria-selected", String(isRegister));
  setAuthFeedback(elements.loginFeedback, "");
  setAuthFeedback(elements.registerFeedback, "");
  setTimeout(() => (isRegister ? elements.registerName : elements.loginEmail).focus(), 50);
}

function setAuthFeedback(element, message, kind = "error") {
  element.textContent = message;
  element.className = `inline-feedback${message ? "" : " is-hidden"}${kind === "error" ? " is-error" : ""}`;
}

function setFormBusy(form, busy, busyLabel) {
  const submit = form.querySelector("button[type='submit']");
  if (!submit) return;
  if (!submit.dataset.defaultLabel) submit.dataset.defaultLabel = submit.textContent;
  submit.disabled = busy;
  submit.textContent = busy ? busyLabel : submit.dataset.defaultLabel;
}

function applyAccount(payload) {
  state.auth.user = payload.user;
  state.signatures = createSignatureConfigurationState();
  state.admin = createAdminState();
  state.kanban = createKanbanState();
  const selectedModel = payload.api?.model || "gpt-5.6-terra";
  const knownModels = new Set(["gpt-5.6-terra", "gpt-5.6-sol", "gpt-5.6-luna"]);
  state.api = {
    hasKey: Boolean(payload.api?.hasKey),
    lastFour: payload.api?.lastFour || "",
    model: knownModels.has(selectedModel) ? selectedModel : "custom",
    customModel: knownModels.has(selectedModel) ? "" : selectedModel,
  };
  const isAdmin = Boolean(payload.user?.isAdmin);
  elements.adminButton.classList.remove("has-pending");
  elements.adminButton.classList.toggle("is-hidden", !isAdmin);
  elements.accountName.textContent = payload.user?.name || payload.user?.email || "";
  elements.authGate.classList.add("is-hidden");
  elements.siteShell.hidden = false;
  elements.siteShell.classList.remove("is-hidden");
  render();
  loadSignatureProfiles();
  loadDocumentHistory();
  loadKanbanNotifications({ silent: true });
  startNotificationPolling();
  if (isAdmin) loadAdminUsers({ silent: true });
}

function showAuthGate(view = "login") {
  state.auth.user = null;
  state.signatures = createSignatureConfigurationState();
  state.admin = createAdminState();
  state.kanban = createKanbanState();
  stopNotificationPolling();
  state.history.pdfCache.forEach((cached) => cached.url && URL.revokeObjectURL(cached.url));
  state.history = createHistoryState();
  elements.adminButton.classList.add("is-hidden");
  elements.adminButton.classList.remove("has-pending");
  elements.adminPendingBadge.classList.add("is-hidden");
  elements.adminPendingBadge.textContent = "";
  elements.notificationBadge.classList.add("is-hidden");
  elements.notificationBadge.textContent = "";
  elements.notificationPopover.classList.add("is-hidden");
  elements.notificationButton.setAttribute("aria-expanded", "false");
  elements.siteShell.hidden = true;
  elements.siteShell.classList.add("is-hidden");
  elements.authGate.classList.remove("is-hidden");
  elements.loginPassword.value = "";
  elements.registerPassword.value = "";
  elements.registerPasswordConfirmation.value = "";
  showAuthView(view);
}

async function bootstrapAuth() {
  try {
    const account = await apiRequest("/api/auth/session");
    applyAccount(account);
  } catch (error) {
    showAuthGate("login");
    if (error.status && error.status !== 401) {
      setAuthFeedback(elements.loginFeedback, error.message);
    }
  }
}

async function submitLogin() {
  setAuthFeedback(elements.loginFeedback, "");
  setFormBusy(elements.loginForm, true, "Entrando…");
  try {
    const account = await apiRequest("/api/auth/login", {
      method: "POST",
      body: {
        email: elements.loginEmail.value.trim(),
        password: elements.loginPassword.value,
      },
    });
    applyAccount(account);
    elements.loginForm.reset();
  } catch (error) {
    setAuthFeedback(elements.loginFeedback, error.message);
  } finally {
    setFormBusy(elements.loginForm, false, "");
  }
}

async function submitRegistration() {
  setAuthFeedback(elements.registerFeedback, "");
  if (elements.registerPassword.value !== elements.registerPasswordConfirmation.value) {
    setAuthFeedback(elements.registerFeedback, "As senhas informadas não coincidem.");
    return;
  }
  setFormBusy(elements.registerForm, true, "Criando conta…");
  try {
    const result = await apiRequest("/api/auth/register", {
      method: "POST",
      body: {
        name: elements.registerName.value.trim(),
        email: elements.registerEmail.value.trim(),
        password: elements.registerPassword.value,
      },
    });
    elements.registerForm.reset();
    showAuthView("login");
    elements.loginEmail.value = result.user?.email || "";
    setAuthFeedback(
      elements.loginFeedback,
      result.message || "Solicitação enviada. Aguarde a aprovação do administrador.",
      "success",
    );
    showToast("Solicitação de cadastro enviada.");
  } catch (error) {
    setAuthFeedback(elements.registerFeedback, error.message);
  } finally {
    setFormBusy(elements.registerForm, false, "");
  }
}

async function logout() {
  try {
    await apiRequest("/api/auth/logout", { method: "POST" });
  } catch {
    // A sessão local também é encerrada quando o servidor está indisponível.
  }
  state.flow = null;
  showAuthGate("login");
}

function showToast(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  toastTimer = setTimeout(() => elements.toast.classList.remove("is-visible"), 3800);
}

function showMessage({ title = "Atenção", text, kind = "warning", actions }) {
  elements.messageTitle.textContent = title;
  elements.messageText.textContent = text;
  elements.messageIcon.textContent = kind === "success" ? "✓" : kind === "error" ? "×" : "!";
  elements.messageIcon.className = `message-icon${kind === "success" ? " is-success" : kind === "error" ? " is-error" : ""}`;
  elements.messageActions.innerHTML = "";
  state.messageCallbacks.clear();

  const normalized = actions || [{ label: "Entendi", primary: true }];
  normalized.forEach((action, index) => {
    const id = `message-action-${index}`;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `button ${action.danger ? "button-danger-solid" : action.primary ? "button-primary" : "button-secondary"}`;
    button.textContent = action.label;
    button.dataset.action = id;
    elements.messageActions.appendChild(button);
    state.messageCallbacks.set(id, action.onClick || null);
  });
  openDialog(elements.messageDialog);
}

function openDialog(dialog) {
  if (typeof dialog.showModal === "function") {
    if (!dialog.open) dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
  }
}

function closeDialog(dialog) {
  if (typeof dialog.close === "function" && dialog.open) dialog.close();
  else dialog.removeAttribute("open");
}

function pageHeading(kicker, title, description) {
  return `<header class="page-heading">
    <span class="eyebrow eyebrow-dark">${e(kicker)}</span>
    <h1>${e(title)}</h1>
    <p>${e(description)}</p>
  </header>`;
}

function panelHeader(title, description, action = "") {
  return `<div class="panel-header">
    <div><h2>${e(title)}</h2>${description ? `<p>${e(description)}</p>` : ""}</div>
    ${action}
  </div>`;
}

function render() {
  updateApiBadge();
  elements.main.classList.toggle("is-home", !state.admin.open && !state.history.open && !state.kanban.open && !state.flow);
  if (state.admin.open) {
    elements.sidebar.classList.add("is-hidden");
    elements.actionBar.classList.add("is-hidden");
    elements.view.className = "view home-view";
    elements.view.innerHTML = renderAdminPanel();
    return;
  }
  if (state.history.open) {
    elements.sidebar.classList.add("is-hidden");
    elements.actionBar.classList.add("is-hidden");
    elements.view.className = "view home-view";
    elements.view.innerHTML = renderDocumentHistory();
    return;
  }
  if (state.kanban.open) {
    elements.sidebar.classList.add("is-hidden");
    elements.actionBar.classList.add("is-hidden");
    elements.view.className = "view home-view kanban-view";
    elements.view.innerHTML = renderKanban();
    return;
  }
  if (!state.flow) {
    elements.sidebar.classList.add("is-hidden");
    elements.actionBar.classList.add("is-hidden");
    elements.view.className = "view home-view";
    elements.view.innerHTML = renderHome();
    return;
  }

  elements.sidebar.classList.remove("is-hidden");
  elements.view.className = "view";
  renderSidebar();

  if (state.generation.running) {
    elements.actionBar.classList.add("is-hidden");
    elements.view.innerHTML = renderProgress();
  } else if (currentData().complete) {
    elements.actionBar.classList.add("is-hidden");
    elements.view.innerHTML = renderSuccess();
  } else {
    elements.actionBar.classList.remove("is-hidden");
    elements.view.innerHTML = state.flow === "report"
      ? renderReport()
      : state.flow === "cota"
        ? renderCota()
        : isNoticeFlow()
          ? renderNotification()
          : isOfficialCorrespondenceFlow()
            ? renderOfficialCorrespondence()
            : renderCorrespondence();
    configureActionBar();
    if (state.validationFields.length) requestAnimationFrame(applyValidationHighlights);
  }
}

function currentData() {
  if (state.flow === "report") return state.report;
  if (state.flow === "cota") return state.cota;
  if (isNoticeFlow()) return noticeState();
  return state.correspondence;
}

function currentSteps() {
  if (state.flow === "report") return REPORT_STEPS;
  if (state.flow === "cota") return COTA_STEPS;
  if (state.flow === "notification") return NOTIFICATION_STEPS;
  if (state.flow === "warning") return WARNING_STEPS;
  if (isOfficialCorrespondenceFlow()) return OFFICIAL_CORRESPONDENCE_STEPS;
  return CORRESPONDENCE_STEPS;
}

function renderSidebar() {
  if (state.flow === "report") {
    elements.flowEyebrow.textContent = "Relatório fotográfico";
    elements.flowTitle.textContent = "Monte seu relatório";
    elements.flowDescription.textContent = "Organize informações, fotos e assinaturas.";
  } else if (state.flow === "cota") {
    elements.flowEyebrow.textContent = "Folha de cota";
    elements.flowTitle.textContent = "Prepare o despacho";
    elements.flowDescription.textContent = "Revise a redação e baixe o Word pronto.";
  } else if (isNoticeFlow()) {
    const notice = noticeCopy();
    elements.flowEyebrow.textContent = notice.label;
    elements.flowTitle.textContent = `Prepare a ${notice.lower}`;
    elements.flowDescription.textContent = "Use o timbre oficial, assinaturas e fotos opcionais.";
  } else if (isOfficialCorrespondenceFlow()) {
    const type = correspondenceType();
    elements.flowEyebrow.textContent = type.label;
    elements.flowTitle.textContent = `Prepare ${type.article} ${type.label.toLowerCase()}`;
    elements.flowDescription.textContent = "Use o modelo oficial da Prefeitura de Bertioga.";
  } else {
    const type = correspondenceType();
    elements.flowEyebrow.textContent = type.label;
    elements.flowTitle.textContent = `Prepare ${type.article} ${type.label.toLowerCase()}`;
    elements.flowDescription.textContent = "Preencha os dados, revise o conteúdo e baixe o Word.";
  }

  elements.stepNav.innerHTML = currentSteps()
    .map((label, index) => {
      const className = index === state.step ? "is-active" : index < state.step ? "is-done" : "";
      const number = index < state.step ? "✓" : index + 1;
      return `<button class="step-link ${className}" type="button" data-action="go-step" data-step="${index}" ${index > state.step ? "disabled" : ""}>
        <span class="step-number">${number}</span><span class="step-label">${e(label)}</span>
      </button>`;
    })
    .join("");
}

function configureActionBar() {
  const lastStep = state.step === currentSteps().length - 1;
  elements.backButton.disabled = false;
  elements.nextButton.disabled = false;
  elements.nextButton.innerHTML = lastStep
    ? `Gerar documento <span aria-hidden="true">↓</span>`
    : `Continuar <span aria-hidden="true">→</span>`;
  elements.actionHint.textContent = lastStep ? "Pronto para criar o arquivo" : `Etapa ${state.step + 1} de ${currentSteps().length}`;
}

function renderHome() {
  return `<section class="document-section">
    <div class="document-grid">
      <article class="document-card" tabindex="0" role="button" data-action="start-report">
        <span class="card-status is-development">Em desenvolvimento</span>
        <span class="card-number" aria-hidden="true">01</span><span class="card-icon" aria-hidden="true">▧</span>
        <h3>Relatório fotográfico</h3>
        <p>Monte um relatório técnico com introdução, seções, fotografias, descrições e assinaturas.</p>
        <span class="card-link">Começar relatório <span aria-hidden="true">→</span></span>
      </article>
      <article class="document-card is-cota" tabindex="0" role="button" data-action="start-cota">
        <span class="card-status is-ready">Pronto</span>
        <span class="card-number" aria-hidden="true">02</span><span class="card-icon" aria-hidden="true">≡</span>
        <h3>Folha de cota</h3>
        <p>Transforme uma anotação em redação administrativa e distribua o texto em uma folha pautada.</p>
        <span class="card-link">Preparar folha <span aria-hidden="true">→</span></span>
      </article>
      <article class="document-card is-admin" tabindex="0" role="button" data-action="start-correspondence" data-kind="memorando">
        <span class="card-status is-ready">Pronto</span>
        <span class="card-number" aria-hidden="true">03</span><span class="card-icon" aria-hidden="true">M</span>
        <h3>Memorando</h3>
        <p>Gere o memorando no modelo oficial da Prefeitura de Bertioga, com assinatura e fotos opcionais.</p>
        <span class="card-link">Criar memorando <span aria-hidden="true">→</span></span>
      </article>
      <article class="document-card is-admin" tabindex="0" role="button" data-action="start-correspondence" data-kind="oficio">
        <span class="card-status is-ready">Pronto</span>
        <span class="card-number" aria-hidden="true">04</span><span class="card-icon" aria-hidden="true">O</span>
        <h3>Ofício</h3>
        <p>Gere o ofício no modelo oficial da Prefeitura de Bertioga, com assinatura e fotos opcionais.</p>
        <span class="card-link">Criar ofício <span aria-hidden="true">→</span></span>
      </article>
      <article class="document-card is-alert" tabindex="0" role="button" data-action="start-notification">
        <span class="card-status is-ready">Pronto</span>
        <span class="card-number" aria-hidden="true">05</span><span class="card-icon" aria-hidden="true">N</span>
        <h3>Notificação</h3>
        <p>Gere a notificação no modelo oficial da Prefeitura de Bertioga, com assinaturas e fotos opcionais.</p>
        <span class="card-link">Criar notificação <span aria-hidden="true">→</span></span>
      </article>
      <article class="document-card is-alert" tabindex="0" role="button" data-action="start-warning">
        <span class="card-status is-ready">Pronto</span>
        <span class="card-number" aria-hidden="true">06</span><span class="card-icon" aria-hidden="true">A</span>
        <h3>Advertência</h3>
        <p>Gere a advertência no modelo oficial da Prefeitura de Bertioga, com assinaturas e fotos opcionais.</p>
        <span class="card-link">Criar advertência <span aria-hidden="true">→</span></span>
      </article>
    </div>
  </section>`;
}

function renderAdminPanel() {
  const users = state.admin.users;
  const pendingUsers = users.filter((user) => user.status === "pending");
  const reviewedUsers = users.filter((user) => user.status !== "pending");
  const approvedCount = users.filter((user) => user.status === "approved").length;
  const rejectedCount = users.filter((user) => user.status === "rejected").length;
  const errorNotice = state.admin.error
    ? `<div class="notice is-warning"><span aria-hidden="true">!</span><span>${e(state.admin.error)}</span></div>`
    : "";

  const pendingContent = state.admin.loading && !state.admin.loaded
    ? renderAdminLoading("Carregando solicitações…")
    : pendingUsers.length
      ? `<div class="admin-user-list">${pendingUsers.map(renderAdminUser).join("")}</div>`
      : `<div class="admin-empty-state"><strong>Nenhuma solicitação pendente</strong><span>Novos pedidos de cadastro aparecerão aqui.</span></div>`;

  const reviewedContent = state.admin.loading && !state.admin.loaded
    ? renderAdminLoading("Carregando usuários…")
    : reviewedUsers.length
      ? `<div class="admin-user-list">${reviewedUsers.map(renderAdminUser).join("")}</div>`
      : `<div class="admin-empty-state"><strong>Nenhum usuário revisado</strong><span>As contas aprovadas ou recusadas aparecerão aqui.</span></div>`;

  return `<section class="document-section admin-section">
    <div class="admin-heading">
      <div><span class="eyebrow eyebrow-dark">Acesso restrito</span><h2>Administração de usuários</h2><p>Revise solicitações de cadastro e acompanhe o último acesso registrado de cada pessoa.</p></div>
      <div class="admin-heading-actions">
        <button class="button button-secondary" type="button" data-action="home">← Voltar</button>
        <button class="button button-secondary" type="button" data-action="refresh-admin" ${state.admin.loading ? "disabled" : ""}>Atualizar</button>
      </div>
    </div>
    <div class="admin-summary" aria-label="Resumo dos usuários">
      <article><span>Pendentes</span><strong>${pendingUsers.length}</strong></article>
      <article><span>Aprovados</span><strong>${approvedCount}</strong></article>
      <article><span>Recusados</span><strong>${rejectedCount}</strong></article>
    </div>
    ${errorNotice}
    <section class="admin-group" aria-labelledby="pendingUsersTitle">
      <div class="admin-group-heading"><div><span class="eyebrow eyebrow-dark">Aguardando decisão</span><h3 id="pendingUsersTitle">Solicitações pendentes</h3></div><span class="admin-count">${pendingUsers.length}</span></div>
      ${pendingContent}
    </section>
    <section class="admin-group" aria-labelledby="reviewedUsersTitle">
      <div class="admin-group-heading"><div><span class="eyebrow eyebrow-dark">Contas cadastradas</span><h3 id="reviewedUsersTitle">Usuários revisados</h3></div><span class="admin-count">${reviewedUsers.length}</span></div>
      ${reviewedContent}
    </section>
  </section>`;
}

function renderAdminLoading(message) {
  return `<div class="admin-empty-state"><span class="history-spinner" aria-hidden="true"></span><strong>${e(message)}</strong></div>`;
}

function renderAdminUser(user) {
  const busyAction = state.admin.busy.get(user.id) || "";
  const disabled = busyAction ? "disabled" : "";
  const statusLabel = user.isAdmin
    ? "Administrador"
    : user.status === "approved"
      ? "Aprovado"
      : user.status === "rejected"
        ? "Recusado"
        : "Pendente";
  const actions = user.isAdmin
    ? `<span class="admin-protected-label">Conta protegida</span>`
    : `<div class="admin-user-actions">
        ${user.status !== "approved" ? `<button class="button button-primary" type="button" data-action="approve-admin-user" data-id="${e(user.id)}" ${disabled}>${busyAction === "approved" ? "Aprovando…" : "Aprovar"}</button>` : ""}
        ${user.status !== "rejected" ? `<button class="button button-secondary button-danger" type="button" data-action="reject-admin-user" data-id="${e(user.id)}" ${disabled}>${busyAction === "rejected" ? "Recusando…" : "Recusar"}</button>` : ""}
        <button class="button button-secondary button-danger" type="button" data-action="delete-admin-user" data-id="${e(user.id)}" ${disabled}>${busyAction === "delete" ? "Excluindo…" : "Excluir"}</button>
      </div>`;
  return `<article class="admin-user-item">
    <span class="admin-user-avatar" aria-hidden="true">${e(String(user.name || user.email || "U").slice(0, 1).toUpperCase())}</span>
    <div class="admin-user-copy">
      <div class="admin-user-title"><strong>${e(user.name)}</strong><span class="admin-status is-${e(user.isAdmin ? "admin" : user.status)}">${e(statusLabel)}</span></div>
      <span>${e(user.email)}</span>
      <small>Solicitação: ${e(formatHistoryDate(user.createdAt))} • Último acesso: ${e(user.lastLoginAt ? formatHistoryDate(user.lastLoginAt) : "Ainda não acessou")}</small>
    </div>
    ${actions}
  </article>`;
}

function updateAdminBadge() {
  const pendingCount = state.admin.users.filter((user) => user.status === "pending").length;
  elements.adminPendingBadge.textContent = pendingCount ? String(pendingCount) : "";
  elements.adminPendingBadge.classList.toggle("is-hidden", pendingCount === 0);
  elements.adminButton.classList.toggle("has-pending", pendingCount > 0);
  elements.adminButton.setAttribute(
    "aria-label",
    pendingCount
      ? `Abrir administração de usuários. ${pendingCount} solicitação(ões) pendente(s).`
      : "Abrir administração de usuários",
  );
}

async function loadAdminUsers({ silent = false } = {}) {
  if (!state.auth.user?.isAdmin || state.admin.loading) return;
  state.admin.loading = true;
  state.admin.error = "";
  if (state.admin.open) render();
  try {
    const payload = await apiRequest("/api/admin/users");
    state.admin.users = Array.isArray(payload.users) ? payload.users : [];
    state.admin.loaded = true;
    updateAdminBadge();
  } catch (error) {
    state.admin.error = error.message;
    if (!silent) showToast("Não foi possível carregar os usuários.");
  } finally {
    state.admin.loading = false;
    if (state.admin.open) render();
  }
}

function showAdminPanel() {
  if (!state.auth.user?.isAdmin) return;
  state.flow = null;
  state.history.open = false;
  state.kanban.open = false;
  state.admin.open = true;
  render();
  focusMain();
  if (!state.admin.loaded) loadAdminUsers();
}

async function setAdminUserStatus(userId, status) {
  if (!state.auth.user?.isAdmin || state.admin.busy.has(userId)) return;
  state.admin.busy.set(userId, status);
  state.admin.error = "";
  if (state.admin.open) render();
  try {
    const payload = await apiRequest(`/api/admin/users/${encodeURIComponent(userId)}`, {
      method: "PATCH",
      body: { status },
    });
    state.admin.users = state.admin.users.map((user) => user.id === userId ? payload.user : user);
    updateAdminBadge();
    showToast(status === "approved" ? "Acesso aprovado." : "Acesso recusado.");
  } catch (error) {
    state.admin.error = error.message;
  } finally {
    state.admin.busy.delete(userId);
    if (state.admin.open) render();
  }
}

function confirmAdminUserRejection(userId) {
  const user = state.admin.users.find((item) => item.id === userId);
  if (!user || user.isAdmin) return;
  showMessage({
    title: "Recusar acesso?",
    text: `${user.name} não poderá entrar na plataforma enquanto a conta estiver recusada.`,
    actions: [
      { label: "Cancelar" },
      { label: "Recusar acesso", primary: true, onClick: () => setAdminUserStatus(userId, "rejected") },
    ],
  });
}

async function deleteAdminUser(userId) {
  if (!state.auth.user?.isAdmin || state.admin.busy.has(userId)) return;
  state.admin.busy.set(userId, "delete");
  state.admin.error = "";
  if (state.admin.open) render();
  try {
    await apiRequest(`/api/admin/users/${encodeURIComponent(userId)}`, {
      method: "DELETE",
    });
    state.admin.users = state.admin.users.filter((user) => user.id !== userId);
    updateAdminBadge();
    showToast("Usuário excluído definitivamente.");
  } catch (error) {
    state.admin.error = error.message;
  } finally {
    state.admin.busy.delete(userId);
    if (state.admin.open) render();
  }
}

function confirmAdminUserDeletion(userId) {
  const user = state.admin.users.find((item) => item.id === userId);
  if (!user || user.isAdmin) return;
  showMessage({
    title: "Excluir usuário definitivamente?",
    text: `${user.name} perderá o acesso e todos os documentos, assinaturas e configurações dessa conta serão removidos. Esta ação não pode ser desfeita.`,
    kind: "error",
    actions: [
      { label: "Cancelar" },
      { label: "Excluir definitivamente", danger: true, onClick: () => deleteAdminUser(userId) },
    ],
  });
}

function renderDocumentHistory() {
  const history = state.history;
  const content = history.loading && !history.loaded
    ? `<div class="history-state"><span class="history-spinner" aria-hidden="true"></span><strong>Carregando seus documentos…</strong></div>`
    : history.error
      ? `<div class="history-state is-error"><strong>Não foi possível carregar o histórico</strong><span>${e(history.error)}</span><button class="button button-secondary" type="button" data-action="refresh-history">Tentar novamente</button></div>`
      : history.items.length
        ? `<div class="history-list">${history.items.map(renderHistoryItem).join("")}</div>`
        : `<div class="history-state"><strong>Seu histórico ainda está vazio</strong><span>Quando você gerar um documento, ele aparecerá aqui para visualizar, renomear e baixar.</span><button class="button button-primary" type="button" data-action="home">Criar primeiro documento</button></div>`;

  return `<section class="document-section history-section">
    <div class="history-heading">
      <div><span class="eyebrow eyebrow-dark">Arquivos gerados</span><h2>Histórico de documentos</h2><p>Somente os documentos da sua conta aparecem nesta lista.</p></div>
      <div class="history-heading-actions">
        <button class="button button-secondary" type="button" data-action="home">← Voltar</button>
        <button class="button button-secondary" type="button" data-action="refresh-history" ${history.loading ? "disabled" : ""}>Atualizar</button>
      </div>
    </div>
    ${content}
  </section>`;
}

function renderHistoryItem(document) {
  const busyAction = state.history.busy.get(document.id) || "";
  const disabled = busyAction ? "disabled" : "";
  return `<article class="history-item">
    <span class="history-file-mark" aria-hidden="true">W</span>
    <div class="history-file-copy"><strong>${e(document.filename)}</strong><span>${e(document.documentType)} • ${e(formatHistoryDate(document.createdAt))} • ${e(formatFileSize(document.sizeBytes))}</span></div>
    <div class="history-item-actions" aria-label="Ações do arquivo ${e(document.filename)}">
      <button class="button button-primary history-pdf-action" type="button" data-action="preview-history-pdf" data-id="${e(document.id)}" ${disabled}>${busyAction === "preview" ? "Preparando PDF…" : "Visualizar PDF"}<span aria-hidden="true">↗</span></button>
      <button class="button button-secondary history-pdf-action" type="button" data-action="download-history-pdf" data-id="${e(document.id)}" ${disabled}>${busyAction === "pdf" ? "Preparando PDF…" : "Baixar PDF"}<span aria-hidden="true">↓</span></button>
      <div class="history-item-tools">
        <button class="button button-quiet" type="button" data-action="download-history" data-id="${e(document.id)}" ${disabled}>Baixar Word</button>
        <button class="button button-quiet" type="button" data-action="rename-history" data-id="${e(document.id)}" ${disabled}>Renomear</button>
        <button class="button button-quiet button-danger" type="button" data-action="delete-history" data-id="${e(document.id)}" ${disabled}>${busyAction === "delete" ? "Excluindo…" : "Excluir"}</button>
      </div>
    </div>
  </article>`;
}

function formatHistoryDate(unixSeconds) {
  const date = new Date(Number(unixSeconds) * 1000);
  if (Number.isNaN(date.getTime())) return "Data não informada";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function formatFileSize(bytes) {
  const size = Number(bytes) || 0;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

async function loadDocumentHistory() {
  if (!state.auth.user || state.history.loading) return;
  state.history.loading = true;
  state.history.error = "";
  if (state.history.open) render();
  try {
    const payload = await apiRequest("/api/documents");
    state.history.items = Array.isArray(payload.documents) ? payload.documents : [];
    state.history.loaded = true;
  } catch (error) {
    state.history.error = error.message;
  } finally {
    state.history.loading = false;
    if (state.history.open) render();
  }
}

function showDocumentHistory() {
  state.flow = null;
  state.admin.open = false;
  state.kanban.open = false;
  state.history.open = true;
  render();
  focusMain();
  if (!state.history.loaded) loadDocumentHistory();
}

const KANBAN_COLUMNS = [
  { id: "todo", label: "A fazer", description: "Atividades que ainda não começaram" },
  { id: "doing", label: "Em andamento", description: "Atividades em execução" },
  { id: "done", label: "Concluído", description: "Atividades finalizadas" },
];

function renderKanban() {
  const kanban = state.kanban;
  const loading = kanban.loading && !kanban.loaded;
  const content = loading
    ? `<div class="kanban-loading"><span class="history-spinner" aria-hidden="true"></span><strong>Carregando o quadro…</strong></div>`
    : `<div class="kanban-board" aria-label="Quadro Kanban">
        ${KANBAN_COLUMNS.map((column) => renderKanbanColumn(column)).join("")}
      </div>`;
  const error = kanban.error
    ? `<div class="notice is-warning"><span aria-hidden="true">!</span><span>${e(kanban.error)}</span></div>`
    : "";

  return `<section class="document-section kanban-section">
    <div class="kanban-heading">
      <div><span class="eyebrow eyebrow-dark">Trabalho em equipe</span><h2>Quadro Kanban</h2><p>Organize as atividades, mova os cartões entre as etapas e marque as pessoas responsáveis.</p></div>
      <div class="kanban-heading-actions">
        <button class="button button-secondary" type="button" data-action="home">← Voltar</button>
        <button class="button button-secondary" type="button" data-action="refresh-kanban" ${kanban.loading ? "disabled" : ""}>Atualizar</button>
        <button class="button button-primary" type="button" data-action="add-kanban-card" ${kanban.loading ? "disabled" : ""}>+ Novo cartão</button>
      </div>
    </div>
    <div class="kanban-summary" aria-label="Resumo do quadro">
      <article><span>Total</span><strong>${kanban.cards.length}</strong></article>
      ${KANBAN_COLUMNS.map((column) => `<article><span>${e(column.label)}</span><strong>${kanban.cards.filter((card) => card.status === column.id).length}</strong></article>`).join("")}
    </div>
    ${error}
    ${content}
  </section>`;
}

function renderKanbanColumn(column) {
  const cards = state.kanban.cards.filter((card) => card.status === column.id);
  return `<section class="kanban-column" data-kanban-column="${e(column.id)}" aria-labelledby="kanban-${e(column.id)}-title">
    <div class="kanban-column-heading">
      <div><h3 id="kanban-${e(column.id)}-title">${e(column.label)}</h3><p>${e(column.description)}</p></div>
      <span>${cards.length}</span>
    </div>
    <div class="kanban-column-cards">
      ${cards.length ? cards.map(renderKanbanCard).join("") : `<div class="kanban-column-empty"><strong>Nenhum cartão</strong><span>Arraste uma atividade para cá ou crie um novo cartão.</span></div>`}
    </div>
  </section>`;
}

function renderKanbanCard(card) {
  const busy = state.kanban.busy.get(card.id) || "";
  const disabled = busy ? "disabled" : "";
  const assignees = card.assignees.length
    ? `<div class="kanban-card-assignees" aria-label="Responsáveis">${card.assignees.map((person) => `<span class="kanban-person-chip" title="${e(person.name)} — ${e(person.email)}"><span aria-hidden="true">${e(personInitials(person.name))}</span>${e(person.name)}</span>`).join("")}</div>`
    : `<span class="kanban-unassigned">Sem responsável</span>`;
  return `<article class="kanban-card${busy ? " is-busy" : ""}" draggable="${busy ? "false" : "true"}" data-kanban-card-id="${e(card.id)}" tabindex="0">
    <div class="kanban-card-topline"><span>${e(kanbanStatusLabel(card.status))}</span><small>${e(formatHistoryDate(card.updatedAt))}</small></div>
    <h4>${e(card.title)}</h4>
    ${card.description ? `<p>${e(card.description).replace(/\n/g, "<br>")}</p>` : ""}
    ${assignees}
    <div class="kanban-card-footer">
      <label><span class="sr-only">Mover ${e(card.title)}</span><select data-kanban-status data-id="${e(card.id)}" aria-label="Mover cartão ${e(card.title)}" ${disabled}>${KANBAN_COLUMNS.map((column) => `<option value="${e(column.id)}" ${card.status === column.id ? "selected" : ""}>${e(column.label)}</option>`).join("")}</select></label>
      <div class="kanban-card-actions">
        <button class="button button-quiet" type="button" data-action="edit-kanban-card" data-id="${e(card.id)}" ${disabled}>Editar</button>
        <button class="button button-quiet button-danger" type="button" data-action="delete-kanban-card" data-id="${e(card.id)}" ${disabled}>${busy === "delete" ? "Excluindo…" : "Excluir"}</button>
      </div>
    </div>
  </article>`;
}

function kanbanStatusLabel(status) {
  return KANBAN_COLUMNS.find((column) => column.id === status)?.label || "A fazer";
}

function personInitials(name) {
  const words = String(name || "U").trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]).join("").toUpperCase() || "U";
}

async function loadKanban({ silent = false } = {}) {
  if (!state.auth.user || state.kanban.loading) return;
  state.kanban.loading = true;
  state.kanban.error = "";
  if (state.kanban.open) render();
  try {
    const payload = await apiRequest("/api/kanban");
    state.kanban.cards = Array.isArray(payload.cards) ? payload.cards : [];
    state.kanban.people = Array.isArray(payload.people) ? payload.people : [];
    state.kanban.loaded = true;
  } catch (error) {
    state.kanban.error = error.message;
    if (!silent) showToast("Não foi possível atualizar o Kanban.");
  } finally {
    state.kanban.loading = false;
    if (state.kanban.open) render();
  }
}

async function showKanban({ focusCardId = "" } = {}) {
  state.flow = null;
  state.admin.open = false;
  state.history.open = false;
  state.kanban.open = true;
  closeNotificationPopover();
  render();
  focusMain();
  if (!state.kanban.loaded) await loadKanban();
  if (focusCardId) {
    requestAnimationFrame(() => {
      const card = document.querySelector(`[data-kanban-card-id="${focusCardId}"]`);
      card?.scrollIntoView?.({ behavior: "smooth", block: "center", inline: "center" });
      card?.classList.add("is-notification-target");
      setTimeout(() => card?.classList.remove("is-notification-target"), 2200);
    });
  }
}

async function openKanbanCardDialog(cardId = "") {
  if (!state.kanban.loaded) await loadKanban();
  const card = cardId ? state.kanban.cards.find((item) => item.id === cardId) : null;
  state.kanban.editingCardId = card?.id || "";
  elements.kanbanCardId.value = card?.id || "";
  elements.kanbanCardTitle.value = card?.title || "";
  elements.kanbanCardDescription.value = card?.description || "";
  elements.kanbanCardStatus.value = card?.status || "todo";
  elements.kanbanCardFormTitle.textContent = card ? "Editar cartão" : "Novo cartão";
  elements.saveKanbanCardButton.textContent = card ? "Salvar alterações" : "Criar cartão";
  elements.saveKanbanCardButton.disabled = false;
  setKanbanCardFeedback();
  const selectedIds = new Set(card?.assignees.map((person) => person.id) || []);
  elements.kanbanAssigneeList.innerHTML = state.kanban.people.length
    ? state.kanban.people.map((person) => `<label class="kanban-assignee-option"><input type="checkbox" data-kanban-assignee value="${e(person.id)}" ${selectedIds.has(person.id) ? "checked" : ""} /><span class="kanban-assignee-avatar" aria-hidden="true">${e(personInitials(person.name))}</span><span><strong>${e(person.name)}</strong><small>${e(person.email)}</small></span></label>`).join("")
    : `<div class="kanban-assignee-empty">Nenhuma pessoa com acesso aprovado foi encontrada.</div>`;
  openDialog(elements.kanbanCardDialog);
  setTimeout(() => elements.kanbanCardTitle.focus(), 40);
}

function closeKanbanCardDialog() {
  if (elements.saveKanbanCardButton.disabled) return;
  state.kanban.editingCardId = "";
  elements.kanbanCardForm.reset();
  setKanbanCardFeedback();
  closeDialog(elements.kanbanCardDialog);
}

function setKanbanCardFeedback(message = "") {
  elements.kanbanCardFeedback.textContent = message;
  elements.kanbanCardFeedback.className = `inline-feedback${message ? " is-error" : " is-hidden"}`;
  elements.kanbanCardTitle.classList.toggle("is-validation-error", Boolean(message && !elements.kanbanCardTitle.value.trim()));
}

async function saveKanbanCard() {
  const cardId = elements.kanbanCardId.value;
  const title = elements.kanbanCardTitle.value.trim();
  if (!title) {
    setKanbanCardFeedback("Informe o título do cartão.");
    elements.kanbanCardTitle.focus();
    return;
  }
  const body = {
    title,
    description: elements.kanbanCardDescription.value.trim(),
    status: elements.kanbanCardStatus.value,
    assigneeIds: Array.from(elements.kanbanAssigneeList.querySelectorAll("[data-kanban-assignee]:checked")).map((input) => input.value),
  };
  elements.saveKanbanCardButton.disabled = true;
  elements.saveKanbanCardButton.textContent = cardId ? "Salvando…" : "Criando…";
  setKanbanCardFeedback();
  try {
    const payload = await apiRequest(cardId ? `/api/kanban/cards/${encodeURIComponent(cardId)}` : "/api/kanban/cards", {
      method: cardId ? "PATCH" : "POST",
      body,
    });
    state.kanban.cards = cardId
      ? state.kanban.cards.map((card) => card.id === cardId ? payload.card : card)
      : [payload.card, ...state.kanban.cards];
    state.kanban.editingCardId = "";
    elements.saveKanbanCardButton.disabled = false;
    closeDialog(elements.kanbanCardDialog);
    render();
    showToast(cardId ? "Cartão atualizado." : "Cartão criado.");
    await loadKanbanNotifications({ silent: true });
  } catch (error) {
    elements.saveKanbanCardButton.disabled = false;
    elements.saveKanbanCardButton.textContent = cardId ? "Salvar alterações" : "Criar cartão";
    setKanbanCardFeedback(error.message);
  }
}

async function moveKanbanCard(cardId, status) {
  const card = state.kanban.cards.find((item) => item.id === cardId);
  if (!card || card.status === status || state.kanban.busy.has(cardId)) return;
  state.kanban.busy.set(cardId, "move");
  render();
  try {
    const payload = await apiRequest(`/api/kanban/cards/${encodeURIComponent(cardId)}`, {
      method: "PATCH",
      body: {
        title: card.title,
        description: card.description,
        status,
        assigneeIds: card.assignees.map((person) => person.id),
      },
    });
    state.kanban.cards = state.kanban.cards.map((item) => item.id === cardId ? payload.card : item);
    showToast(`Cartão movido para ${kanbanStatusLabel(status)}.`);
  } catch (error) {
    state.kanban.error = error.message;
  } finally {
    state.kanban.busy.delete(cardId);
    if (state.kanban.open) render();
  }
}

function confirmKanbanCardDeletion(cardId) {
  const card = state.kanban.cards.find((item) => item.id === cardId);
  if (!card) return;
  showMessage({
    title: "Excluir este cartão?",
    text: `O cartão “${card.title}” será removido do quadro para todas as pessoas.`,
    kind: "error",
    actions: [
      { label: "Cancelar" },
      { label: "Excluir cartão", danger: true, onClick: () => deleteKanbanCard(cardId) },
    ],
  });
}

async function deleteKanbanCard(cardId) {
  if (state.kanban.busy.has(cardId)) return;
  state.kanban.busy.set(cardId, "delete");
  if (state.kanban.open) render();
  try {
    await apiRequest(`/api/kanban/cards/${encodeURIComponent(cardId)}`, { method: "DELETE" });
    state.kanban.cards = state.kanban.cards.filter((card) => card.id !== cardId);
    showToast("Cartão excluído.");
  } catch (error) {
    state.kanban.error = error.message;
  } finally {
    state.kanban.busy.delete(cardId);
    if (state.kanban.open) render();
  }
}

function updateNotificationBell() {
  const count = state.kanban.unreadCount;
  elements.notificationBadge.textContent = count > 99 ? "99+" : count ? String(count) : "";
  elements.notificationBadge.classList.toggle("is-hidden", count === 0);
  elements.notificationButton.classList.toggle("has-unread", count > 0);
  elements.notificationButton.setAttribute("aria-label", count
    ? `Abrir notificações. ${count} não lida(s).`
    : "Abrir notificações");
}

function renderNotificationPopover() {
  const notifications = state.kanban.notifications;
  elements.notificationList.innerHTML = state.kanban.notificationsLoading && !notifications.length
    ? `<div class="notification-state"><span class="history-spinner" aria-hidden="true"></span><strong>Carregando…</strong></div>`
    : notifications.length
      ? `<div class="notification-items">${notifications.map((notification) => `<button class="notification-item${notification.readAt ? "" : " is-unread"}" type="button" data-action="open-kanban-notification" data-id="${e(notification.id)}" data-card-id="${e(notification.cardId)}"><span class="notification-item-bell" aria-hidden="true">&#128276;&#65038;</span><span><strong>${e(notification.message)}</strong><small>${e(formatHistoryDate(notification.createdAt))}</small></span></button>`).join("")}</div>${state.kanban.unreadCount ? `<button class="notification-read-all" type="button" data-action="read-all-notifications">Marcar todas como lidas</button>` : ""}`
      : `<div class="notification-state"><span class="notification-empty-bell" aria-hidden="true">&#128276;&#65038;</span><strong>Nenhuma notificação</strong><span>Quando alguém marcar você em um cartão, o aviso aparecerá aqui.</span></div>`;
}

async function loadKanbanNotifications({ silent = false } = {}) {
  if (!state.auth.user || state.kanban.notificationsLoading) return;
  state.kanban.notificationsLoading = true;
  if (state.kanban.notificationsOpen) renderNotificationPopover();
  try {
    const payload = await apiRequest("/api/kanban/notifications");
    state.kanban.notifications = Array.isArray(payload.notifications) ? payload.notifications : [];
    state.kanban.unreadCount = Number(payload.unreadCount) || 0;
    updateNotificationBell();
  } catch (error) {
    if (!silent) showToast(error.message);
  } finally {
    state.kanban.notificationsLoading = false;
    if (state.kanban.notificationsOpen) renderNotificationPopover();
  }
}

async function toggleNotificationPopover() {
  if (state.kanban.notificationsOpen) {
    closeNotificationPopover();
    return;
  }
  state.kanban.notificationsOpen = true;
  elements.notificationPopover.classList.remove("is-hidden");
  elements.notificationButton.setAttribute("aria-expanded", "true");
  renderNotificationPopover();
  await loadKanbanNotifications({ silent: true });
}

function closeNotificationPopover() {
  state.kanban.notificationsOpen = false;
  elements.notificationPopover.classList.add("is-hidden");
  elements.notificationButton.setAttribute("aria-expanded", "false");
}

async function openKanbanNotification(notificationId, cardId) {
  try {
    await apiRequest(`/api/kanban/notifications/${encodeURIComponent(notificationId)}`, { method: "PATCH" });
    state.kanban.notifications = state.kanban.notifications.map((item) => item.id === notificationId ? { ...item, readAt: Math.floor(Date.now() / 1_000) } : item);
    state.kanban.unreadCount = state.kanban.notifications.filter((item) => !item.readAt).length;
    updateNotificationBell();
  } catch {
    // O cartão ainda pode ser aberto mesmo se o aviso já tiver sido removido.
  }
  await showKanban({ focusCardId: cardId });
}

async function markAllNotificationsRead() {
  if (!state.kanban.unreadCount) return;
  try {
    await apiRequest("/api/kanban/notifications/read", { method: "POST" });
    const readAt = Math.floor(Date.now() / 1_000);
    state.kanban.notifications = state.kanban.notifications.map((item) => ({ ...item, readAt: item.readAt || readAt }));
    state.kanban.unreadCount = 0;
    updateNotificationBell();
    renderNotificationPopover();
  } catch (error) {
    showToast(error.message);
  }
}

function startNotificationPolling() {
  stopNotificationPolling();
  notificationPollTimer = setInterval(() => {
    if (document.visibilityState === "visible") void loadKanbanNotifications({ silent: true });
  }, 30_000);
}

function stopNotificationPolling() {
  if (notificationPollTimer) clearInterval(notificationPollTimer);
  notificationPollTimer = null;
}

function renderReport() {
  const renders = [renderReportInfo, renderReportPhotos, renderReportContent, renderReportReview];
  return renders[state.step]();
}

function renderReportInfo() {
  const r = state.report;
  return `${pageHeading("Etapa 1", "Identifique o relatório", "Informe o cabeçalho e o contexto que aparecerão no documento final.")}
  <section class="panel">
    ${panelHeader("Identificação do órgão", "Estes dados compõem o cabeçalho do arquivo Word.")}
    <div class="field-grid">
      <label class="field"><span>Órgão ou empresa</span><input type="text" data-bind="report.organization" value="${e(r.organization)}" placeholder="Ex.: Secretaria Municipal de Obras" /></label>
      <label class="field"><span>Departamento ou setor</span><input type="text" data-bind="report.department" value="${e(r.department)}" placeholder="Ex.: Divisão de Fiscalização" /></label>
    </div>
    <div class="field stacked">
      <span class="field-label">Logotipo (opcional)</span>
      ${renderSingleImageUpload("report-logo", r.logo, "Adicionar logotipo", "PNG ou JPEG; será aplicado no cabeçalho")}
    </div>
  </section>
  <section class="panel">
    ${panelHeader("Dados principais", "O título, a data e a introdução abrem o relatório.")}
    <div class="field-grid">
      <label class="field"><span>Título do relatório *</span><input type="text" data-bind="report.title" value="${e(r.title)}" placeholder="Relatório Fotográfico" /></label>
      <label class="field"><span>Data *</span><input type="date" data-bind="report.date" value="${e(r.date)}" /></label>
    </div>
    <label class="field stacked"><span>Introdução *</span><textarea data-bind="report.introduction" maxlength="4000" placeholder="Descreva o objetivo, o local e o contexto da vistoria…">${e(r.introduction)}</textarea><span class="text-counter"><span>Contextualize sem antecipar conclusões</span><span>${r.introduction.length}/4000</span></span></label>
    <div class="field stacked">
      <span class="field-label">Imagem de abertura (opcional)</span>
      ${renderSingleImageUpload("report-intro", r.introImage, "Adicionar imagem", "Ela aparecerá depois da introdução")}
    </div>
  </section>`;
}

function renderSingleImageUpload(kind, file, title, help, id = "") {
  if (file) {
    return `<div class="selected-file">
      <img src="${e(file.url)}" alt="Prévia de ${e(file.file.name)}" />
      <div class="selected-file-copy"><strong>${e(file.file.name)}</strong><small>${formatBytes(file.file.size)}</small></div>
      <button class="icon-button" type="button" data-action="remove-file" data-kind="${e(kind)}" data-id="${e(id)}" aria-label="Remover imagem">×</button>
    </div>`;
  }
  return `<label class="upload-box">
    <input type="file" accept="image/jpeg,image/png,image/bmp,image/gif,image/webp" data-file="${e(kind)}" data-id="${e(id)}" />
    <span class="upload-symbol" aria-hidden="true">+</span>
    <span class="upload-copy"><strong>${e(title)}</strong><span>${e(help)}</span></span>
  </label>`;
}

function renderReportPhotos() {
  const r = state.report;
  const missing = r.photos.filter((photo) => !photo.description.trim()).length;
  return `${pageHeading("Etapa 2", "Organize as fotografias", "Adicione as imagens, ajuste a ordem e escreva ou gere as descrições técnicas.")}
  <section class="panel">
    ${panelHeader("Adicionar fotografias", "Selecione várias imagens de uma vez ou arraste os arquivos para esta área.")}
    <label class="upload-box" data-drop="photos">
      <input type="file" multiple accept="image/jpeg,image/png,image/bmp,image/gif,image/webp" data-file="report-photos" />
      <span class="upload-symbol" aria-hidden="true">+</span>
      <span class="upload-copy"><strong>Selecionar fotografias</strong><span>JPEG, PNG, BMP, GIF ou WebP • até 20 MB por arquivo</span></span>
    </label>
  </section>
  <section class="panel">
    <div class="photo-toolbar">
      <div><strong class="photo-count" id="photoCount">${r.photos.length} fotografia(s) • ${missing} sem descrição</strong><div id="analysisProgress" class="analysis-state ${state.analysis.running ? "is-working" : ""}">${state.analysis.running ? `${state.analysis.done} de ${state.analysis.total} analisadas` : "Descrições editáveis"}</div></div>
      <div class="photo-actions">
        <select aria-label="Ordenar fotografias" data-bind="report.order">
          <option value="name" ${r.order === "name" ? "selected" : ""}>Ordenar por nome</option>
          <option value="date" ${r.order === "date" ? "selected" : ""}>Ordenar por data</option>
        </select>
        <button class="button button-secondary" type="button" data-action="analyze-all" ${!r.photos.length || state.analysis.running ? "disabled" : ""}>✦ Descrever com IA</button>
      </div>
    </div>
    ${r.photos.length ? `<div class="photo-list">${r.photos.map(renderPhotoCard).join("")}</div>` : `<div class="empty-state"><div><strong>Nenhuma fotografia adicionada</strong><span>Use a área acima para selecionar todas as fotos do relatório.</span></div></div>`}
  </section>
  ${!isApiReady() ? `<div class="notice is-warning"><span aria-hidden="true">✦</span><span><strong>A IA ainda não está configurada.</strong> Você pode escrever as descrições manualmente ou configurar sua chave da OpenAI no topo da página.</span></div>` : ""}`;
}

function renderPhotoCard(photo, index) {
  const statusText = photo.status === "working" ? "Analisando…" : photo.status === "done" ? "Descrição pronta" : photo.status === "error" ? "Falha na análise" : "Descrição manual";
  const statusClass = photo.status === "working" ? "is-working" : photo.status === "done" ? "is-done" : photo.status === "error" ? "is-error" : "";
  return `<article class="photo-card" data-photo-id="${e(photo.id)}">
    <img src="${e(photo.url)}" alt="Fotografia ${index + 1}: ${e(photo.file.name)}" />
    <div class="photo-card-main">
      <div class="photo-card-heading"><span class="photo-index">${String(index + 1).padStart(2, "0")}</span><strong>${e(photo.file.name)}</strong><span class="analysis-state ${statusClass}">${e(statusText)}</span></div>
      <textarea data-photo-description="${e(photo.id)}" maxlength="700" placeholder="Descreva a patologia, o local ou a informação relevante…">${e(photo.description)}</textarea>
    </div>
    <div class="photo-card-actions">
      <button class="icon-button" type="button" data-action="analyze-photo" data-id="${e(photo.id)}" aria-label="Descrever com IA" title="Descrever com IA">✦</button>
      <button class="icon-button" type="button" data-action="remove-photo" data-id="${e(photo.id)}" aria-label="Remover fotografia" title="Remover">×</button>
    </div>
  </article>`;
}

function renderReportContent() {
  const r = state.report;
  return `${pageHeading("Etapa 3", "Complete o conteúdo", "Inclua seções adicionais, escolha os responsáveis e defina o formato das páginas.")}
  <section class="panel">
    ${panelHeader("Tópicos adicionais", "Use para metodologia, histórico, conclusão ou outra seção antes das fotografias.", `<button class="button button-secondary" type="button" data-action="add-topic">+ Adicionar tópico</button>`)}
    ${r.topics.length ? `<div class="topic-list">${r.topics.map(renderTopic).join("")}</div>` : `<div class="empty-state"><div><strong>Nenhum tópico adicional</strong><span>Esta parte é opcional. A introdução pode ser seguida diretamente pelas fotografias.</span></div></div>`}
  </section>
  <section class="panel">
    ${panelHeader("Responsáveis pelas assinaturas", "Escolha uma assinatura salva. Para cadastrar uma nova, selecione Outro.", `<button class="button button-secondary" type="button" data-action="open-signatures">Configurar assinaturas</button>`)}
    <label class="field signature-select-field">
      <span>Adicionar responsável</span>
      <select data-signature-target="report" ${state.signatures.loading ? "disabled" : ""}>${signatureSelectOptions("", "Selecione uma pessoa")}</select>
    </label>
    <div class="selected-signature-list">
      ${r.responsibles.length ? r.responsibles.map((signature, index) => `<article class="selected-signature-card">
        <span class="signatory-index">${String(index + 1).padStart(2, "0")}</span>
        <div class="signature-profile-copy"><strong>${e(signature.name)}</strong><em>${e(signature.role)}</em></div>
        <button class="icon-button" type="button" data-action="remove-report-signature" data-index="${index}" aria-label="Remover assinatura de ${e(signature.name)}" title="Remover">×</button>
      </article>`).join("") : `<div class="signature-profile-state"><strong>Nenhuma assinatura selecionada</strong><span>Use o dropdown acima para adicionar os responsáveis.</span></div>`}
    </div>
  </section>
  <section class="panel">
    ${panelHeader("Formato do documento", "Defina a densidade das fotografias e a separação das seções.")}
    <div class="choice-grid">
      <label class="choice-card"><input type="radio" name="photosPerPage" data-bind="report.onePerPage" value="false" ${!r.onePerPage ? "checked" : ""} /><span><strong>Duas fotos por página</strong><small>Formato compacto, adequado para a maioria dos relatórios.</small></span></label>
      <label class="choice-card"><input type="radio" name="photosPerPage" data-bind="report.onePerPage" value="true" ${r.onePerPage ? "checked" : ""} /><span><strong>Uma foto por página</strong><small>Mais espaço para detalhes e legendas extensas.</small></span></label>
    </div>
    <div class="switch-row"><div class="switch-copy"><strong>Iniciar fotografias em nova página</strong><small>Mantém a parte textual separada do registro fotográfico.</small></div><label class="switch"><input type="checkbox" data-bind="report.startPhotosNewPage" ${r.startPhotosNewPage ? "checked" : ""} /><span class="switch-track"></span></label></div>
  </section>`;
}

function renderTopic(topic, index) {
  return `<article class="topic-card" data-topic-id="${e(topic.id)}">
    <div class="topic-heading"><strong>Tópico ${index + 1}</strong><button class="icon-button" type="button" data-action="remove-topic" data-id="${e(topic.id)}" aria-label="Remover tópico">×</button></div>
    <div class="field-grid">
      <label class="field"><span>Título</span><input type="text" data-topic-field="title" data-id="${e(topic.id)}" value="${e(topic.title)}" placeholder="Ex.: Conclusão" /></label>
      <label class="field"><span>Legenda da imagem</span><input type="text" data-topic-field="caption" data-id="${e(topic.id)}" value="${e(topic.caption)}" placeholder="Opcional" /></label>
    </div>
    <label class="field stacked"><span>Texto</span><textarea data-topic-field="text" data-id="${e(topic.id)}" maxlength="3500" placeholder="Escreva o conteúdo desta seção…">${e(topic.text)}</textarea></label>
    <div class="topic-image-row"><div class="field"><span class="field-label">Imagem opcional</span>${renderSingleImageUpload("topic-image", topic.image, "Adicionar imagem", "Será inserida após o texto", topic.id)}</div><div class="notice"><span aria-hidden="true">i</span><span>A legenda é opcional e pode ser escrita manualmente no campo acima.</span></div></div>
  </article>`;
}

function renderReportReview() {
  const r = state.report;
  const described = r.photos.filter((photo) => photo.description.trim()).length;
  return `${pageHeading("Etapa 4", "Revise antes de gerar", "Confira os principais dados. O arquivo Word será baixado no dispositivo.")}
  <div class="summary-grid">
    ${summaryCard("Documento", r.title, formatDate(r.date))}
    ${summaryCard("Fotografias", String(r.photos.length), `${described} com descrição`)}
    ${summaryCard("Paginação", r.onePerPage ? "1 foto por página" : "2 fotos por página", `${Math.ceil(r.photos.length / (r.onePerPage ? 1 : 2))} página(s) estimada(s)`)}
  </div>
  <section class="panel">
    <div class="review-block"><h3>Cabeçalho</h3><p>${e([r.organization, r.department].filter(Boolean).join(" — ") || "Sem identificação institucional")}</p></div>
    <div class="review-block"><h3>Introdução</h3><p>${e(r.introduction)}</p></div>
    <div class="review-block"><h3>Tópicos adicionais</h3><p>${r.topics.length ? r.topics.map((topic) => e(topic.title)).join(" • ") : "Nenhum"}</p></div>
    <div class="review-block"><h3>Responsáveis</h3><div class="review-signatures">${r.responsibles.map((signature) => signaturePreview(signature)).join("")}</div></div>
  </section>
  <div class="notice"><span aria-hidden="true">✓</span><span><strong>O documento será criado localmente.</strong> A geração do Word não envia seus arquivos a nenhum servidor.</span></div>`;
}

function summaryCard(label, value, detail) {
  return `<article class="summary-card"><span>${e(label)}</span><strong>${e(value)}</strong><small>${e(detail)}</small></article>`;
}

function renderCota() {
  return [renderCotaContent, renderCotaReview, renderCotaSignature][state.step]();
}

function renderCotaContent() {
  const c = state.cota;
  const metrics = cotaMetrics(c.baseText);
  return `<section class="panel">
    ${panelHeader("Identificação do documento", "O timbre, o cabeçalho, as margens e a pauta virão do modelo padrão fornecido. O conteúdo será formatado em Arial 12 e justificado.")}
    <div class="field-grid three">
      <label class="field"><span>Número do processo</span><input type="text" data-bind="cota.processNumber" value="${e(c.processNumber)}" placeholder="Ex.: 12345" /></label>
      <label class="field"><span>Ano</span><input type="text" inputmode="numeric" maxlength="4" data-bind="cota.year" value="${e(c.year)}" /></label>
      <label class="field"><span>Folha nº</span><input type="text" data-bind="cota.sheetNumber" value="${e(c.sheetNumber)}" placeholder="Opcional" /></label>
    </div>
  </section>
  <section class="panel">
    ${panelHeader("Texto-base", "Escreva somente os fatos e encaminhamentos que devem constar no processo.")}
    <div class="switch-row ai-switch-row">
      <div class="switch-copy"><strong>Analisar e melhorar com IA</strong><small>Desligado: o texto digitado será usado diretamente, sem envio à OpenAI.</small></div>
      <label class="switch"><input type="checkbox" data-bind="cota.useAI" ${c.useAI ? "checked" : ""} aria-label="Analisar e melhorar o texto com IA" /><span class="switch-track" aria-hidden="true"></span></label>
    </div>
    ${c.useAI ? `<div class="ai-assistance-details">
      <div><strong class="subsection-label">Imagem de contexto (opcional)</strong><p class="field-help">Anexe uma foto para ajudar a IA a compreender o problema. A imagem será enviada somente para a análise e não aparecerá no Word.</p></div>
      ${renderSingleImageUpload("cota-context", c.contextImage, "Anexar imagem para a IA", "JPEG, PNG, BMP, GIF ou WebP • até 20 MB")}
      ${!isApiReady() ? `<div class="notice is-warning compact-notice"><span aria-hidden="true">✦</span><span>Configure sua chave da OpenAI antes de continuar. <button class="inline-button" type="button" data-action="open-api">Configurar agora</button></span></div>` : `<div class="notice compact-notice"><span aria-hidden="true">✓</span><span>A análise usará <strong>${e(modelDisplayName(getSelectedModel()))}</strong>${c.contextImage ? ` e a imagem <strong>${e(c.contextImage.file.name)}</strong>` : ""}.</span></div>`}
    </div>` : `<div class="notice compact-notice direct-mode-notice"><span aria-hidden="true">✓</span><span><strong>Modo direto.</strong> Ao continuar, somente a sua digitação será levada para a folha de cota.</span></div>`}
    <label class="field cota-base-field"><span>Conteúdo *</span><textarea data-bind="cota.baseText" maxlength="${MAX_COTA_TEXT}" placeholder="Ex.: Em vistoria realizada no local, foi constatado…">${e(c.baseText)}</textarea><span class="text-counter"><span id="cotaLineCount">${metrics.lines} de ${MAX_COTA_LINES} linhas estimadas</span><span id="cotaCharCount">${metrics.characters}/${MAX_COTA_TEXT}</span></span></label>
  </section>
  ${c.useAI ? `<div class="notice is-warning"><span aria-hidden="true">!</span><span>A IA será orientada a melhorar a redação e usar a imagem apenas como contexto, sem inventar fatos. Confira o texto final antes de gerar o Word.</span></div>` : ""}`;
}

function renderCotaReview() {
  const c = state.cota;
  const metrics = cotaMetrics(c.finalText);
  const reviewAction = c.useAI ? `<button class="button button-secondary" type="button" data-action="improve-cota">✦ Analisar novamente com IA</button>` : "";
  return `${pageHeading("Etapa 2", "Revise a redação final", c.useAI ? "Confira o texto analisado pela IA e faça qualquer ajuste necessário." : "Confira o texto digitado antes de escolher a assinatura.")}
  <section class="panel">
    ${panelHeader("Texto final", `O conteúdo será distribuído em até ${MAX_COTA_LINES} linhas, com uma linha em branco entre parágrafos.`, reviewAction)}
    <label class="field"><span>Redação administrativa *</span><textarea data-bind="cota.finalText" maxlength="${MAX_COTA_TEXT}">${e(c.finalText)}</textarea><span class="text-counter"><span id="cotaLineCount">${metrics.lines} de ${MAX_COTA_LINES} linhas estimadas</span><span id="cotaCharCount">${metrics.characters}/${MAX_COTA_TEXT}</span></span></label>
  </section>
  <div class="summary-grid">
    ${summaryCard("Processo", c.processNumber || "Em branco", c.year || "Ano em branco")}
    ${summaryCard("Folha", c.sheetNumber || "Em branco", "Campo editável no Word")}
    ${summaryCard("Capacidade", `${metrics.lines}/${MAX_COTA_LINES} linhas`, `${metrics.characters} caracteres`)}
  </div>
  ${c.useAI ? `<div class="notice"><span aria-hidden="true">✦</span><span>Texto analisado com <strong>${e(modelDisplayName(getSelectedModel()))}</strong>${c.contextImage ? ` usando <strong>${e(c.contextImage.file.name)}</strong> como contexto visual` : ""}. Revise todas as informações.</span></div>` : `<div class="notice"><span aria-hidden="true">✓</span><span><strong>Modo direto:</strong> este é o texto digitado por você, sem análise da IA.</span></div>`}`;
}

function renderCotaSignature() {
  const c = state.cota;
  const metrics = cotaMetrics(c.finalText);
  return `${pageHeading("Etapa 3", "Defina a assinatura", "Escolha quem assinará a folha de cota e confira o resumo antes de gerar o Word.")}
  <section class="panel">
    ${panelHeader("Assinatura", "A assinatura ficará a uma linha em branco do texto, com nome em negrito e cargo em itálico.", `<button class="button button-secondary" type="button" data-action="open-signatures">Configurar assinaturas</button>`)}
    <label class="field signature-select-field"><span>Pessoa que vai assinar *</span><select data-signature-target="cota" ${state.signatures.loading ? "disabled" : ""}>${signatureSelectOptions(c.signerProfileId, "Selecione uma pessoa")}</select></label>
    ${signaturePreview({ name: c.signer, role: c.signerRole }, "Selecione uma assinatura no dropdown")}
  </section>
  <div class="summary-grid">
    ${summaryCard("Processo", c.processNumber || "Em branco", c.year || "Ano em branco")}
    ${summaryCard("Texto", `${metrics.lines}/${MAX_COTA_LINES} linhas`, "Justificado, com 1 linha entre parágrafos")}
    ${summaryCard("Assinatura", c.signer || "Não selecionada", c.signerRole || "Cargo não informado")}
  </div>
  <div class="notice"><span aria-hidden="true">✓</span><span>O Word manterá o texto na pauta e reservará as linhas seguintes para a assinatura.</span></div>`;
}

function isNoticeFlow(flow = state.flow) {
  return flow === "notification" || flow === "warning";
}

function noticeState(flow = state.flow) {
  return flow === "warning" ? state.warning : state.notification;
}

function noticeCopy(flow = state.flow) {
  const warning = flow === "warning";
  return {
    key: warning ? "warning" : "notification",
    label: warning ? "Advertência" : "Notificação",
    lower: warning ? "advertência" : "notificação",
    title: warning ? "ADVERTÊNCIA" : "NOTIFICAÇÃO",
    slug: warning ? "advertencia" : "notificacao",
  };
}

function renderNotification() {
  const renders = [renderNotificationInfo, renderNotificationContent, renderNotificationReview];
  return renders[state.step]();
}

function renderNotificationInfo() {
  const n = noticeState();
  const notice = noticeCopy();
  return `${pageHeading("Etapa 1", `Identifique a ${notice.lower}`, "Preencha os dados que aparecerão no modelo oficial da Prefeitura de Bertioga.")}
  <section class="panel">
    ${panelHeader("Modelo oficial", "O brasão e o cabeçalho da Prefeitura serão aplicados automaticamente, com a mesma página A4, margens e tipografia do arquivo fornecido.")}
    <div class="field-grid three">
      <label class="field"><span>Cidade *</span><input type="text" data-bind="${notice.key}.city" value="${e(n.city)}" placeholder="Ex.: Bertioga" /></label>
      <label class="field"><span>Data *</span><input type="date" data-bind="${notice.key}.date" value="${e(n.date)}" /></label>
      <label class="field"><span>Número da ${notice.lower} *</span><input type="text" data-bind="${notice.key}.number" value="${e(n.number)}" placeholder="Ex.: 2ª ou 015/2026" /></label>
    </div>
  </section>
  <section class="panel">
    ${panelHeader("Processo e contratação", "Estes campos serão apresentados com os mesmos rótulos e alinhamentos do modelo.")}
    <label class="field"><span>Processo *</span><input type="text" data-bind="${notice.key}.process" value="${e(n.process)}" placeholder="Ex.: 3330/2026 - Contrato 22/2026" /></label>
    <label class="field stacked"><span>Obra *</span><textarea class="textarea-compact" data-bind="${notice.key}.work" maxlength="1800" placeholder="Descreva o objeto da obra ou do contrato">${e(n.work)}</textarea></label>
    <label class="field stacked"><span>Contratada *</span><input type="text" data-bind="${notice.key}.contractor" value="${e(n.contractor)}" placeholder="Razão social da empresa contratada" /></label>
  </section>`;
}

function renderNotificationContent() {
  const n = noticeState();
  const notice = noticeCopy();
  return `${pageHeading("Etapa 2", `Escreva e complete a ${notice.lower}`, "Informe o texto, as pessoas que assinarão e, se desejar, anexe fotos com legenda.")}
  <section class="panel">
    ${panelHeader(`Texto da ${notice.lower}`, "Separe os parágrafos com uma linha em branco; o Word manterá o texto em Arial 12 e alinhamento justificado.")}
    <label class="field"><span>Conteúdo *</span><textarea data-bind="${notice.key}.baseText" maxlength="${MAX_CORRESPONDENCE_TEXT}" placeholder="Escreva o texto integral da ${notice.lower}…">${e(n.baseText)}</textarea><span class="text-counter"><span>Os fatos e prazos devem ser conferidos antes da emissão</span><span>${n.baseText.length}/${MAX_CORRESPONDENCE_TEXT}</span></span></label>
  </section>
  <section class="panel">
    ${panelHeader("Pessoas que vão assinar", "Escolha as assinaturas salvas. O nome sairá em negrito e o cargo em itálico.", `<div class="panel-actions"><button class="button button-secondary" type="button" data-action="open-signatures">Configurar</button><button class="button button-secondary" type="button" data-action="add-notification-signer">+ Adicionar pessoa</button></div>`)}
    <div class="signatory-list">
      ${n.signatories.map((signatory, index) => renderNotificationSignatory(signatory, index)).join("")}
    </div>
  </section>
  <section class="panel">
    ${panelHeader("Fotos e legendas", "Opcional. Cada foto será colocada em uma página própria, com numeração automática e a legenda abaixo.")}
    <label class="upload-box" data-drop="${notice.key}-photos">
      <input type="file" multiple accept="image/jpeg,image/png,image/bmp,image/gif,image/webp" data-file="${notice.key}-photos" />
      <span class="upload-icon" aria-hidden="true">+</span>
      <span class="upload-copy"><strong>Anexar fotos</strong><span>JPEG, PNG, BMP, GIF ou WebP • até 20 MB por arquivo</span></span>
    </label>
    ${n.photos.length ? `<div class="photo-list notification-photo-list">${n.photos.map(renderNotificationPhoto).join("")}</div>` : `<div class="empty-state notification-empty-state"><div><strong>Nenhuma foto anexada</strong><span>Esta parte é opcional e não aparecerá no Word se permanecer vazia.</span></div></div>`}
  </section>`;
}

function renderNotificationSignatory(signatory, index) {
  return `<article class="signatory-card" data-notification-signatory-id="${e(signatory.id)}">
    <span class="signatory-index">${String(index + 1).padStart(2, "0")}</span>
    <div class="signatory-card-main">
      <label class="field"><span>Assinatura *</span><select data-signature-target="notice" data-id="${e(signatory.id)}" ${state.signatures.loading ? "disabled" : ""}>${signatureSelectOptions(signatory.profileId, "Selecione uma pessoa")}</select></label>
      ${signaturePreview(signatory, "Selecione uma assinatura no dropdown")}
    </div>
    <button class="icon-button" type="button" data-action="remove-notification-signer" data-id="${e(signatory.id)}" aria-label="Remover pessoa" title="Remover">×</button>
  </article>`;
}

function renderNotificationPhoto(photo, index) {
  return `<article class="photo-card" data-notification-photo-id="${e(photo.id)}">
    <img src="${e(photo.url)}" alt="Imagem ${index + 1}: ${e(photo.file.name)}" />
    <div class="photo-card-main">
      <div class="photo-card-heading"><span class="photo-index">${String(index + 1).padStart(2, "0")}</span><strong>${e(photo.file.name)}</strong></div>
      <textarea data-notification-photo-caption="${e(photo.id)}" maxlength="500" placeholder="Legenda da foto…">${e(photo.caption)}</textarea>
    </div>
    <div class="photo-card-actions"><button class="icon-button" type="button" data-action="remove-notification-photo" data-id="${e(photo.id)}" aria-label="Remover foto" title="Remover">×</button></div>
  </article>`;
}

function renderNotificationReview() {
  const n = noticeState();
  const notice = noticeCopy();
  return `${pageHeading("Etapa 3", `Revise a ${notice.lower}`, "Confira os dados e ajuste o texto final antes de baixar o Word.")}
  <section class="panel">
    ${panelHeader("Texto final", `Somente o conteúdo deste campo será usado como corpo da ${notice.lower}.`)}
    <label class="field"><span>Redação final *</span><textarea data-bind="${notice.key}.finalText" maxlength="${MAX_CORRESPONDENCE_TEXT}">${e(n.finalText)}</textarea><span class="text-counter"><span>Revise nomes, datas, prazos e informações contratuais</span><span>${n.finalText.length}/${MAX_CORRESPONDENCE_TEXT}</span></span></label>
  </section>
  <div class="summary-grid">
    ${summaryCard(notice.label, n.number, `${n.city}, ${formatDateLong(n.date)}`)}
    ${summaryCard("Processo", n.process, n.contractor)}
    ${summaryCard("Anexos", `${n.photos.length} foto(s)`, `${n.signatories.length} assinatura(s)`)}
  </div>
  <section class="panel review-panel">
    <div class="review-block"><h3>Obra</h3><p>${e(n.work)}</p></div>
    <div class="review-block"><h3>Assinaturas</h3><div class="review-signatures">${n.signatories.map((signature) => signaturePreview(signature)).join("")}</div></div>
  </section>
  <div class="notice"><span aria-hidden="true">✓</span><span><strong>Modelo conferido.</strong> O arquivo será criado com o cabeçalho oficial da Prefeitura de Bertioga e a formatação do documento fornecido.</span></div>`;
}

const RICH_TEXT_ALLOWED_TAGS = new Set([
  "P", "DIV", "BR", "STRONG", "B", "EM", "I", "U", "H2", "H3",
  "UL", "OL", "LI", "TABLE", "THEAD", "TBODY", "TR", "TD", "TH",
]);
const RICH_TEXT_BLOCKED_TAGS = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "LINK", "META"]);
let richTextSelection = null;

function plainTextToRichHtml(text) {
  return String(text || "")
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .filter((paragraph) => paragraph.trim())
    .map((paragraph) => `<p>${e(paragraph.trim()).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function sanitizeRichTextHtml(value) {
  const parser = new DOMParser();
  const parsed = parser.parseFromString(`<body>${String(value || "")}</body>`, "text/html");
  const cleanNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) return e(node.nodeValue || "");
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    if (RICH_TEXT_BLOCKED_TAGS.has(node.tagName)) return "";
    const children = Array.from(node.childNodes).map(cleanNode).join("");
    if (!RICH_TEXT_ALLOWED_TAGS.has(node.tagName)) return children;
    const tagMap = { B: "strong", I: "em", DIV: "p" };
    const tag = tagMap[node.tagName] || node.tagName.toLowerCase();
    if (tag === "br") return "<br>";
    const alignment = String(node.style?.textAlign || node.getAttribute("align") || "").toLowerCase();
    const alignmentAttribute = ["left", "center", "right", "justify"].includes(alignment)
      ? ` style="text-align:${alignment}"`
      : "";
    return `<${tag}${alignmentAttribute}>${children}</${tag}>`;
  };
  return Array.from(parsed.body.childNodes).map(cleanNode).join("");
}

function richTextHtml(html, text) {
  return html ? sanitizeRichTextHtml(html) : plainTextToRichHtml(text);
}

function renderRichTextEditor({ key, html, text, label, placeholder, help }) {
  const safeKey = e(key);
  return `<div class="field rich-text-field">
    <span id="${safeKey}-label">${e(label)}</span>
    <div class="rich-editor-shell">
      <div class="rich-editor-toolbar" role="toolbar" aria-label="Formatação do conteúdo">
        <div class="rich-toolbar-group">
          <button class="rich-toolbar-button" type="button" data-rich-command="undo" title="Desfazer" aria-label="Desfazer">↶</button>
          <button class="rich-toolbar-button" type="button" data-rich-command="redo" title="Refazer" aria-label="Refazer">↷</button>
        </div>
        <div class="rich-toolbar-separator" aria-hidden="true"></div>
        <label class="rich-style-select"><span class="sr-only">Estilo do texto</span><select data-rich-block aria-label="Estilo do texto">
          <option value="p">Normal</option>
          <option value="h2">Título</option>
          <option value="h3">Subtítulo</option>
        </select></label>
        <div class="rich-toolbar-separator" aria-hidden="true"></div>
        <div class="rich-toolbar-group">
          <button class="rich-toolbar-button rich-toolbar-letter" type="button" data-rich-command="bold" title="Negrito" aria-label="Negrito"><strong>B</strong></button>
          <button class="rich-toolbar-button rich-toolbar-letter" type="button" data-rich-command="italic" title="Itálico" aria-label="Itálico"><em>I</em></button>
          <button class="rich-toolbar-button rich-toolbar-letter" type="button" data-rich-command="underline" title="Sublinhado" aria-label="Sublinhado"><u>U</u></button>
        </div>
        <div class="rich-toolbar-separator" aria-hidden="true"></div>
        <div class="rich-toolbar-group">
          <button class="rich-toolbar-button" type="button" data-rich-command="justifyLeft" title="Alinhar à esquerda" aria-label="Alinhar à esquerda"><span class="rich-align-icon is-left" aria-hidden="true"><i></i><i></i><i></i><i></i></span></button>
          <button class="rich-toolbar-button" type="button" data-rich-command="justifyCenter" title="Centralizar" aria-label="Centralizar"><span class="rich-align-icon is-center" aria-hidden="true"><i></i><i></i><i></i><i></i></span></button>
          <button class="rich-toolbar-button" type="button" data-rich-command="justifyRight" title="Alinhar à direita" aria-label="Alinhar à direita"><span class="rich-align-icon is-right" aria-hidden="true"><i></i><i></i><i></i><i></i></span></button>
          <button class="rich-toolbar-button" type="button" data-rich-command="justifyFull" title="Justificar" aria-label="Justificar"><span class="rich-align-icon is-justify" aria-hidden="true"><i></i><i></i><i></i><i></i></span></button>
        </div>
        <div class="rich-toolbar-separator" aria-hidden="true"></div>
        <div class="rich-toolbar-group">
          <button class="rich-toolbar-button rich-list-icon" type="button" data-rich-command="insertUnorderedList" title="Lista com marcadores" aria-label="Lista com marcadores"><span aria-hidden="true">•</span><span aria-hidden="true">≡</span></button>
          <button class="rich-toolbar-button rich-list-icon" type="button" data-rich-command="insertOrderedList" title="Lista numerada" aria-label="Lista numerada"><span aria-hidden="true">1.</span><span aria-hidden="true">≡</span></button>
        </div>
        <div class="rich-toolbar-separator" aria-hidden="true"></div>
        <div class="rich-toolbar-group">
          <button class="rich-toolbar-button rich-table-icon" type="button" data-rich-command="insert-table" title="Inserir tabela 2 × 2" aria-label="Inserir tabela 2 por 2">▦</button>
          <button class="rich-toolbar-button rich-clear-icon" type="button" data-rich-command="removeFormat" title="Limpar formatação" aria-label="Limpar formatação">T<sub>x</sub></button>
        </div>
      </div>
      <div class="rich-editor" contenteditable="true" role="textbox" aria-multiline="true" aria-labelledby="${safeKey}-label" data-rich-editor="${safeKey}" data-placeholder="${e(placeholder)}" data-maxlength="${MAX_CORRESPONDENCE_TEXT}" spellcheck="true">${richTextHtml(html, text)}</div>
    </div>
    <span class="text-counter"><span>${e(help)}</span><span data-rich-counter-for="${safeKey}">${String(text || "").length}/${MAX_CORRESPONDENCE_TEXT}</span></span>
  </div>`;
}

function richEditorFromControl(control) {
  return control.closest(".rich-editor-shell")?.querySelector("[data-rich-editor]") || null;
}

function plainTextFromRichEditor(editor) {
  return String(editor?.innerText || "")
    .replace(/\u00a0/g, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function updateRichEditorState(editor) {
  if (!editor?.dataset.richEditor) return;
  const field = editor.dataset.richEditor.endsWith(".base") ? "base" : "final";
  const text = plainTextFromRichEditor(editor);
  state.correspondence[`${field}Text`] = text;
  state.correspondence[`${field}Html`] = sanitizeRichTextHtml(editor.innerHTML);
  const counter = document.querySelector(`[data-rich-counter-for="${editor.dataset.richEditor}"]`);
  if (counter) counter.textContent = `${text.length}/${MAX_CORRESPONDENCE_TEXT}`;
  clearValidationHighlight(editor);
  scheduleSave();
}

function restoreRichTextSelection(editor) {
  if (!richTextSelection || richTextSelection.editor !== editor) return;
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(richTextSelection.range);
}

function runRichTextCommand(control) {
  const editor = richEditorFromControl(control);
  if (!editor) return;
  editor.focus({ preventScroll: true });
  restoreRichTextSelection(editor);
  const command = control.dataset.richCommand;
  if (command === "insert-table") {
    document.execCommand("insertHTML", false, "<table><tbody><tr><td><br></td><td><br></td></tr><tr><td><br></td><td><br></td></tr></tbody></table><p><br></p>");
  } else {
    document.execCommand(command, false, null);
  }
  updateRichEditorState(editor);
}

function applyRichTextBlock(control) {
  const editor = richEditorFromControl(control);
  if (!editor) return;
  editor.focus({ preventScroll: true });
  restoreRichTextSelection(editor);
  document.execCommand("formatBlock", false, control.value || "p");
  updateRichEditorState(editor);
}

function isOfficialCorrespondenceFlow(flow = state.flow) {
  return flow === "correspondence" && ["memorando", "oficio"].includes(state.correspondence.kind);
}

function renderOfficialCorrespondence() {
  const renders = [
    renderOfficialCorrespondenceInfo,
    renderOfficialCorrespondenceContent,
    renderOfficialCorrespondenceReview,
  ];
  return renders[state.step]();
}

function renderOfficialCorrespondenceInfo() {
  const c = state.correspondence;
  const type = correspondenceType();
  const typeLower = type.label.toLowerCase();
  const recipientOptions = MUNICIPAL_SECRETARIATS.map((secretariat) => {
    const selected = c.recipientSecretariat === secretariat.acronym ? " selected" : "";
    return `<option value="${secretariat.acronym}"${selected}>${secretariat.acronym} — ${e(secretariat.name)}</option>`;
  }).join("");
  const otherRecipientSelected = c.recipientSecretariat === OTHER_RECIPIENT_VALUE;
  const salutationOptions = OFFICIAL_SALUTATIONS.map((salutation) => {
    const selected = c.salutationOption === salutation ? " selected" : "";
    return `<option value="${e(salutation)}"${selected}>${e(salutation)}</option>`;
  }).join("");
  const otherSalutationSelected = c.salutationOption === OTHER_SALUTATION_VALUE;
  return `${pageHeading("Etapa 1", `Identifique ${type.article} ${typeLower}`, "Preencha os campos que aparecerão no modelo oficial da Prefeitura de Bertioga.")}
  <section class="panel">
    ${panelHeader("Modelo oficial", "O brasão, o cabeçalho, a página A4, as margens e a tipografia serão preservados conforme o arquivo fornecido.")}
    <div class="field-grid three">
      <label class="field"><span>Cidade *</span><input type="text" data-bind="correspondence.place" value="${e(c.place)}" placeholder="Ex.: Bertioga" /></label>
      <label class="field"><span>Data *</span><input type="date" data-bind="correspondence.date" value="${e(c.date)}" /></label>
      <label class="field"><span>Número d${type.article === "a" ? "a" : "o"} ${typeLower} *</span><input type="text" data-bind="correspondence.number" value="${e(c.number)}" placeholder="Ex.: 0268/2026" /></label>
    </div>
  </section>
  <section class="panel">
    ${panelHeader("Destinatário", "O setor ou destinatário e o tratamento serão apresentados em negrito, como no modelo original.")}
    <div class="field-grid">
      <label class="field"><span>Destinatário ou setor *</span><select data-correspondence-recipient-select><option value="">Selecione uma secretaria</option>${recipientOptions}<option value="${OTHER_RECIPIENT_VALUE}"${otherRecipientSelected ? " selected" : ""}>Outro destinatário ou setor</option></select></label>
      <label class="field"><span>Saudação ou tratamento *</span><select data-correspondence-salutation-select><option value="">Selecione um tratamento</option>${salutationOptions}<option value="${OTHER_SALUTATION_VALUE}"${otherSalutationSelected ? " selected" : ""}>Outro tratamento</option></select></label>
      ${otherRecipientSelected ? `<label class="field"><span>Outro destinatário ou setor *</span><input type="text" data-bind="correspondence.recipient" value="${e(c.recipient)}" placeholder="Digite a sigla, secretaria, pessoa ou setor" autofocus /></label>` : ""}
      ${otherSalutationSelected ? `<label class="field"><span>Outro tratamento *</span><input type="text" data-bind="correspondence.salutation" value="${e(c.salutation)}" placeholder="Digite a saudação ou o tratamento" autofocus /></label>` : ""}
    </div>
  </section>`;
}

function renderOfficialCorrespondenceContent() {
  const c = state.correspondence;
  const type = correspondenceType();
  const typeLower = type.label.toLowerCase();
  return `${pageHeading("Etapa 2", `Escreva ${type.article} ${typeLower}`, "Informe o texto e as pessoas que assinarão o documento.")}
  <section class="panel">
    ${panelHeader(`Texto d${type.article === "a" ? "a" : "o"} ${typeLower}`, "Formate o conteúdo como desejar; o Word manterá os estilos, alinhamentos, listas e tabelas aplicados aqui.")}
    ${renderRichTextEditor({ key: "correspondence.base", html: c.baseHtml, text: c.baseText, label: "Conteúdo *", placeholder: `Escreva o texto integral d${type.article === "a" ? "a" : "o"} ${typeLower}…`, help: "Use a barra para formatar e organizar as informações" })}
  </section>
  <section class="panel">
    ${panelHeader("Assinaturas", "Adicione uma ou mais pessoas. Os nomes ficarão em negrito e os cargos em itálico, organizados em até duas colunas.", `<button class="button button-secondary" type="button" data-action="open-signatures">Configurar assinaturas</button>`)}
    ${renderCorrespondenceSignatureSelector()}
  </section>
  <section class="panel">
    ${panelHeader("Fotos e legendas", "Opcional. Cada foto será colocada em uma página própria, com numeração automática e a legenda abaixo.")}
    <label class="upload-box" data-drop="correspondence-photos">
      <input type="file" multiple accept="image/jpeg,image/png,image/bmp,image/gif,image/webp" data-file="correspondence-photos" />
      <span class="upload-icon" aria-hidden="true">+</span>
      <span class="upload-copy"><strong>Anexar fotos</strong><span>JPEG, PNG, BMP, GIF ou WebP • até 20 MB por arquivo</span></span>
    </label>
    ${c.photos.length ? `<div class="photo-list notification-photo-list">${c.photos.map(renderOfficialCorrespondencePhoto).join("")}</div>` : `<div class="empty-state notification-empty-state"><div><strong>Nenhuma foto anexada</strong><span>Esta parte é opcional e não aparecerá no Word se permanecer vazia.</span></div></div>`}
  </section>
  <div class="notice is-warning"><span aria-hidden="true">!</span><span>A IA pode revisar a linguagem na etapa seguinte, sem inventar fatos, datas, números ou providências. Confira o texto antes de gerar o Word.</span></div>`;
}

function renderOfficialCorrespondencePhoto(photo, index) {
  return `<article class="photo-card" data-correspondence-photo-id="${e(photo.id)}">
    <img src="${e(photo.url)}" alt="Imagem ${index + 1}: ${e(photo.file.name)}" />
    <div class="photo-card-main">
      <div class="photo-card-heading"><span class="photo-index">${String(index + 1).padStart(2, "0")}</span><strong>${e(photo.file.name)}</strong></div>
      <textarea data-correspondence-photo-caption="${e(photo.id)}" maxlength="500" placeholder="Legenda da foto…">${e(photo.caption)}</textarea>
    </div>
    <div class="photo-card-actions"><button class="icon-button" type="button" data-action="remove-correspondence-photo" data-id="${e(photo.id)}" aria-label="Remover foto" title="Remover">×</button></div>
  </article>`;
}

function renderOfficialCorrespondenceReview() {
  const c = state.correspondence;
  const type = correspondenceType();
  const typeLower = type.label.toLowerCase();
  return `${pageHeading("Etapa 3", `Revise ${type.article} ${typeLower}`, "Confira os dados e ajuste o texto final antes de baixar o Word.")}
  <section class="panel">
    ${panelHeader("Texto final", `Somente o conteúdo deste campo será usado como corpo d${type.article === "a" ? "a" : "o"} ${typeLower}.`, `<button class="button button-secondary" type="button" data-action="improve-correspondence">✦ Revisar com IA</button>`)}
    ${renderRichTextEditor({ key: "correspondence.final", html: c.finalHtml, text: c.finalText, label: "Redação final *", placeholder: "Revise o texto final…", help: "Revise nomes, datas, valores e números" })}
  </section>
  <div class="summary-grid">
    ${summaryCard(type.label, c.number, `${c.place}, ${formatDateLong(c.date)}`)}
    ${summaryCard("Destinatário", formatOfficialCorrespondenceRecipient(c.recipient), c.salutation)}
    ${summaryCard("Anexos", `${c.photos.length} foto(s)`, c.photos.length ? "Todas com legenda" : "Sem fotografias")}
  </div>
  <section class="panel review-panel">
    <div class="review-block"><h3>Assinaturas</h3><div class="review-signatures">${c.signatories.map((signature) => signaturePreview(signature)).join("")}</div></div>
  </section>
  <div class="notice"><span aria-hidden="true">✓</span><span><strong>Modelo conferido.</strong> O arquivo será criado com o cabeçalho oficial, a paginação e a mesma formatação usada no memorando.</span></div>`;
}

function correspondenceType() {
  return CORRESPONDENCE_TYPES[state.correspondence.kind] || CORRESPONDENCE_TYPES.memorando;
}

function renderCorrespondence() {
  const renders = [renderCorrespondenceInfo, renderCorrespondenceContent, renderCorrespondenceReview];
  return renders[state.step]();
}

function renderCorrespondenceInfo() {
  const c = state.correspondence;
  const type = correspondenceType();
  return `${pageHeading("Etapa 1", `Dados d${type.article === "a" ? "a" : "o"} ${type.label.toLowerCase()}`, type.description)}
  <section class="panel">
    ${panelHeader("Identificação institucional", "Estes dados serão usados no cabeçalho do arquivo Word.")}
    <div class="field-grid">
      <label class="field"><span>Órgão ou empresa</span><input type="text" data-bind="correspondence.organization" value="${e(c.organization)}" placeholder="Ex.: Secretaria Municipal de Obras" /></label>
      <label class="field"><span>Departamento ou setor</span><input type="text" data-bind="correspondence.department" value="${e(c.department)}" placeholder="Ex.: Departamento Administrativo" /></label>
    </div>
    <div class="field-grid three" style="margin-top: 18px">
      <label class="field"><span>Número do documento</span><input type="text" data-bind="correspondence.number" value="${e(c.number)}" placeholder="Ex.: 015/2026" /></label>
      <label class="field"><span>Local</span><input type="text" data-bind="correspondence.place" value="${e(c.place)}" placeholder="Ex.: São Paulo" /></label>
      <label class="field"><span>Data *</span><input type="date" data-bind="correspondence.date" value="${e(c.date)}" /></label>
    </div>
  </section>
  <section class="panel">
    ${panelHeader("Destinatário e assunto", "Informe a quem o documento se destina e o tema principal.")}
    <div class="field-grid">
      <label class="field"><span>Destinatário *</span><input type="text" data-bind="correspondence.recipient" value="${e(c.recipient)}" placeholder="Nome da pessoa, setor ou entidade" /></label>
      <label class="field"><span>Cargo, setor ou endereço</span><input type="text" data-bind="correspondence.recipientRole" value="${e(c.recipientRole)}" placeholder="Opcional" /></label>
    </div>
    <label class="field stacked"><span>Assunto *</span><input type="text" maxlength="220" data-bind="correspondence.subject" value="${e(c.subject)}" placeholder="Resuma o motivo do documento" /></label>
  </section>`;
}

function renderCorrespondenceContent() {
  const c = state.correspondence;
  const type = correspondenceType();
  return `${pageHeading("Etapa 2", `Escreva ${type.article} ${type.label.toLowerCase()}`, "Registre somente os fatos, solicitações e orientações que devem constar no documento.")}
  <section class="panel">
    ${panelHeader("Conteúdo", "Você poderá editar o texto e solicitar uma revisão opcional da IA na próxima etapa.")}
    ${renderRichTextEditor({ key: "correspondence.base", html: c.baseHtml, text: c.baseText, label: "Corpo do documento *", placeholder: "Escreva o conteúdo do documento…", help: "Use a barra para formatar e organizar as informações" })}
  </section>
  <section class="panel">
    ${panelHeader("Assinaturas", "Adicione uma ou mais pessoas. Os nomes ficarão em negrito e os cargos em itálico.", `<button class="button button-secondary" type="button" data-action="open-signatures">Configurar assinaturas</button>`)}
    ${renderCorrespondenceSignatureSelector()}
  </section>
  <div class="notice is-warning"><span aria-hidden="true">!</span><span>A IA será orientada a revisar a linguagem sem inventar fatos, datas, leis, prazos ou penalidades. Confira o texto antes de gerar o Word.</span></div>`;
}

function renderCorrespondenceReview() {
  const c = state.correspondence;
  const type = correspondenceType();
  return `${pageHeading("Etapa 3", `Revise ${type.article} ${type.label.toLowerCase()}`, "Edite livremente, solicite uma revisão opcional da IA ou gere o Word com o texto atual.")}
  <section class="panel">
    ${panelHeader("Texto final", "Somente o conteúdo deste campo será incluído como corpo do documento.", `<button class="button button-secondary" type="button" data-action="improve-correspondence">✦ Revisar com IA</button>`)}
    ${renderRichTextEditor({ key: "correspondence.final", html: c.finalHtml, text: c.finalText, label: "Redação final *", placeholder: "Revise o texto final…", help: "Revise nomes, datas e informações sensíveis" })}
  </section>
  <div class="summary-grid">
    ${summaryCard("Documento", type.label, c.number || "Sem número")}
    ${summaryCard("Destinatário", c.recipient, c.recipientRole || "Sem complemento")}
    ${summaryCard("Emissão", formatDate(c.date), c.place || "Local não informado")}
  </div>
  <section class="panel review-panel">
    <div class="review-block"><h3>Assinaturas</h3><div class="review-signatures">${c.signatories.map((signature) => signaturePreview(signature)).join("")}</div></div>
  </section>
  ${!isApiReady() ? `<div class="notice is-warning"><span aria-hidden="true">✦</span><span>Configure sua chave da OpenAI para usar a revisão automática, ou continue com a edição manual.</span></div>` : `<div class="notice"><span aria-hidden="true">✓</span><span>IA configurada com <strong>${e(modelDisplayName(getSelectedModel()))}</strong>. O texto só será enviado quando você clicar no botão.</span></div>`}`;
}

function renderProgress() {
  return `<section class="panel progress-card">
    <div class="progress-orbit"><div class="progress-mark">D</div></div>
    <h2>Preparando o documento</h2>
    <p id="progressMessage">${e(state.generation.message || "Organizando o conteúdo…")}</p>
    <div class="progress-line"><span id="progressBar" style="width:${state.generation.progress}%"></span></div>
  </section>`;
}

function renderSuccess() {
  const documentLabel = state.flow === "report"
    ? "O relatório fotográfico"
    : state.flow === "cota"
      ? "A folha de cota"
      : state.flow === "notification"
        ? "A notificação"
        : state.flow === "warning"
          ? "A advertência"
        : `${correspondenceType().article.toUpperCase()} ${correspondenceType().label.toLowerCase()}`;
  const historyMessage = state.lastDownload?.saved
    ? " Uma cópia também foi salva no histórico da sua conta."
    : " O download foi concluído, mas não foi possível salvar uma cópia no histórico desta vez.";
  return `<section class="panel success-card">
    <div class="success-mark">✓</div>
    <h2>Documento criado</h2>
    <p>${documentLabel} foi gerado e o download foi iniciado.${historyMessage}</p>
    <div class="success-actions">
      <button class="button button-secondary" type="button" data-action="home">Voltar ao início</button>
      <button class="button button-secondary" type="button" data-action="new-document">Criar outro</button>
      <button class="button button-primary" type="button" data-action="download-again">Baixar novamente</button>
    </div>
  </section>`;
}

function cotaMetrics(text) {
  return { characters: text.length, lines: cotaTextLayout(text).length };
}

function measureCotaLine(text) {
  if (!cotaMeasureContext) {
    const canvas = document.createElement("canvas");
    cotaMeasureContext = canvas.getContext("2d");
    if (cotaMeasureContext) cotaMeasureContext.font = "16px Arial";
  }
  if (cotaMeasureContext) return cotaMeasureContext.measureText(text).width;
  return Array.from(text).reduce((width, character) => width + (/[ilI1.,;:'!|]/.test(character) ? 3.4 : /[mwMW@%]/.test(character) ? 12.5 : character === " " ? 4.4 : 8), 0);
}

function cotaTextLayout(text) {
  const normalized = String(text || "").replace(/\r\n?/g, "\n").trim();
  if (!normalized) return [];
  const lines = [];
  const paragraphs = normalized.split(/\n\s*\n/);
  paragraphs.forEach((paragraph, paragraphIndex) => {
    const words = paragraph.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
    const paragraphLines = [];
    let currentLine = "";
    words.forEach((word) => {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (!currentLine || measureCotaLine(candidate) <= COTA_LINE_WIDTH_PX) currentLine = candidate;
      else {
        paragraphLines.push(currentLine);
        currentLine = word;
      }
    });
    if (currentLine) paragraphLines.push(currentLine);
    paragraphLines.forEach((line, index) => lines.push({
      text: line,
      justify: index < paragraphLines.length - 1 && line.includes(" "),
      kind: "body",
    }));
    if (paragraphIndex < paragraphs.length - 1) {
      for (let gap = 0; gap < COTA_PARAGRAPH_GAP_LINES; gap += 1) {
        lines.push({ text: "", justify: false, kind: "paragraph-gap" });
      }
    }
  });
  return lines;
}

function wrapCotaText(text) {
  return cotaTextLayout(text).map((line) => line.text);
}

function justifyCotaLine(text) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return words.join(" ");
  const naturalText = words.join(" ");
  const spaceWidth = Math.max(1, measureCotaLine(" "));
  const extraSpaces = Math.max(0, Math.floor((COTA_JUSTIFIED_WIDTH_PX - measureCotaLine(naturalText)) / spaceWidth));
  const gaps = words.length - 1;
  const spacesPerGap = Math.floor(extraSpaces / gaps);
  const remainder = extraSpaces % gaps;
  return words.map((word, index) => {
    if (index === gaps) return word;
    const count = 1 + spacesPerGap + (index < remainder ? 1 : 0);
    return `${word}${" ".repeat(count)}`;
  }).join("");
}

function startFlow(flow, kind = "") {
  state.admin.open = false;
  state.history.open = false;
  state.kanban.open = false;
  state.flow = flow;
  if (flow === "correspondence" && CORRESPONDENCE_TYPES[kind]) {
    if (state.correspondence.kind !== kind) {
      state.correspondence.photos.forEach((photo) => URL.revokeObjectURL(photo.url));
      state.correspondence = createCorrespondenceState(readStorage("docflow-preferences", {}));
    }
    state.correspondence.kind = kind;
    state.correspondence.complete = false;
  }
  if (isNoticeFlow(flow)) noticeState(flow).complete = false;
  state.step = 0;
  state.validationFields = [];
  state.generation = { running: false, progress: 0, message: "" };
  currentData().complete = false;
  render();
  focusMain();
}

function goHome() {
  state.flow = null;
  state.admin.open = false;
  state.history.open = false;
  state.kanban.open = false;
  state.step = 0;
  state.validationFields = [];
  state.generation.running = false;
  render();
  focusMain();
}

function focusMain() {
  window.scrollTo({ top: 0, behavior: "smooth" });
  setTimeout(() => elements.main.focus({ preventScroll: true }), 0);
}

async function nextStep() {
  if (!validateCurrentStep()) return;
  if (state.step < currentSteps().length - 1) {
    if (state.flow === "cota" && state.step === 0) {
      if (state.cota.useAI) {
        await improveCota({ advanceOnSuccess: true });
        return;
      }
      state.cota.finalText = state.cota.baseText.trim();
    }
    if (state.flow === "correspondence" && state.step === 1 && !state.correspondence.finalText.trim()) {
      state.correspondence.finalText = state.correspondence.baseText.trim();
      state.correspondence.finalHtml = state.correspondence.baseHtml
        ? sanitizeRichTextHtml(state.correspondence.baseHtml)
        : "";
    }
    if (isNoticeFlow() && state.step === 1 && !noticeState().finalText.trim()) {
      noticeState().finalText = noticeState().baseText.trim();
    }
    state.step += 1;
    render();
    focusMain();
    return;
  }
  if (state.flow === "report") generateReport();
  else if (state.flow === "cota") generateCota();
  else if (isNoticeFlow()) generateNotification();
  else generateCorrespondence();
}

function previousStep() {
  if (state.step === 0) {
    goHome();
    return;
  }
  state.step -= 1;
  state.validationFields = [];
  render();
  focusMain();
}

function clearValidationHighlights() {
  state.validationFields = [];
  document.querySelectorAll(".is-validation-error").forEach((field) => {
    field.classList.remove("is-validation-error");
    field.removeAttribute("aria-invalid");
  });
}

function clearValidationHighlight(target) {
  const field = target?.closest?.(".is-validation-error") || (target?.matches?.(".is-validation-error") ? target : null);
  if (!field) return;
  field.classList.remove("is-validation-error");
  field.removeAttribute("aria-invalid");
  state.validationFields = state.validationFields.filter((selector) =>
    !target?.matches?.(selector) && !target?.closest?.(selector),
  );
}

function validationElements(fields = []) {
  const found = [];
  fields.forEach((field) => {
    if (!field) return;
    if (typeof field === "string") {
      document.querySelectorAll(field).forEach((element) => found.push(element));
    } else {
      found.push(field);
    }
  });
  return [...new Set(found)];
}

function showFieldValidationMessage({ title, text, fields }) {
  state.validationFields = fields.filter((field) => typeof field === "string");
  const invalidFields = validationElements(fields);
  invalidFields.forEach((field) => {
    field.classList.add("is-validation-error");
    field.setAttribute("aria-invalid", "true");
  });
  const firstField = invalidFields[0];
  showMessage({
    title,
    text,
    actions: [{
      label: "Entendi",
      primary: true,
      onClick: () => requestAnimationFrame(() => {
        firstField?.scrollIntoView?.({ behavior: "smooth", block: "center" });
        firstField?.focus?.({ preventScroll: true });
      }),
    }],
  });
}

function applyValidationHighlights() {
  validationElements(state.validationFields).forEach((field) => {
    field.classList.add("is-validation-error");
    field.setAttribute("aria-invalid", "true");
  });
}

function validateCurrentStep() {
  clearValidationHighlights();
  if (state.flow === "report") {
    const r = state.report;
    if (state.step === 0) {
      if (!r.title.trim() || !r.date || !r.introduction.trim()) {
        showFieldValidationMessage({
          title: "Complete os dados principais",
          text: "Informe o título, a data e a introdução antes de continuar.",
          fields: [
            !r.title.trim() && '[data-bind="report.title"]',
            !r.date && '[data-bind="report.date"]',
            !r.introduction.trim() && '[data-bind="report.introduction"]',
          ],
        });
        return false;
      }
    }
    if (state.step === 1 && !r.photos.length) {
      showFieldValidationMessage({
        title: "Adicione as fotografias",
        text: "Selecione pelo menos uma imagem para montar o relatório.",
        fields: ['[data-drop="report-photos"]'],
      });
      return false;
    }
    if (state.step === 2) {
      const invalidTopicFields = r.topics.flatMap((topic) => [
        !topic.title.trim() && `[data-topic-field="title"][data-id="${topic.id}"]`,
        !topic.text.trim() && `[data-topic-field="text"][data-id="${topic.id}"]`,
      ]).filter(Boolean);
      if (invalidTopicFields.length) {
        showFieldValidationMessage({
          title: "Complete os tópicos",
          text: "Todo tópico adicionado precisa ter título e texto, ou deve ser removido.",
          fields: invalidTopicFields,
        });
        return false;
      }
      if (!r.responsibles.length) {
        showFieldValidationMessage({
          title: "Selecione um responsável",
          text: "Escolha pelo menos uma pessoa para a área de assinaturas.",
          fields: ['[data-signature-target="report"]'],
        });
        return false;
      }
    }
    return true;
  }

  if (state.flow === "correspondence") {
    const c = state.correspondence;
    if (isOfficialCorrespondenceFlow()) {
      const type = correspondenceType();
      const typeLower = type.label.toLowerCase();
      if (state.step === 0 && (!c.place.trim() || !c.date || !c.number.trim() || !c.recipient.trim() || !c.salutation.trim())) {
        showFieldValidationMessage({
          title: "Complete a identificação",
          text: `Informe cidade, data, número d${type.article === "a" ? "a" : "o"} ${typeLower}, destinatário e saudação antes de continuar.`,
          fields: [
            !c.place.trim() && '[data-bind="correspondence.place"]',
            !c.date && '[data-bind="correspondence.date"]',
            !c.number.trim() && '[data-bind="correspondence.number"]',
            !c.recipient.trim() && (c.recipientSecretariat === OTHER_RECIPIENT_VALUE
              ? '[data-bind="correspondence.recipient"]'
              : "[data-correspondence-recipient-select]"),
            !c.salutation.trim() && (c.salutationOption === OTHER_SALUTATION_VALUE
              ? '[data-bind="correspondence.salutation"]'
              : "[data-correspondence-salutation-select]"),
          ],
        });
        return false;
      }
      const invalidSignatory = c.signatories.find((item) => !item.name.trim() || !item.role.trim());
      if (state.step === 1 && (!c.baseText.trim() || !c.signatories.length || invalidSignatory)) {
        showFieldValidationMessage({
          title: "Complete o conteúdo",
          text: "Informe o texto e selecione pelo menos uma pessoa com nome e cargo para assinar.",
          fields: [
            !c.baseText.trim() && '[data-rich-editor="correspondence.base"]',
            (!c.signatories.length || invalidSignatory) && '[data-signature-target="correspondence"]',
          ],
        });
        return false;
      }
      const photosWithoutCaption = c.photos.filter((photo) => !photo.caption.trim());
      if (state.step === 1 && photosWithoutCaption.length) {
        showFieldValidationMessage({
          title: "Complete as legendas",
          text: `Toda foto anexada a${type.article} ${typeLower} precisa ter uma legenda, ou deve ser removida.`,
          fields: photosWithoutCaption.map((photo) => `[data-correspondence-photo-caption="${photo.id}"]`),
        });
        return false;
      }
      if (state.step === 2 && !c.finalText.trim()) {
        showFieldValidationMessage({
          title: "Texto final vazio",
          text: `Mantenha algum conteúdo antes de gerar ${type.article} ${typeLower}.`,
          fields: ['[data-rich-editor="correspondence.final"]'],
        });
        return false;
      }
      return true;
    }
    if (state.step === 0 && (!c.date || !c.recipient.trim() || !c.subject.trim())) {
      showFieldValidationMessage({
        title: "Complete os dados do documento",
        text: "Informe a data, o destinatário e o assunto antes de continuar.",
        fields: [
          !c.date && '[data-bind="correspondence.date"]',
          !c.recipient.trim() && '[data-bind="correspondence.recipient"]',
          !c.subject.trim() && '[data-bind="correspondence.subject"]',
        ],
      });
      return false;
    }
    const invalidSignatory = c.signatories.find((item) => !item.name.trim() || !item.role.trim());
    if (state.step === 1 && (!c.baseText.trim() || !c.signatories.length || invalidSignatory)) {
      showFieldValidationMessage({
        title: "Complete o conteúdo",
        text: "Informe o corpo do documento e selecione pelo menos uma pessoa com nome e cargo para assinar.",
        fields: [
          !c.baseText.trim() && '[data-rich-editor="correspondence.base"]',
          (!c.signatories.length || invalidSignatory) && '[data-signature-target="correspondence"]',
        ],
      });
      return false;
    }
    if (state.step === 2 && !c.finalText.trim()) {
      showFieldValidationMessage({
        title: "Texto final vazio",
        text: "Mantenha algum conteúdo antes de gerar o documento.",
        fields: ['[data-rich-editor="correspondence.final"]'],
      });
      return false;
    }
    return true;
  }

  if (isNoticeFlow()) {
    const n = noticeState();
    const notice = noticeCopy();
    if (state.step === 0 && (!n.city.trim() || !n.date || !n.number.trim() || !n.process.trim() || !n.work.trim() || !n.contractor.trim())) {
      showFieldValidationMessage({
        title: "Complete a identificação",
        text: `Informe cidade, data, número da ${notice.lower}, processo, obra e contratada antes de continuar.`,
        fields: [
          !n.city.trim() && `[data-bind="${notice.key}.city"]`,
          !n.date && `[data-bind="${notice.key}.date"]`,
          !n.number.trim() && `[data-bind="${notice.key}.number"]`,
          !n.process.trim() && `[data-bind="${notice.key}.process"]`,
          !n.work.trim() && `[data-bind="${notice.key}.work"]`,
          !n.contractor.trim() && `[data-bind="${notice.key}.contractor"]`,
        ],
      });
      return false;
    }
    if (state.step === 1) {
      if (!n.baseText.trim()) {
        showFieldValidationMessage({
          title: "Informe o texto",
          text: `Escreva o conteúdo da ${notice.lower} antes de continuar.`,
          fields: [`[data-bind="${notice.key}.baseText"]`],
        });
        return false;
      }
      const invalidSigners = n.signatories.filter((item) => !item.name.trim() || !item.role.trim());
      if (!n.signatories.length || invalidSigners.length) {
        showFieldValidationMessage({
          title: "Complete as assinaturas",
          text: "Informe o nome e o respectivo cargo de cada pessoa que vai assinar.",
          fields: invalidSigners.length
            ? invalidSigners.map((item) => `[data-signature-target="notice"][data-id="${item.id}"]`)
            : ['[data-signature-target="notice"]'],
        });
        return false;
      }
      const photosWithoutCaption = n.photos.filter((photo) => !photo.caption.trim());
      if (photosWithoutCaption.length) {
        showFieldValidationMessage({
          title: "Complete as legendas",
          text: "Toda foto anexada precisa ter uma legenda, ou deve ser removida.",
          fields: photosWithoutCaption.map((photo) => `[data-notification-photo-caption="${photo.id}"]`),
        });
        return false;
      }
    }
    if (state.step === 2 && !n.finalText.trim()) {
      showFieldValidationMessage({
        title: "Texto final vazio",
        text: `Mantenha algum conteúdo antes de gerar a ${notice.lower}.`,
        fields: [`[data-bind="${notice.key}.finalText"]`],
      });
      return false;
    }
    return true;
  }

  const c = state.cota;
  if (state.step === 0) {
    if (!c.baseText.trim()) {
      showFieldValidationMessage({
        title: "Escreva o texto-base",
        text: "Informe a ideia que deverá constar na folha de cota.",
        fields: ['[data-bind="cota.baseText"]'],
      });
      return false;
    }
    if (c.year && !/^\d{4}$/.test(c.year)) {
      showFieldValidationMessage({
        title: "Ano inválido",
        text: "Informe o ano com quatro dígitos, por exemplo 2026.",
        fields: ['[data-bind="cota.year"]'],
      });
      return false;
    }
  }
  if (state.step === 1) {
    const metrics = cotaMetrics(c.finalText);
    if (!c.finalText.trim()) {
      showFieldValidationMessage({
        title: "Texto final vazio",
        text: "Mantenha algum conteúdo antes de gerar o documento.",
        fields: ['[data-bind="cota.finalText"]'],
      });
      return false;
    }
    if (metrics.characters > MAX_COTA_TEXT || metrics.lines > MAX_COTA_LINES) {
      showFieldValidationMessage({
        title: "Texto acima da capacidade",
        text: `Reduza o conteúdo para no máximo ${MAX_COTA_TEXT} caracteres e ${MAX_COTA_LINES} linhas estimadas.`,
        fields: ['[data-bind="cota.finalText"]'],
      });
      return false;
    }
  }
  if (state.step === 2 && (!c.signer.trim() || !c.signerRole.trim())) {
    showFieldValidationMessage({
      title: "Selecione a assinatura",
      text: "Escolha a pessoa que assinará a folha de cota antes de gerar o Word.",
      fields: ['[data-signature-target="cota"]'],
    });
    return false;
  }
  return true;
}

function setPath(path, value) {
  const parts = path.split(".");
  let target = state;
  for (let index = 0; index < parts.length - 1; index += 1) target = target[parts[index]];
  target[parts.at(-1)] = value;
}

function getBoundValue(target) {
  if (target.type === "checkbox") return target.checked;
  if (target.type === "radio") return target.value === "true";
  return target.value;
}

function updateCounter(target) {
  if (target.dataset.bind === "report.introduction") {
    const counter = target.parentElement.querySelector(".text-counter span:last-child");
    if (counter) counter.textContent = `${target.value.length}/4000`;
  }
  if (["cota.baseText", "cota.finalText"].includes(target.dataset.bind)) {
    const metrics = cotaMetrics(target.value);
    const line = document.querySelector("#cotaLineCount");
    const chars = document.querySelector("#cotaCharCount");
    if (line) line.textContent = `${metrics.lines} de ${MAX_COTA_LINES} linhas estimadas`;
    if (chars) chars.textContent = `${metrics.characters}/${MAX_COTA_TEXT}`;
  }
  if (["correspondence.baseText", "correspondence.finalText"].includes(target.dataset.bind)) {
    const counter = target.parentElement.querySelector(".text-counter span:last-child");
    if (counter) counter.textContent = `${target.value.length}/${MAX_CORRESPONDENCE_TEXT}`;
  }
  if (["notification.baseText", "notification.finalText", "warning.baseText", "warning.finalText"].includes(target.dataset.bind)) {
    const counter = target.parentElement.querySelector(".text-counter span:last-child");
    if (counter) counter.textContent = `${target.value.length}/${MAX_CORRESPONDENCE_TEXT}`;
  }
}

async function handleFiles(kind, files, id = "") {
  const list = [...files];
  if (!list.length) return;
  const valid = list.filter((file) => {
    if (!ACCEPTED_IMAGES.includes(file.type)) {
      showToast(`${file.name}: formato de imagem não aceito.`);
      return false;
    }
    if (file.size > 20 * 1024 * 1024) {
      showToast(`${file.name}: o limite é 20 MB por imagem.`);
      return false;
    }
    return true;
  });
  if (!valid.length) return;

  if (kind === "report-photos") {
    const known = new Set(state.report.photos.map((photo) => `${photo.file.name}-${photo.file.size}-${photo.file.lastModified}`));
    valid.forEach((file) => {
      const signature = `${file.name}-${file.size}-${file.lastModified}`;
      if (!known.has(signature)) {
        state.report.photos.push({ id: makeId("photo"), file, url: URL.createObjectURL(file), description: "", status: "idle", error: "" });
        known.add(signature);
      }
    });
    sortPhotos();
    render();
    return;
  }

  if (["correspondence-photos", "notification-photos", "warning-photos"].includes(kind)) {
    const owner = kind === "correspondence-photos"
      ? state.correspondence
      : kind === "warning-photos"
        ? state.warning
        : state.notification;
    const known = new Set(owner.photos.map((photo) => `${photo.file.name}-${photo.file.size}-${photo.file.lastModified}`));
    valid.forEach((file) => {
      const signature = `${file.name}-${file.size}-${file.lastModified}`;
      if (!known.has(signature)) {
        owner.photos.push({ id: makeId(`${kind}-photo`), file, url: URL.createObjectURL(file), caption: "" });
        known.add(signature);
      }
    });
    render();
    return;
  }

  const file = valid[0];
  const record = { file, url: URL.createObjectURL(file) };
  if (kind === "report-logo") replaceImageRecord(state.report, "logo", record);
  if (kind === "report-intro") replaceImageRecord(state.report, "introImage", record);
  if (kind === "cota-context") replaceImageRecord(state.cota, "contextImage", record);
  if (kind === "topic-image") {
    const topic = state.report.topics.find((item) => item.id === id);
    if (topic) replaceImageRecord(topic, "image", record);
  }
  render();
}

function replaceImageRecord(owner, key, record) {
  if (owner[key]?.url) URL.revokeObjectURL(owner[key].url);
  owner[key] = record;
}

function removeFile(kind, id) {
  if (kind === "report-logo") replaceImageRecord(state.report, "logo", null);
  if (kind === "report-intro") replaceImageRecord(state.report, "introImage", null);
  if (kind === "cota-context") replaceImageRecord(state.cota, "contextImage", null);
  if (kind === "topic-image") {
    const topic = state.report.topics.find((item) => item.id === id);
    if (topic) replaceImageRecord(topic, "image", null);
  }
  render();
}

function removeNotificationPhoto(id) {
  const owner = noticeState();
  const photo = owner.photos.find((item) => item.id === id);
  if (photo?.url) URL.revokeObjectURL(photo.url);
  owner.photos = owner.photos.filter((item) => item.id !== id);
  render();
}

function removeCorrespondencePhoto(id) {
  const photo = state.correspondence.photos.find((item) => item.id === id);
  if (photo?.url) URL.revokeObjectURL(photo.url);
  state.correspondence.photos = state.correspondence.photos.filter((item) => item.id !== id);
  render();
}

function sortPhotos() {
  const byDate = state.report.order === "date";
  state.report.photos.sort((a, b) => {
    if (byDate) return a.file.lastModified - b.file.lastModified || a.file.name.localeCompare(b.file.name, "pt-BR", { numeric: true });
    return a.file.name.localeCompare(b.file.name, "pt-BR", { numeric: true });
  });
}

function removePhoto(id) {
  const index = state.report.photos.findIndex((photo) => photo.id === id);
  if (index < 0) return;
  URL.revokeObjectURL(state.report.photos[index].url);
  state.report.photos.splice(index, 1);
  render();
}

function openApiConfiguration() {
  elements.apiKeyInput.value = "";
  elements.apiKeyInput.placeholder = state.api.hasKey
    ? `Nova chave (a atual termina em ••••${state.api.lastFour})`
    : "sk-...";
  elements.apiKeyHelp.textContent = state.api.hasKey
    ? `Já existe uma chave salva terminada em ••••${state.api.lastFour}. Deixe o campo vazio para mantê-la.`
    : "A chave não será exibida novamente. Nunca a inclua em prints, documentos ou mensagens.";
  elements.modelSelect.value = state.api.model;
  elements.customModelInput.value = state.api.customModel;
  elements.customModelField.classList.toggle("is-hidden", state.api.model !== "custom");
  elements.removeApiButton.classList.toggle("is-hidden", !state.api.hasKey);
  elements.apiFeedback.className = "inline-feedback is-hidden";
  elements.apiFeedback.textContent = "";
  openDialog(elements.apiDialog);
  setTimeout(() => elements.apiKeyInput.focus(), 80);
}

function apiFormValues() {
  return {
    apiKey: elements.apiKeyInput.value.trim(),
    model: elements.modelSelect.value,
    customModel: elements.customModelInput.value.trim(),
  };
}

async function saveApiConfiguration({ close = true } = {}) {
  const values = apiFormValues();
  const model = getSelectedModel(values);
  if (!model) {
    showApiFeedback("Informe o ID do modelo personalizado.", true);
    return false;
  }
  if (!values.apiKey && !state.api.hasKey) {
    showApiFeedback("Informe sua chave da API da OpenAI.", true);
    return false;
  }

  try {
    const api = await apiRequest("/api/account/api-key", {
      method: "PUT",
      body: { apiKey: values.apiKey, model },
    });
    state.api = {
      hasKey: Boolean(api.hasKey),
      lastFour: api.lastFour || state.api.lastFour,
      model: values.model,
      customModel: values.customModel,
    };
    elements.apiKeyInput.value = "";
    elements.removeApiButton.classList.remove("is-hidden");
    updateApiBadge();
    if (close) closeDialog(elements.apiDialog);
    showToast(`IA configurada com ${modelDisplayName(model)}.`);
    if (state.flow) render();
    return true;
  } catch (error) {
    if (error.status === 401) showAuthGate("login");
    showApiFeedback(error.message, true);
    return false;
  }
}

function showApiFeedback(message, error = false) {
  elements.apiFeedback.textContent = message;
  elements.apiFeedback.className = `inline-feedback${error ? " is-error" : ""}`;
}

async function testApiConfiguration() {
  const values = apiFormValues();
  const model = getSelectedModel(values);
  if ((!values.apiKey && !state.api.hasKey) || !model) {
    showApiFeedback("Informe a chave e o modelo antes de testar.", true);
    return;
  }
  elements.testApiButton.disabled = true;
  elements.testApiButton.textContent = "Salvando…";
  showApiFeedback("Salvando a configuração com segurança…");
  try {
    const saved = await saveApiConfiguration({ close: false });
    if (!saved) return;
    elements.testApiButton.textContent = "Testando…";
    showApiFeedback("Verificando a conexão com a OpenAI…");
    await callOpenAI({
      prompt: "Responda somente com a palavra OK.",
      maxOutputTokens: 256,
      reasoningEffort: "none",
    });
    showApiFeedback(`Conexão confirmada com ${modelDisplayName(model)}.`);
  } catch (error) {
    showApiFeedback(error.message, true);
  } finally {
    elements.testApiButton.disabled = false;
    elements.testApiButton.textContent = "Salvar e testar";
  }
}

async function removeApiConfiguration() {
  elements.removeApiButton.disabled = true;
  showApiFeedback("Removendo a chave salva…");
  try {
    await apiRequest("/api/account/api-key", { method: "DELETE" });
    state.api = {
      hasKey: false,
      lastFour: "",
      model: "gpt-5.6-terra",
      customModel: "",
    };
    closeDialog(elements.apiDialog);
    updateApiBadge();
    if (state.flow) render();
    showToast("Chave da OpenAI removida da sua conta.");
  } catch (error) {
    if (error.status === 401) showAuthGate("login");
    showApiFeedback(error.message, true);
  } finally {
    elements.removeApiButton.disabled = false;
  }
}

async function callOpenAI({
  prompt,
  imageDataUrl = "",
  maxOutputTokens = 600,
  reasoningEffort = "low",
}) {
  const model = getSelectedModel();
  if (!state.api.hasKey || !model) throw new Error("Configure a chave da OpenAI e escolha um modelo.");

  const content = [{ type: "input_text", text: prompt }];
  if (imageDataUrl) content.push({ type: "input_image", image_url: imageDataUrl, detail: "high" });
  const body = {
    model,
    input: [{ role: "user", content }],
    max_output_tokens: maxOutputTokens,
  };
  if (model.startsWith("gpt-5.6")) {
    body.reasoning = { effort: reasoningEffort };
    body.text = { verbosity: "low" };
  }

  let response;
  try {
    response = await fetch("/api/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Não foi possível acessar a OpenAI. Verifique a internet e se o provedor do site permite chamadas externas.");
  }

  let data = {};
  try {
    data = await response.json();
  } catch {
    // Mantém a mensagem baseada no status quando a resposta não é JSON.
  }
  if (!response.ok) {
    if (response.status === 401) showAuthGate("login");
    throw new Error(openAIErrorMessage(response.status, data));
  }

  const text = extractResponseText(data);
  if (!text && data?.status === "incomplete" && data?.incomplete_details?.reason) {
    throw new Error("A resposta foi interrompida pelo limite de tokens. Tente novamente.");
  }
  if (!text) throw new Error("A OpenAI não retornou um texto utilizável.");
  return text.trim();
}

function extractResponseText(data) {
  if (typeof data.output_text === "string") return data.output_text;
  const texts = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (["output_text", "text"].includes(content.type) && content.text) texts.push(content.text);
      if (content.type === "refusal" && content.refusal) texts.push(content.refusal);
    }
  }
  return texts.join("\n");
}

function openAIErrorMessage(status, data) {
  const detail = data?.error?.message;
  if (status === 401) return "Chave da API inválida ou sem permissão. Confira a chave informada.";
  if (status === 403) return "A conta ou o projeto não tem permissão para usar esse modelo.";
  if (status === 404) return "O modelo informado não foi encontrado para esta conta.";
  if (status === 429) return "Limite de uso ou créditos da API atingidos. Verifique sua conta da OpenAI.";
  if (status >= 500) return "A OpenAI está temporariamente indisponível. Tente novamente em instantes.";
  return detail ? `A OpenAI recusou a solicitação: ${detail}` : `Falha na OpenAI (código ${status}).`;
}

async function optimizeImage(file, maxDimension = 1600, quality = 0.84) {
  const image = await loadImage(file);
  const ratio = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * ratio));
  const height = Math.max(1, Math.round(image.naturalHeight * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  URL.revokeObjectURL(image.src);
  return canvas.toDataURL("image/jpeg", quality);
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => {
      URL.revokeObjectURL(image.src);
      reject(new Error(`Não foi possível ler a imagem ${file.name}.`));
    };
    image.src = URL.createObjectURL(file);
  });
}

async function analyzePhoto(id, { quiet = false } = {}) {
  const photo = state.report.photos.find((item) => item.id === id);
  if (!photo) return false;
  if (!isApiReady()) {
    if (!quiet) {
      openApiConfiguration();
      showToast("Configure sua API para gerar a descrição.");
    }
    return false;
  }
  photo.status = "working";
  photo.error = "";
  updatePhotoCard(photo);
  try {
    const imageDataUrl = await optimizeImage(photo.file);
    const response = await callOpenAI({
      prompt: `${PHOTO_PROMPT}\n\nNome interno do arquivo: ${photo.file.name}`,
      imageDataUrl,
      maxOutputTokens: 180,
    });
    photo.description = response.replace(/^['"“”]+|['"“”]+$/g, "").trim().slice(0, 700);
    photo.status = "done";
    updatePhotoCard(photo);
    if (!quiet) showToast("Descrição técnica adicionada. Revise antes de gerar o documento.");
    return true;
  } catch (error) {
    photo.status = "error";
    photo.error = error.message;
    updatePhotoCard(photo);
    if (!quiet) showMessage({ title: "Não foi possível analisar a foto", text: error.message, kind: "error" });
    return false;
  }
}

function updatePhotoCard(photo) {
  const card = document.querySelector(`[data-photo-id="${photo.id}"]`);
  if (!card) return;
  const textarea = card.querySelector("textarea");
  if (textarea && textarea.value !== photo.description) textarea.value = photo.description;
  const indicator = card.querySelector(".analysis-state");
  if (indicator) {
    indicator.className = `analysis-state ${photo.status === "working" ? "is-working" : photo.status === "done" ? "is-done" : photo.status === "error" ? "is-error" : ""}`;
    indicator.textContent = photo.status === "working" ? "Analisando…" : photo.status === "done" ? "Descrição pronta" : photo.status === "error" ? "Falha na análise" : "Descrição manual";
  }
}

async function analyzeAllPhotos() {
  if (!isApiReady()) {
    openApiConfiguration();
    showToast("Configure sua API antes de iniciar as análises.");
    return;
  }
  const pending = state.report.photos.filter((photo) => !photo.description.trim());
  if (!pending.length) {
    showToast("Todas as fotografias já possuem descrição.");
    return;
  }
  state.analysis = { running: true, total: pending.length, done: 0 };
  render();

  let cursor = 0;
  const worker = async () => {
    while (cursor < pending.length) {
      const photo = pending[cursor];
      cursor += 1;
      await analyzePhoto(photo.id, { quiet: true });
      state.analysis.done += 1;
      updateAnalysisProgress();
    }
  };
  await Promise.all([worker(), worker()]);
  state.analysis.running = false;
  render();
  const failed = pending.filter((photo) => photo.status === "error").length;
  showToast(failed ? `Análise concluída; ${failed} foto(s) precisam de revisão manual.` : "Descrições concluídas. Revise os textos antes de continuar.");
}

function updateAnalysisProgress() {
  const progress = document.querySelector("#analysisProgress");
  if (progress) progress.textContent = `${state.analysis.done} de ${state.analysis.total} analisadas`;
  const count = document.querySelector("#photoCount");
  if (count) {
    const missing = state.report.photos.filter((photo) => !photo.description.trim()).length;
    count.textContent = `${state.report.photos.length} fotografia(s) • ${missing} sem descrição`;
  }
}

async function improveCota({ advanceOnSuccess = false } = {}) {
  const c = state.cota;
  if (!c.useAI) {
    c.finalText = c.baseText.trim();
    if (advanceOnSuccess) {
      state.step += 1;
      render();
      focusMain();
    }
    return true;
  }
  if (!isApiReady()) {
    openApiConfiguration();
    showToast("Configure sua API para revisar o texto.");
    return false;
  }
  const source = advanceOnSuccess ? c.baseText.trim() : (c.finalText.trim() || c.baseText.trim());
  if (!source) return false;
  state.generation = { running: true, progress: 28, message: c.contextImage ? "Preparando a imagem de contexto…" : "Analisando a redação com a IA…" };
  render();
  try {
    let imageDataUrl = "";
    if (c.contextImage) {
      imageDataUrl = await optimizeImage(c.contextImage.file);
      setGenerationProgress(48, "Imagem preparada. Analisando texto e contexto…");
    }
    const imageInstruction = imageDataUrl
      ? "\n\nCONTEXTO VISUAL: Use a imagem anexada somente para compreender o problema descrito. Não mencione detalhes incertos nem invente fatos que não estejam claros no texto ou na imagem."
      : "";
    const reviewed = await callOpenAI({
      prompt: `${COTA_PROMPT}${imageInstruction}\n\nTEXTO-BASE:\n${source}`,
      imageDataUrl,
      maxOutputTokens: 1200,
    });
    if (reviewed.length > MAX_COTA_TEXT || wrapCotaText(reviewed).length > MAX_COTA_LINES) {
      throw new Error("A revisão ficou maior que a capacidade da folha. O texto anterior foi mantido.");
    }
    c.finalText = reviewed.trim();
    state.generation.running = false;
    if (advanceOnSuccess) state.step += 1;
    render();
    if (advanceOnSuccess) focusMain();
    showToast("Texto revisado. Confira cada informação antes de gerar o Word.");
    return true;
  } catch (error) {
    state.generation.running = false;
    render();
    showMessage({ title: "A revisão não foi concluída", text: error.message, kind: "error" });
    return false;
  }
}

async function improveCorrespondence() {
  if (!isApiReady()) {
    openApiConfiguration();
    showToast("Configure sua API para revisar o texto.");
    return;
  }
  const c = state.correspondence;
  const source = c.finalText.trim() || c.baseText.trim();
  if (!source) return;
  state.generation = { running: true, progress: 32, message: `Revisando ${correspondenceType().article} ${correspondenceType().label.toLowerCase()} com a IA…` };
  render();
  try {
    const reviewed = await callOpenAI({
      prompt: `${CORRESPONDENCE_PROMPT}\n\nTIPO DE DOCUMENTO: ${correspondenceType().label}\n\nTEXTO-BASE:\n${source}`,
      maxOutputTokens: 2200,
    });
    if (reviewed.length > MAX_CORRESPONDENCE_TEXT) {
      throw new Error("A revisão ficou maior que o limite do documento. O texto anterior foi mantido.");
    }
    c.finalText = reviewed.trim();
    c.finalHtml = "";
    state.generation.running = false;
    render();
    showToast("Texto revisado. Confira cada informação antes de gerar o Word.");
  } catch (error) {
    state.generation.running = false;
    render();
    showMessage({ title: "A revisão não foi concluída", text: error.message, kind: "error" });
  }
}

function setGenerationProgress(progress, message) {
  state.generation.progress = progress;
  state.generation.message = message;
  const bar = document.querySelector("#progressBar");
  const label = document.querySelector("#progressMessage");
  if (bar) bar.style.width = `${progress}%`;
  if (label) label.textContent = message;
}

async function generateReport() {
  if (!validateCurrentStep()) return;
  if (!window.docx) {
    showMessage({ title: "Gerador indisponível", text: "O componente de criação do Word não foi carregado. Atualize a página e tente novamente.", kind: "error" });
    return;
  }
  state.generation = { running: true, progress: 8, message: "Organizando textos e seções…" };
  render();
  try {
    const blob = await buildReportDocument((progress, message) => setGenerationProgress(progress, message));
    const filename = `${slugify(state.report.title, "relatorio-fotografico")}.docx`;
    await finishDownload(blob, filename, "Relatório fotográfico");
    state.report.complete = true;
    state.generation.running = false;
    render();
  } catch (error) {
    state.generation.running = false;
    render();
    showMessage({ title: "Não foi possível gerar o relatório", text: error.message, kind: "error" });
  }
}

async function generateCota() {
  if (!validateCurrentStep()) return;
  if (!window.docx) {
    showMessage({ title: "Gerador indisponível", text: "O componente de criação do Word não foi carregado. Atualize a página e tente novamente.", kind: "error" });
    return;
  }
  state.generation = { running: true, progress: 12, message: "Distribuindo o texto entre as linhas…" };
  render();
  try {
    const blob = await buildCotaDocument((progress, message) => setGenerationProgress(progress, message));
    const suffix = [state.cota.processNumber, state.cota.year].filter(Boolean).join("-");
    const filename = `folha-de-cota${suffix ? `-${slugify(suffix)}` : ""}.docx`;
    await finishDownload(blob, filename, "Folha de cota");
    state.cota.complete = true;
    state.generation.running = false;
    render();
  } catch (error) {
    state.generation.running = false;
    render();
    showMessage({ title: "Não foi possível gerar a folha de cota", text: error.message, kind: "error" });
  }
}

async function generateNotification() {
  if (!validateCurrentStep()) return;
  const n = noticeState();
  const notice = noticeCopy();
  if (!window.docx) {
    showMessage({ title: "Gerador indisponível", text: "O componente de criação do Word não foi carregado. Atualize a página e tente novamente.", kind: "error" });
    return;
  }
  state.generation = { running: true, progress: 10, message: `Aplicando o modelo oficial da ${notice.lower}…` };
  render();
  try {
    const blob = await buildNotificationDocument((progress, message) => setGenerationProgress(progress, message));
    const suffix = n.number || n.date;
    const filename = `${notice.slug}${suffix ? `-${slugify(suffix)}` : ""}.docx`;
    await finishDownload(blob, filename, notice.label);
    n.complete = true;
    state.generation.running = false;
    render();
  } catch (error) {
    state.generation.running = false;
    render();
    showMessage({ title: `Não foi possível gerar a ${notice.lower}`, text: error.message, kind: "error" });
  }
}

async function generateCorrespondence() {
  if (!validateCurrentStep()) return;
  if (!window.docx) {
    showMessage({ title: "Gerador indisponível", text: "O componente de criação do Word não foi carregado. Atualize a página e tente novamente.", kind: "error" });
    return;
  }
  const type = correspondenceType();
  state.generation = {
    running: true,
    progress: 12,
    message: isOfficialCorrespondenceFlow()
      ? `Aplicando o modelo oficial d${type.article === "a" ? "a" : "o"} ${type.label.toLowerCase()}…`
      : `Montando ${type.article} ${type.label.toLowerCase()}…`,
  };
  render();
  try {
    const blob = isOfficialCorrespondenceFlow()
      ? await buildOfficialCorrespondenceDocument((progress, message) => setGenerationProgress(progress, message))
      : await buildCorrespondenceDocument((progress, message) => setGenerationProgress(progress, message));
    const suffix = state.correspondence.number || state.correspondence.date;
    const filename = `${slugify(type.label)}${suffix ? `-${slugify(suffix)}` : ""}.docx`;
    await finishDownload(blob, filename, type.label);
    state.correspondence.complete = true;
    state.generation.running = false;
    render();
  } catch (error) {
    state.generation.running = false;
    render();
    showMessage({ title: `Não foi possível gerar ${type.article} ${type.label.toLowerCase()}`, text: error.message, kind: "error" });
  }
}

async function finishDownload(blob, filename, documentType) {
  if (state.lastDownload?.url) URL.revokeObjectURL(state.lastDownload.url);
  const url = URL.createObjectURL(blob);
  state.lastDownload = { blob, filename, url, saved: false };
  triggerDownload(url, filename);
  setGenerationProgress(96, "Salvando uma cópia segura no histórico…");

  const form = new FormData();
  form.append("file", blob, filename);
  form.append("documentType", documentType);
  try {
    const payload = await apiRequest("/api/documents", { method: "POST", body: form });
    if (payload.document) {
      state.history.items = [payload.document, ...state.history.items.filter((item) => item.id !== payload.document.id)];
      state.history.loaded = true;
    }
    state.lastDownload.saved = true;
  } catch (error) {
    state.lastDownload.historyError = error.message;
  }
}

function triggerDownload(url, filename) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function triggerHistoryDownload(documentId) {
  if (!/^[0-9a-f-]{36}$/i.test(String(documentId || ""))) return;
  const anchor = document.createElement("a");
  anchor.href = `/api/documents/${encodeURIComponent(documentId)}/download`;
  anchor.download = "";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function historyDocument(documentId) {
  return state.history.items.find((item) => item.id === documentId) || null;
}

function setHistoryBusy(documentId, action) {
  if (action) state.history.busy.set(documentId, action);
  else state.history.busy.delete(documentId);
  if (state.history.open) render();
}

function historyFilenameStem(filename) {
  return String(filename || "documento").replace(/\.docx$/i, "").trim();
}

function historyPdfFilename(filename) {
  const stem = historyFilenameStem(filename) || "documento";
  return `${stem}.pdf`;
}

function setRenameFeedback(message = "") {
  elements.renameFeedback.textContent = message;
  elements.renameFeedback.classList.toggle("is-hidden", !message);
  elements.renameFeedback.classList.toggle("is-error", Boolean(message));
}

function openHistoryRename(documentId) {
  const document = historyDocument(documentId);
  if (!document) return;
  state.history.renameDocumentId = documentId;
  elements.renameInput.value = historyFilenameStem(document.filename);
  elements.renameInput.disabled = false;
  elements.renameSubmitButton.disabled = false;
  elements.renameSubmitButton.textContent = "Salvar nome";
  setRenameFeedback();
  openDialog(elements.renameDialog);
  requestAnimationFrame(() => {
    elements.renameInput.focus();
    elements.renameInput.select();
  });
}

function closeHistoryRename() {
  if (elements.renameSubmitButton.disabled) return;
  state.history.renameDocumentId = null;
  setRenameFeedback();
  closeDialog(elements.renameDialog);
}

async function submitHistoryRename() {
  const documentId = state.history.renameDocumentId;
  const document = historyDocument(documentId);
  const stem = elements.renameInput.value.replace(/\.docx$/i, "").trim();
  if (!document || !stem) {
    setRenameFeedback("Informe um nome para o arquivo.");
    elements.renameInput.focus();
    return;
  }

  elements.renameInput.disabled = true;
  elements.renameSubmitButton.disabled = true;
  elements.renameSubmitButton.textContent = "Salvando…";
  setRenameFeedback();
  try {
    const payload = await apiRequest(`/api/documents/${encodeURIComponent(documentId)}`, {
      method: "PATCH",
      body: { filename: `${stem}.docx` },
    });
    if (!payload.document) throw new Error("O servidor não retornou o documento renomeado.");
    state.history.items = state.history.items.map((item) => item.id === documentId ? payload.document : item);
    releaseHistoryPdf(documentId);
    state.history.renameDocumentId = null;
    closeDialog(elements.renameDialog);
    if (state.history.open) render();
    showToast("Arquivo renomeado.");
  } catch (error) {
    elements.renameInput.disabled = false;
    elements.renameSubmitButton.disabled = false;
    elements.renameSubmitButton.textContent = "Salvar nome";
    setRenameFeedback(error.message);
    elements.renameInput.focus();
  }
}

function confirmHistoryDelete(documentId) {
  const document = historyDocument(documentId);
  if (!document) return;
  showMessage({
    title: "Excluir este arquivo?",
    text: `${document.filename} será removido definitivamente do seu Histórico.`,
    kind: "error",
    actions: [
      { label: "Cancelar" },
      { label: "Excluir arquivo", primary: true, onClick: () => deleteHistoryDocument(documentId) },
    ],
  });
}

async function deleteHistoryDocument(documentId) {
  if (!historyDocument(documentId)) return;
  setHistoryBusy(documentId, "delete");
  try {
    await apiRequest(`/api/documents/${encodeURIComponent(documentId)}`, { method: "DELETE" });
    releaseHistoryPdf(documentId);
    state.history.items = state.history.items.filter((item) => item.id !== documentId);
    setHistoryBusy(documentId, "");
    showToast("Arquivo excluído do Histórico.");
  } catch (error) {
    setHistoryBusy(documentId, "");
    showMessage({ title: "Não foi possível excluir", text: error.message, kind: "error" });
  }
}

async function fetchHistoryDocument(documentId) {
  let response;
  try {
    response = await fetch(`/api/documents/${encodeURIComponent(documentId)}/download`, {
      headers: { Accept: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
    });
  } catch {
    throw new Error("Não foi possível acessar o arquivo. Verifique sua conexão.");
  }

  if (!response.ok) {
    let message = "Não foi possível abrir este documento.";
    try {
      const payload = await response.json();
      if (payload?.error?.message) message = payload.error.message;
    } catch {
      // A mensagem padrão evita expor detalhes inesperados da resposta.
    }
    throw new Error(message);
  }
  return response.blob();
}

function waitForRenderedImages(container) {
  return Promise.all(Array.from(container.querySelectorAll("img")).map((image) => {
    if (image.complete) return Promise.resolve();
    return new Promise((resolve) => {
      image.addEventListener("load", resolve, { once: true });
      image.addEventListener("error", resolve, { once: true });
    });
  }));
}

async function renderHistoryPdf(historyItem) {
  if (!window.docxPreview?.renderAsync || !window.html2canvas || !window.jspdf?.jsPDF) {
    throw new Error("O conversor de PDF não foi carregado. Atualize a página e tente novamente.");
  }

  const wordBlob = await fetchHistoryDocument(historyItem.id);
  const renderHost = documentNode("div", "pdf-render-host");
  renderHost.setAttribute("aria-hidden", "true");
  document.body.appendChild(renderHost);

  try {
    await window.docxPreview.renderAsync(wordBlob, renderHost, renderHost, {
      className: "history-docx",
      inWrapper: true,
      breakPages: true,
      ignoreWidth: false,
      ignoreHeight: false,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      renderEndnotes: true,
      useBase64URL: true,
    });
    await waitForRenderedImages(renderHost);
    if (document.fonts?.ready) await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    const pages = Array.from(renderHost.querySelectorAll("section.history-docx"));
    if (!pages.length) throw new Error("O documento não possui páginas que possam ser convertidas.");

    const { jsPDF } = window.jspdf;
    let pdf = null;
    for (const [index, page] of pages.entries()) {
      const canvas = await window.html2canvas(page, {
        backgroundColor: "#ffffff",
        logging: false,
        scale: Math.max(1.5, Math.min(2, window.devicePixelRatio || 1.5)),
        useCORS: false,
      });
      const orientation = canvas.width > canvas.height ? "landscape" : "portrait";
      if (!pdf) {
        pdf = new jsPDF({ orientation, unit: "pt", format: "a4", compress: true });
        pdf.setProperties({
          title: historyFilenameStem(historyItem.filename),
          subject: historyItem.documentType,
          creator: "Fiscal Bertioga",
        });
      } else {
        pdf.addPage("a4", orientation);
      }

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
      const width = canvas.width * ratio;
      const height = canvas.height * ratio;
      const x = (pageWidth - width) / 2;
      const y = (pageHeight - height) / 2;
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.94), "JPEG", x, y, width, height, undefined, "FAST");
      canvas.width = 1;
      canvas.height = 1;
      if (index < pages.length - 1) await new Promise((resolve) => setTimeout(resolve, 0));
    }

    return pdf.output("blob");
  } finally {
    renderHost.remove();
  }
}

function documentNode(tagName, className) {
  const node = document.createElement(tagName);
  node.className = className;
  return node;
}

async function ensureHistoryPdf(document) {
  const cached = state.history.pdfCache.get(document.id);
  if (cached?.blob) return cached.blob;
  if (cached?.promise) return cached.promise;

  const promise = renderHistoryPdf(document)
    .then((blob) => {
      state.history.pdfCache.set(document.id, { blob, url: null });
      return blob;
    })
    .catch((error) => {
      state.history.pdfCache.delete(document.id);
      throw error;
    });
  state.history.pdfCache.set(document.id, { promise, url: null });
  return promise;
}

function historyPdfUrl(documentId, blob) {
  const cached = state.history.pdfCache.get(documentId) || { blob, url: null };
  if (!cached.url) cached.url = URL.createObjectURL(blob);
  cached.blob = blob;
  delete cached.promise;
  state.history.pdfCache.set(documentId, cached);
  return cached.url;
}

function releaseHistoryPdf(documentId) {
  const cached = state.history.pdfCache.get(documentId);
  if (cached?.url) URL.revokeObjectURL(cached.url);
  state.history.pdfCache.delete(documentId);
}

function openPdfLoadingWindow(filename) {
  const preview = window.open("", "_blank");
  if (!preview) return null;
  preview.opener = null;
  preview.document.title = `Preparando ${historyPdfFilename(filename)}`;
  const style = preview.document.createElement("style");
  style.textContent = "body{display:grid;place-items:center;min-height:100vh;margin:0;background:#f4f6f3;color:#17211d;font:600 16px Arial,sans-serif}p{padding:24px;text-align:center}";
  const message = preview.document.createElement("p");
  message.textContent = "Preparando a versão em PDF…";
  preview.document.head.appendChild(style);
  preview.document.body.appendChild(message);
  return preview;
}

async function previewHistoryPdf(documentId) {
  const document = historyDocument(documentId);
  if (!document) return;
  const preview = openPdfLoadingWindow(document.filename);
  if (!preview) {
    showMessage({
      title: "A prévia foi bloqueada",
      text: "Permita a abertura de janelas para este site e tente visualizar novamente.",
      kind: "warning",
    });
    return;
  }

  setHistoryBusy(documentId, "preview");
  try {
    const blob = await ensureHistoryPdf(document);
    const url = historyPdfUrl(documentId, blob);
    if (!preview.closed) preview.location.replace(url);
  } catch (error) {
    if (!preview.closed) {
      preview.document.body.textContent = "Não foi possível preparar a prévia em PDF.";
    }
    showMessage({ title: "Não foi possível visualizar o PDF", text: error.message, kind: "error" });
  } finally {
    setHistoryBusy(documentId, "");
  }
}

async function downloadHistoryPdf(documentId) {
  const document = historyDocument(documentId);
  if (!document) return;
  setHistoryBusy(documentId, "pdf");
  try {
    const blob = await ensureHistoryPdf(document);
    triggerDownload(historyPdfUrl(documentId, blob), historyPdfFilename(document.filename));
    showToast("PDF preparado para download.");
  } catch (error) {
    showMessage({ title: "Não foi possível baixar o PDF", text: error.message, kind: "error" });
  } finally {
    setHistoryBusy(documentId, "");
  }
}

async function imageRunFor(file, maxWidth, maxHeight, altText = "Imagem") {
  const { ImageRun } = window.docx;
  const image = await loadImage(file);
  const ratio = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight, 1);
  const width = Math.max(1, Math.round(image.naturalWidth * ratio));
  const height = Math.max(1, Math.round(image.naturalHeight * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * Math.min(1, 2200 / Math.max(image.naturalWidth, image.naturalHeight))));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * Math.min(1, 2200 / Math.max(image.naturalWidth, image.naturalHeight))));
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(image.src);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  if (!blob) throw new Error(`Não foi possível preparar a imagem ${file.name}.`);
  const data = new Uint8Array(await blob.arrayBuffer());
  return new ImageRun({ type: "jpg", data, transformation: { width, height }, altText: { title: altText, description: altText, name: altText } });
}

function noBorders() {
  const { BorderStyle } = window.docx;
  const border = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  return { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border };
}

function defaultDocumentStyles() {
  return {
    default: {
      document: {
        run: { font: "Arial", size: 22, color: "17211D", language: { value: "pt-BR" } },
        paragraph: { spacing: { line: 276, after: 100 } },
      },
    },
    paragraphStyles: [
      { id: "DocTitle", name: "Título do documento", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Arial", size: 30, bold: true, color: "17211D" }, paragraph: { alignment: "center", spacing: { before: 120, after: 180 } } },
      { id: "SectionTitle", name: "Título de seção", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Arial", size: 24, bold: true, color: "1F6B50" }, paragraph: { spacing: { before: 220, after: 100 } } },
    ],
  };
}

function footer() {
  const { Footer, Paragraph, TextRun, AlignmentType, PageNumber } = window.docx;
  return new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Página ", size: 18, color: "6F7B76" }), new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "6F7B76" })] })] });
}

async function headerFor({ organization, department, logo }) {
  const { Header, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, VerticalAlign } = window.docx;
  const textChildren = [
    new TextRun({ text: organization || "DOCUMENTO TÉCNICO", bold: true, size: 19, color: "17211D" }),
    ...(department ? [new TextRun({ text: department, break: 1, size: 17, color: "6F7B76" })] : []),
  ];
  if (!logo) {
    return new Header({ children: [new Paragraph({ children: textChildren, spacing: { after: 120 } })] });
  }
  const logoRun = await imageRunFor(logo.file, 68, 50, "Logotipo institucional");
  return new Header({
    children: [new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: noBorders(),
      rows: [new TableRow({ children: [
        new TableCell({ width: { size: 18, type: WidthType.PERCENTAGE }, verticalAlign: VerticalAlign.CENTER, margins: { top: 0, bottom: 80, left: 0, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [logoRun] })] }),
        new TableCell({ width: { size: 82, type: WidthType.PERCENTAGE }, verticalAlign: VerticalAlign.CENTER, margins: { top: 0, bottom: 80, left: 0, right: 0 }, children: [new Paragraph({ children: textChildren })] }),
      ] })],
    })],
  });
}

function paragraphsFromText(text, options = {}) {
  const { Paragraph, TextRun, AlignmentType } = window.docx;
  return String(text || "")
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .filter((paragraph) => paragraph.trim())
    .map((paragraph) => new Paragraph({
      alignment: options.alignment || AlignmentType.JUSTIFIED,
      spacing: { after: options.after ?? 140, line: 300 },
      children: [new TextRun({ text: paragraph.replace(/\s*\n\s*/g, " ").trim(), size: options.size || 22 })],
    }));
}

function richTextAlignment(node, fallback) {
  const { AlignmentType } = window.docx;
  const value = String(node?.style?.textAlign || node?.getAttribute?.("align") || "").toLowerCase();
  return {
    left: AlignmentType.LEFT,
    center: AlignmentType.CENTER,
    right: AlignmentType.RIGHT,
    justify: AlignmentType.JUSTIFIED,
  }[value] || fallback;
}

function richTextRuns(nodes, inherited = {}, { official = false } = {}) {
  const { TextRun } = window.docx;
  const runs = [];
  Array.from(nodes || []).forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = String(node.nodeValue || "").replace(/\s+/g, " ");
      if (!text) return;
      runs.push(new TextRun({
        text,
        font: "Arial",
        size: inherited.size || (official ? 24 : 22),
        bold: Boolean(inherited.bold),
        italics: Boolean(inherited.italics),
        ...(inherited.underline ? { underline: {} } : {}),
        color: "000000",
      }));
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.tagName === "BR") {
      runs.push(new TextRun({ text: "", break: 1, font: "Arial", size: inherited.size || (official ? 24 : 22) }));
      return;
    }
    if (["UL", "OL", "TABLE"].includes(node.tagName)) return;
    richTextRuns(node.childNodes, {
      ...inherited,
      bold: inherited.bold || ["STRONG", "B", "H2", "H3", "TH"].includes(node.tagName),
      italics: inherited.italics || ["EM", "I"].includes(node.tagName),
      underline: inherited.underline || node.tagName === "U",
    }, { official }).forEach((run) => runs.push(run));
  });
  return runs;
}

function richTextParagraph(node, { official = false, listPrefix = "", listLast = false } = {}) {
  const { Paragraph, TextRun, AlignmentType } = window.docx;
  const isHeading = ["H2", "H3"].includes(node?.tagName);
  const size = node?.tagName === "H2" ? 28 : node?.tagName === "H3" ? 26 : (official ? 24 : 22);
  const contentNodes = node?.nodeType === Node.TEXT_NODE
    ? [node]
    : Array.from(node?.childNodes || []).filter((child) => !["UL", "OL"].includes(child.tagName));
  const children = richTextRuns(contentNodes, { bold: isHeading, size }, { official });
  if (listPrefix) children.unshift(new TextRun({ text: listPrefix, font: "Arial", size, bold: false, color: "000000" }));
  if (!children.length) children.push(new TextRun({ text: "", font: "Arial", size }));
  const defaultAlignment = isHeading ? AlignmentType.LEFT : AlignmentType.JUSTIFIED;
  return new Paragraph({
    alignment: richTextAlignment(node, defaultAlignment),
    ...(official && !isHeading && !listPrefix ? { indent: { firstLine: 1134 } } : {}),
    ...(listPrefix ? { indent: { left: 540, hanging: 320 } } : {}),
    keepNext: isHeading,
    spacing: {
      before: isHeading ? 180 : 0,
      after: listPrefix && !listLast ? 60 : (official ? 360 : 300),
      line: official ? 360 : 300,
    },
    children,
  });
}

function richTextTable(node, { official = false } = {}) {
  const { Table, TableRow, TableCell, Paragraph, TextRun, WidthType, BorderStyle, VerticalAlign } = window.docx;
  const htmlRows = Array.from(node.rows || []);
  const columnCount = Math.max(1, ...htmlRows.map((row) => row.cells.length));
  const border = { style: BorderStyle.SINGLE, size: 5, color: "9EA9A3" };
  const borders = { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border };
  const rows = htmlRows.map((row) => new TableRow({
    cantSplit: true,
    children: Array.from(row.cells).map((cell) => {
      const cellRuns = richTextRuns(cell.childNodes, { bold: cell.tagName === "TH" }, { official });
      return new TableCell({
        width: { size: 100 / columnCount, type: WidthType.PERCENTAGE },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 90, bottom: 90, left: 100, right: 100 },
        children: [new Paragraph({
          alignment: richTextAlignment(cell, window.docx.AlignmentType.LEFT),
          spacing: { after: 0, line: official ? 300 : 276 },
          children: cellRuns.length ? cellRuns : [new TextRun({ text: "", font: "Arial", size: official ? 24 : 22 })],
        })],
      });
    }),
  }));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders, rows });
}

function richCorrespondenceDocumentBlocks(html, fallbackText, { official = false } = {}) {
  if (!html) return official ? officialCorrespondenceBodyParagraphs(fallbackText) : paragraphsFromText(fallbackText);
  const parser = new DOMParser();
  const parsed = parser.parseFromString(`<body>${sanitizeRichTextHtml(html)}</body>`, "text/html");
  const blocks = [];
  Array.from(parsed.body.childNodes).forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.nodeValue?.trim()) blocks.push(richTextParagraph(node, { official }));
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.tagName === "TABLE") {
      if (node.rows.length) blocks.push(richTextTable(node, { official }));
      return;
    }
    if (["UL", "OL"].includes(node.tagName)) {
      const items = Array.from(node.children).filter((child) => child.tagName === "LI");
      items.forEach((item, index) => blocks.push(richTextParagraph(item, {
        official,
        listPrefix: node.tagName === "OL" ? `${index + 1}. ` : "• ",
        listLast: index === items.length - 1,
      })));
      return;
    }
    blocks.push(richTextParagraph(node, { official }));
  });
  return blocks.length
    ? blocks
    : (official ? officialCorrespondenceBodyParagraphs(fallbackText) : paragraphsFromText(fallbackText));
}

async function buildReportDocument(onProgress) {
  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType,
    AlignmentType, VerticalAlign, HeightRule, PageBreak, Header,
  } = window.docx;
  const r = state.report;
  const children = [];
  children.push(new Paragraph({ style: "DocTitle", children: [new TextRun(r.title)] }));
  children.push(new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 220 }, children: [new TextRun({ text: `Data do relatório: ${formatDate(r.date)}`, size: 20, color: "405049" })] }));
  children.push(new Paragraph({ style: "SectionTitle", children: [new TextRun("Introdução")] }));
  children.push(...paragraphsFromText(r.introduction));

  if (r.introImage) {
    onProgress(16, "Preparando a imagem de abertura…");
    const introRun = await imageRunFor(r.introImage.file, 610, 480, "Imagem de abertura do relatório");
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 180 }, children: [introRun] }));
  }

  let photoNumber = 0;
  for (let index = 0; index < r.topics.length; index += 1) {
    const topic = r.topics[index];
    children.push(new Paragraph({ style: "SectionTitle", children: [new TextRun(topic.title)] }));
    children.push(...paragraphsFromText(topic.text));
    if (topic.image) {
      photoNumber += 1;
      onProgress(18 + Math.round(((index + 1) / Math.max(1, r.topics.length)) * 12), `Preparando a imagem do tópico ${index + 1}…`);
      const run = await imageRunFor(topic.image.file, 610, 430, `Foto ${photoNumber}`);
      children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 40 }, children: [run] }));
      children.push(captionParagraph(photoNumber, topic.caption));
    }
  }

  if (r.responsibles.length) {
    children.push(new Paragraph({ style: "SectionTitle", children: [new TextRun("Responsáveis")] }));
    const cells = r.responsibles.map((signature) => new TableCell({
      width: { size: 50, type: WidthType.PERCENTAGE },
      margins: { top: 520, bottom: 80, left: 120, right: 120 },
      verticalAlign: VerticalAlign.BOTTOM,
      borders: noBorders(),
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, border: { top: { style: "single", size: 6, color: "68756F" } }, spacing: { before: 80, after: 20 }, children: [new TextRun({ text: signature.name, bold: true, size: 19 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: signature.role, bold: false, italics: true, size: 19, color: "405049" })] }),
      ],
    }));
    const rows = [];
    for (let index = 0; index < cells.length; index += 2) {
      const pair = cells.slice(index, index + 2);
      if (pair.length === 1) pair.push(new TableCell({ borders: noBorders(), children: [new Paragraph("")] }));
      rows.push(new TableRow({ cantSplit: true, children: pair }));
    }
    children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: noBorders(), rows }));
  }

  if (r.photos.length && r.startPhotosNewPage) children.push(new Paragraph({ children: [new PageBreak()] }));
  if (r.photos.length) children.push(new Paragraph({ style: "SectionTitle", children: [new TextRun("Registro fotográfico")] }));

  const perPage = r.onePerPage ? 1 : 2;
  const groups = [];
  for (let index = 0; index < r.photos.length; index += perPage) groups.push(r.photos.slice(index, index + perPage));
  for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
    const rows = [];
    for (const photo of groups[groupIndex]) {
      photoNumber += 1;
      const completed = groupIndex * perPage + rows.length + 1;
      onProgress(32 + Math.round((completed / r.photos.length) * 58), `Inserindo fotografia ${completed} de ${r.photos.length}…`);
      const run = await imageRunFor(photo.file, 610, r.onePerPage ? 650 : 300, `Foto ${photoNumber}`);
      rows.push(new TableRow({
        cantSplit: true,
        height: { value: r.onePerPage ? 10400 : 5150, rule: HeightRule.ATLEAST },
        children: [new TableCell({
          width: { size: 100, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 80, bottom: 80, left: 80, right: 80 },
          borders: noBorders(),
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [run] }),
            captionParagraph(photoNumber, photo.description),
          ],
        })],
      }));
    }
    children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: noBorders(), rows }));
    if (groupIndex < groups.length - 1) children.push(new Paragraph({ children: [new PageBreak()] }));
  }

  onProgress(93, "Finalizando cabeçalho e paginação…");
  const header = await headerFor(r);
  const documentFile = new Document({
    creator: "Fiscal Bertioga",
    title: r.title,
    description: "Relatório fotográfico gerado no Fiscal Bertioga",
    styles: defaultDocumentStyles(),
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, right: 1134, bottom: 1134, left: 1134, header: 500, footer: 500 }, pageNumbers: { start: 1 } } },
      headers: { default: header instanceof Header ? header : new Header({ children: [] }) },
      footers: { default: footer() },
      children,
    }],
  });
  onProgress(97, "Compactando o arquivo Word…");
  const blob = await Packer.toBlob(documentFile);
  onProgress(100, "Relatório concluído.");
  return blob;
}

function captionParagraph(number, description) {
  const { Paragraph, TextRun, AlignmentType } = window.docx;
  const prefix = `Foto ${String(number).padStart(2, "0")}`;
  const text = String(description || "").trim();
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 20, after: 90, line: 240 },
    children: [
      new TextRun({ text: text ? `${prefix} – ` : prefix, bold: true, size: 19 }),
      ...(text ? [new TextRun({ text, size: 19 })] : []),
    ],
  });
}

async function buildCotaDocument(onProgress) {
  const { patchDocument, PatchType, Paragraph, TextRun, AlignmentType, LineRuleType } = window.docx;
  const c = state.cota;
  const bodyLines = cotaTextLayout(c.finalText);
  if (bodyLines.length > MAX_COTA_LINES) throw new Error(`O texto ocupa ${bodyLines.length} linhas; o limite é ${MAX_COTA_LINES}.`);
  if (!c.signer.trim() || !c.signerRole.trim()) throw new Error("Selecione a pessoa que assinará a folha de cota.");
  if (typeof patchDocument !== "function" || !PatchType) {
    throw new Error("O componente de preenchimento do modelo Word não está disponível.");
  }

  onProgress(24, "Carregando o modelo timbrado padrão…");
  const template = await loadCotaTemplate();
  const sheetNumber = String(c.sheetNumber || "").trim();
  const processNumber = String(c.processNumber || "").trim();
  const processYear = String(c.year || "").trim();
  const patches = {
    sheet_number: {
      type: PatchType.PARAGRAPH,
      children: [new TextRun({ text: sheetNumber || "________", ...COTA_HEADER_FIELD_STYLE })],
    },
    process_number: {
      type: PatchType.PARAGRAPH,
      children: [new TextRun({ text: processNumber || "______________", ...COTA_HEADER_FIELD_STYLE })],
    },
    process_year: {
      type: PatchType.PARAGRAPH,
      children: [new TextRun({ text: processYear || "______", ...COTA_HEADER_FIELD_STYLE })],
    },
  };
  const lineLayout = [
    ...bodyLines,
    ...Array.from({ length: COTA_SIGNATURE_GAP_LINES }, () => ({ text: "", justify: false, kind: "signature-gap" })),
    { text: "________________________________", justify: false, kind: "signature-rule" },
    { text: c.signer.trim(), justify: false, kind: "signature-name" },
    { text: c.signerRole.trim(), justify: false, kind: "signature-role" },
  ];
  for (let index = 0; index < COTA_TOTAL_LINES; index += 1) {
    const line = lineLayout[index] || { text: "", justify: false, kind: "empty" };
    const isSignature = line.kind.startsWith("signature-");
    const alignment = isSignature ? AlignmentType.CENTER : AlignmentType.LEFT;
    const lineText = line.justify ? justifyCotaLine(line.text) : line.text;
    patches[`line_${String(index + 1).padStart(2, "0")}`] = {
      type: PatchType.DOCUMENT,
      children: [new Paragraph({
        alignment,
        snapToGrid: false,
        spacing: { before: 0, after: 0, line: 360, lineRule: LineRuleType.EXACT },
        children: lineText ? [new TextRun({
          text: lineText,
          ...COTA_TEXT_STYLE,
          bold: line.kind === "signature-name",
          italics: line.kind === "signature-role",
        })] : [],
      })],
    };
  }

  onProgress(70, "Aplicando justificação, espaçamento e assinatura…");
  const blob = await patchDocument({
    outputType: "blob",
    data: template,
    patches,
    keepOriginalStyles: true,
    recursive: false,
  });
  onProgress(100, "Folha de cota concluída.");
  return blob;
}

async function loadCotaTemplate() {
  if (!cotaTemplatePromise) {
    cotaTemplatePromise = (async () => {
      const bridge = window.pywebview?.api;
      if (bridge?.get_cota_template) {
        const result = await bridge.get_cota_template();
        if (!result?.ok || !result.base64) {
          throw new Error(result?.error || "O modelo timbrado padrão não foi encontrado.");
        }
        const binary = atob(result.base64);
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
        return bytes.buffer;
      }

      const response = await fetch(COTA_TEMPLATE_URL);
      if (!response.ok) throw new Error("O modelo timbrado padrão não pôde ser carregado.");
      return response.arrayBuffer();
    })().catch((error) => {
      cotaTemplatePromise = null;
      throw error;
    });
  }
  const template = await cotaTemplatePromise;
  return template.slice(0);
}

async function loadOfficialCorrespondenceTemplate() {
  if (!officialCorrespondenceTemplatePromise) {
    officialCorrespondenceTemplatePromise = fetch(OFFICIAL_CORRESPONDENCE_TEMPLATE_URL)
      .then((response) => {
        if (!response.ok) throw new Error("O modelo oficial do documento não pôde ser carregado.");
        return response.arrayBuffer();
      })
      .catch((error) => {
        officialCorrespondenceTemplatePromise = null;
        throw error;
      });
  }
  const data = await officialCorrespondenceTemplatePromise;
  return data.slice(0);
}

async function loadNotificationTemplate() {
  if (!notificationTemplatePromise) {
    notificationTemplatePromise = fetch(NOTIFICATION_TEMPLATE_URL)
      .then((response) => {
        if (!response.ok) throw new Error("O modelo oficial da notificação não pôde ser carregado.");
        return response.arrayBuffer();
      })
      .catch((error) => {
        notificationTemplatePromise = null;
        throw error;
      });
  }
  const data = await notificationTemplatePromise;
  return data.slice(0);
}

function notificationBodyParagraphs(text) {
  const { Paragraph, TextRun, AlignmentType } = window.docx;
  return String(text || "")
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .filter((paragraph) => paragraph.trim())
    .map((paragraph) => new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 100, after: 100, line: 240 },
      children: [new TextRun({ text: paragraph.replace(/\s*\n\s*/g, " ").trim(), font: "Arial", size: 24, color: "222222" })],
    }));
}

function notificationMetadataParagraph(label, value, options = {}) {
  const { Paragraph, TextRun, AlignmentType } = window.docx;
  return new Paragraph({
    alignment: options.justified ? AlignmentType.JUSTIFIED : AlignmentType.LEFT,
    spacing: { after: options.after ?? 0, line: 240 },
    children: [
      new TextRun({ text: `${label}: `, font: "Arial", size: 24, bold: true, color: "222222" }),
      new TextRun({ text: String(value || "").trim(), font: "Arial", size: 24, color: "222222" }),
    ],
  });
}

function notificationSignatureTable(signatories) {
  const {
    Paragraph, TextRun, Table, TableRow, TableCell, WidthType, VerticalAlign,
  } = window.docx;
  const rows = [];
  for (let index = 0; index < signatories.length; index += 2) {
    const pair = signatories.slice(index, index + 2);
    const cells = pair.map((signatory) => new TableCell({
      width: { size: 50, type: WidthType.PERCENTAGE },
      borders: noBorders(),
      verticalAlign: VerticalAlign.TOP,
      margins: { top: 240, bottom: 180, left: 0, right: 120 },
      children: [
        new Paragraph({ spacing: { after: 0, line: 240 }, children: [new TextRun({ text: signatory.name.trim(), font: "Arial", size: 24, bold: true, color: "222222" })] }),
        new Paragraph({ spacing: { after: 0, line: 240 }, children: [new TextRun({ text: signatory.role.trim(), font: "Arial", size: 24, bold: false, italics: true, color: "222222" })] }),
      ],
    }));
    if (cells.length === 1) {
      cells.push(new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders: noBorders(), children: [new Paragraph("")] }));
    }
    rows.push(new TableRow({ cantSplit: true, children: cells }));
  }
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: noBorders(), rows });
}

async function buildNotificationDocument(onProgress) {
  const {
    Paragraph, TextRun, AlignmentType, PageBreak, patchDocument, PatchType,
  } = window.docx;
  const n = noticeState();
  const notice = noticeCopy();
  if (typeof patchDocument !== "function" || !PatchType) {
    throw new Error("O componente de preenchimento do modelo Word não está disponível.");
  }
  onProgress(18, "Carregando o modelo oficial da Prefeitura…");
  const template = await loadNotificationTemplate();

  const children = [
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 160, line: 240 },
      children: [new TextRun({ text: `${n.city.trim()}, ${formatDateLong(n.date)}.`, font: "Arial", size: 24, bold: true, color: "222222" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 220, line: 240 },
      children: [new TextRun({ text: `${n.number.trim()} ${notice.title}`, font: "Arial", size: 24, bold: true, color: "222222" })],
    }),
    notificationMetadataParagraph("Processo", n.process),
    notificationMetadataParagraph("Obra", n.work, { justified: true, after: 160 }),
    notificationMetadataParagraph("Contratada", n.contractor, { justified: true, after: 160 }),
  ];

  onProgress(38, `Formatando o texto da ${notice.lower} em Arial 12…`);
  children.push(...notificationBodyParagraphs(n.finalText));
  children.push(new Paragraph({ spacing: { before: 180, after: 0 }, children: [] }));
  children.push(notificationSignatureTable(n.signatories));

  for (let index = 0; index < n.photos.length; index += 1) {
    const photo = n.photos[index];
    onProgress(50 + Math.round(((index + 1) / n.photos.length) * 40), `Inserindo imagem ${index + 1} de ${n.photos.length}…`);
    const run = await imageRunFor(photo.file, 500, 570, `Imagem ${String(index + 1).padStart(2, "0")}`);
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, spacing: { before: 80, after: 120 }, children: [run] }));
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 0, line: 240 },
      children: [new TextRun({ text: `Imagem ${String(index + 1).padStart(2, "0")} - ${photo.caption.trim()}`, font: "Arial", size: 24, bold: true, color: "222222" })],
    }));
  }

  onProgress(94, "Preenchendo o modelo sem alterar o cabeçalho…");
  const blob = await patchDocument({
    outputType: "blob",
    data: template,
    patches: {
      notification_content: {
        type: PatchType.DOCUMENT,
        children,
      },
    },
    keepOriginalStyles: true,
    recursive: false,
  });
  onProgress(100, `${notice.label} concluída.`);
  return blob;
}

function formatOfficialCorrespondenceRecipient(value) {
  const type = correspondenceType();
  const recipient = String(value || "").trim().replace(/^(?:ao|à|a)\s+/iu, "");
  return `${type.recipientPrefix} ${recipient}`;
}

function officialCorrespondenceRun(text, bold = false, italics = false) {
  const { TextRun } = window.docx;
  return new TextRun({ text: String(text || ""), font: "Arial", size: 24, bold, italics, color: "000000" });
}

function officialCorrespondenceBlankParagraph() {
  const { Paragraph } = window.docx;
  return new Paragraph({ children: [officialCorrespondenceRun("")] });
}

function officialCorrespondencePhotoSpacerParagraph() {
  const { Paragraph } = window.docx;
  return new Paragraph({ spacing: { after: 1500 }, children: [officialCorrespondenceRun("\u00A0")] });
}

function officialCorrespondenceBodyParagraphs(text) {
  const { Paragraph, AlignmentType } = window.docx;
  return String(text || "")
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .filter((paragraph) => paragraph.trim())
    .map((paragraph) => new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: 1134 },
      spacing: { before: 0, after: 360, line: 360 },
      children: [officialCorrespondenceRun(paragraph.replace(/\s*\n\s*/g, " ").trim())],
    }));
}

function correspondenceSignatureTable(signatories, { official = false } = {}) {
  const {
    Paragraph, TextRun, Table, TableRow, TableCell, WidthType, VerticalAlign, AlignmentType,
  } = window.docx;
  const rows = [];
  for (let index = 0; index < signatories.length; index += 2) {
    const pair = signatories.slice(index, index + 2);
    const cells = pair.map((signatory) => {
      const isSingle = pair.length === 1;
      const children = [];
      if (!official) {
        children.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 70 },
          children: [new TextRun({ text: "________________________________", color: "68756F", size: 20 })],
        }));
      }
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: official ? 0 : 20, line: 240 },
          children: [official
            ? officialCorrespondenceRun(signatory.name.trim(), true)
            : new TextRun({ text: signatory.name.trim(), bold: true, size: 21 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 0, line: 240 },
          children: [official
            ? officialCorrespondenceRun(signatory.role.trim(), false, true)
            : new TextRun({ text: signatory.role.trim(), bold: false, italics: true, size: 20, color: "405049" })],
        }),
      );
      return new TableCell({
        width: { size: isSingle ? 100 : 50, type: WidthType.PERCENTAGE },
        ...(isSingle ? { columnSpan: 2 } : {}),
        borders: noBorders(),
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 120, bottom: 240, left: 120, right: 120 },
        children,
      });
    });
    rows.push(new TableRow({ cantSplit: true, children: cells }));
  }
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: noBorders(), rows });
}

async function buildOfficialCorrespondenceDocument(onProgress) {
  const { Paragraph, AlignmentType, PageBreak, patchDocument, PatchType } = window.docx;
  const c = state.correspondence;
  const type = correspondenceType();
  const typeLower = type.label.toLowerCase();
  if (typeof patchDocument !== "function" || !PatchType) {
    throw new Error("O componente de preenchimento do modelo Word não está disponível.");
  }

  onProgress(18, `Carregando o modelo oficial d${type.article === "a" ? "a" : "o"} ${typeLower}…`);
  const template = await loadOfficialCorrespondenceTemplate();
  const children = [
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [officialCorrespondenceRun(`${c.place.trim()}, ${formatDateLong(c.date)}.`, true)],
    }),
    officialCorrespondenceBlankParagraph(),
    officialCorrespondenceBlankParagraph(),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      children: [officialCorrespondenceRun(`${type.label} nº ${c.number.trim()}`, true)],
    }),
    officialCorrespondenceBlankParagraph(),
    officialCorrespondenceBlankParagraph(),
    officialCorrespondenceBlankParagraph(),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      children: [officialCorrespondenceRun(formatOfficialCorrespondenceRecipient(c.recipient), true)],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      children: [officialCorrespondenceRun(c.salutation.trim(), true)],
    }),
    officialCorrespondenceBlankParagraph(),
    officialCorrespondenceBlankParagraph(),
    officialCorrespondenceBlankParagraph(),
  ];

  onProgress(45, "Formatando o texto em Arial 12 e espaçamento de 1,5 linha…");
  children.push(...richCorrespondenceDocumentBlocks(c.finalHtml, c.finalText, { official: true }));
  children.push(officialCorrespondenceBlankParagraph());
  children.push(correspondenceSignatureTable(c.signatories, { official: true }));

  for (let index = 0; index < c.photos.length; index += 1) {
    const photo = c.photos[index];
    onProgress(55 + Math.round(((index + 1) / c.photos.length) * 35), `Inserindo imagem ${index + 1} de ${c.photos.length}…`);
    const run = await imageRunFor(photo.file, 500, 570, `Imagem ${String(index + 1).padStart(2, "0")}`);
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(officialCorrespondencePhotoSpacerParagraph());
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      keepNext: true,
      spacing: { before: 80, after: 120 },
      children: [run],
    }));
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 0, line: 240 },
      children: [officialCorrespondenceRun(`Imagem ${String(index + 1).padStart(2, "0")} - ${photo.caption.trim()}`, true)],
    }));
  }

  onProgress(92, "Preenchendo o modelo sem alterar o cabeçalho e a paginação…");
  const blob = await patchDocument({
    outputType: "blob",
    data: template,
    patches: {
      memorandum_content: {
        type: PatchType.DOCUMENT,
        children,
      },
    },
    keepOriginalStyles: true,
    recursive: false,
  });
  onProgress(100, `${type.label} ${type.completed}.`);
  return blob;
}

async function buildCorrespondenceDocument(onProgress) {
  const {
    Document, Packer, Paragraph, TextRun, AlignmentType,
  } = window.docx;
  const c = state.correspondence;
  const type = correspondenceType();
  onProgress(28, "Organizando os dados do documento…");

  const documentNumber = c.number.trim() ? ` nº ${c.number.trim()}` : "";
  const placeAndDate = [c.place.trim(), formatDate(c.date)].filter(Boolean).join(", ");
  const recipientLine = `${type.recipientPrefix}: ${c.recipient.trim()}`;
  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 260 },
      children: [new TextRun({ text: `${type.label.toUpperCase()}${documentNumber}`, bold: true, size: 28 })],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 260 },
      children: [new TextRun({ text: placeAndDate, size: 21 })],
    }),
    new Paragraph({ spacing: { after: 70 }, children: [new TextRun({ text: recipientLine, bold: true, size: 21 })] }),
  ];

  if (c.recipientRole.trim()) {
    children.push(new Paragraph({ spacing: { after: 180 }, children: [new TextRun({ text: c.recipientRole.trim(), size: 21, color: "405049" })] }));
  }

  children.push(new Paragraph({
    spacing: { before: 120, after: 220 },
    children: [
      new TextRun({ text: "Assunto: ", bold: true, size: 21 }),
      new TextRun({ text: c.subject.trim(), size: 21 }),
    ],
  }));

  onProgress(55, "Formatando o conteúdo…");
  children.push(...richCorrespondenceDocumentBlocks(c.finalHtml, c.finalText));
  children.push(new Paragraph({ spacing: { before: 420, after: 0 }, children: [] }));
  children.push(correspondenceSignatureTable(c.signatories));

  onProgress(82, "Aplicando cabeçalho e paginação…");
  const header = await headerFor({ organization: c.organization, department: c.department, logo: null });
  const documentFile = new Document({
    creator: "Fiscal Bertioga",
    title: `${type.label}${documentNumber}`,
    description: `${type.label} gerado no Fiscal Bertioga`,
    styles: defaultDocumentStyles(),
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, right: 1134, bottom: 1134, left: 1134, header: 500, footer: 500 }, pageNumbers: { start: 1 } } },
      headers: { default: header },
      footers: { default: footer() },
      children,
    }],
  });
  onProgress(96, "Compactando o arquivo Word…");
  const blob = await Packer.toBlob(documentFile);
  onProgress(100, `${type.label} ${type.completed}.`);
  return blob;
}

function resetCurrentDocument() {
  if (state.flow === "report") {
    state.report.photos.forEach((photo) => URL.revokeObjectURL(photo.url));
    if (state.report.logo?.url) URL.revokeObjectURL(state.report.logo.url);
    if (state.report.introImage?.url) URL.revokeObjectURL(state.report.introImage.url);
    state.report.topics.forEach((topic) => topic.image?.url && URL.revokeObjectURL(topic.image.url));
    state.report = createReportState(readStorage("docflow-preferences", {}));
  } else if (state.flow === "cota") {
    if (state.cota.contextImage?.url) URL.revokeObjectURL(state.cota.contextImage.url);
    state.cota = createCotaState(readStorage("docflow-preferences", {}));
  } else if (isNoticeFlow()) {
    const flow = state.flow;
    noticeState().photos.forEach((photo) => URL.revokeObjectURL(photo.url));
    state[flow] = createNotificationState(readStorage("docflow-preferences", {}), flow);
  } else {
    const kind = state.correspondence.kind;
    state.correspondence.photos.forEach((photo) => URL.revokeObjectURL(photo.url));
    state.correspondence = createCorrespondenceState(readStorage("docflow-preferences", {}));
    state.correspondence.kind = kind;
  }
  state.step = 0;
  state.generation = { running: false, progress: 0, message: "" };
  render();
  focusMain();
}

async function handleAction(action, target) {
  if (state.messageCallbacks.has(action)) {
    const callback = state.messageCallbacks.get(action);
    closeDialog(elements.messageDialog);
    if (callback) await callback();
    return;
  }
  if (action === "home") return goHome();
  if (action === "show-admin") return showAdminPanel();
  if (action === "refresh-admin") return loadAdminUsers();
  if (action === "approve-admin-user") return setAdminUserStatus(target.dataset.id, "approved");
  if (action === "reject-admin-user") return confirmAdminUserRejection(target.dataset.id);
  if (action === "delete-admin-user") return confirmAdminUserDeletion(target.dataset.id);
  if (action === "show-history") return showDocumentHistory();
  if (action === "show-kanban") return showKanban();
  if (action === "refresh-kanban") return loadKanban();
  if (action === "add-kanban-card") return openKanbanCardDialog();
  if (action === "edit-kanban-card") return openKanbanCardDialog(target.dataset.id);
  if (action === "delete-kanban-card") return confirmKanbanCardDeletion(target.dataset.id);
  if (action === "close-kanban-card") return closeKanbanCardDialog();
  if (action === "toggle-notifications") return toggleNotificationPopover();
  if (action === "close-notifications") return closeNotificationPopover();
  if (action === "open-kanban-notification") return openKanbanNotification(target.dataset.id, target.dataset.cardId);
  if (action === "read-all-notifications") return markAllNotificationsRead();
  if (action === "refresh-history") return loadDocumentHistory();
  if (action === "download-history") return triggerHistoryDownload(target.dataset.id);
  if (action === "preview-history-pdf") return previewHistoryPdf(target.dataset.id);
  if (action === "download-history-pdf") return downloadHistoryPdf(target.dataset.id);
  if (action === "rename-history") return openHistoryRename(target.dataset.id);
  if (action === "close-rename") return closeHistoryRename();
  if (action === "delete-history") return confirmHistoryDelete(target.dataset.id);
  if (action === "logout") return logout();
  if (action === "start-report") return startFlow("report");
  if (action === "start-cota") return startFlow("cota");
  if (action === "start-notification") return startFlow("notification");
  if (action === "start-warning") return startFlow("warning");
  if (action === "start-correspondence") return startFlow("correspondence", target.dataset.kind);
  if (action === "previous-step") return previousStep();
  if (action === "next-step") return nextStep();
  if (action === "go-step") {
    const next = Number(target.dataset.step);
    if (next <= state.step) {
      state.step = next;
      render();
      focusMain();
    }
    return;
  }
  if (action === "open-api") return openApiConfiguration();
  if (action === "close-api") return closeDialog(elements.apiDialog);
  if (action === "open-signatures") return openSignatureConfiguration();
  if (action === "close-signatures") return closeSignatureConfiguration();
  if (action === "reload-signatures") return loadSignatureProfiles();
  if (action === "edit-signature-profile") return editSignatureProfile(target.dataset.id);
  if (action === "cancel-signature-edit") return resetSignatureProfileForm();
  if (action === "delete-signature-profile") return confirmSignatureProfileDelete(target.dataset.id);
  if (action === "remove-report-signature") {
    state.report.responsibles.splice(Number(target.dataset.index), 1);
    render();
    return;
  }
  if (action === "remove-correspondence-signature") {
    state.correspondence.signatories.splice(Number(target.dataset.index), 1);
    render();
    return;
  }
  if (action === "toggle-key") {
    const visible = elements.apiKeyInput.type === "text";
    elements.apiKeyInput.type = visible ? "password" : "text";
    target.textContent = visible ? "Mostrar" : "Ocultar";
    return;
  }
  if (action === "test-api") return testApiConfiguration();
  if (action === "remove-api") return removeApiConfiguration();
  if (action === "remove-file") return removeFile(target.dataset.kind, target.dataset.id);
  if (action === "remove-photo") return removePhoto(target.dataset.id);
  if (action === "remove-notification-photo") return removeNotificationPhoto(target.dataset.id);
  if (action === "remove-correspondence-photo") return removeCorrespondencePhoto(target.dataset.id);
  if (action === "analyze-photo") return analyzePhoto(target.dataset.id);
  if (action === "analyze-all") return analyzeAllPhotos();
  if (action === "add-topic") {
    state.report.topics.push({ id: makeId("topic"), title: "", text: "", caption: "", image: null });
    render();
    return;
  }
  if (action === "remove-topic") {
    const topic = state.report.topics.find((item) => item.id === target.dataset.id);
    if (topic?.image?.url) URL.revokeObjectURL(topic.image.url);
    state.report.topics = state.report.topics.filter((item) => item.id !== target.dataset.id);
    render();
    return;
  }
  if (action === "add-notification-signer") {
    noticeState().signatories.push({ id: makeId(`${state.flow}-signer`), profileId: "", name: "", role: "" });
    render();
    return;
  }
  if (action === "remove-notification-signer") {
    const notice = noticeState();
    notice.signatories = notice.signatories.filter((item) => item.id !== target.dataset.id);
    if (!notice.signatories.length) {
      notice.signatories.push({ id: makeId(`${state.flow}-signer`), profileId: "", name: "", role: "" });
    }
    render();
    return;
  }
  if (action === "improve-cota") return improveCota();
  if (action === "improve-correspondence") return improveCorrespondence();
  if (action === "download-again" && state.lastDownload) return triggerDownload(state.lastDownload.url, state.lastDownload.filename);
  if (action === "new-document") return resetCurrentDocument();
}

document.addEventListener("click", (event) => {
  if (state.kanban.notificationsOpen && !event.target.closest(".notification-center")) {
    closeNotificationPopover();
  }
  const richTextControl = event.target.closest("[data-rich-command]");
  if (richTextControl) {
    event.preventDefault();
    runRichTextCommand(richTextControl);
    return;
  }
  const authTarget = event.target.closest("[data-auth-view]");
  if (authTarget) {
    event.preventDefault();
    showAuthView(authTarget.dataset.authView);
    return;
  }
  const target = event.target.closest("[data-action]");
  if (!target) return;
  event.preventDefault();
  handleAction(target.dataset.action, target);
});

document.addEventListener("pointerdown", (event) => {
  if (event.target.closest("[data-rich-command]")) event.preventDefault();
});

document.addEventListener("selectionchange", () => {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return;
  const anchor = selection.anchorNode?.nodeType === Node.ELEMENT_NODE
    ? selection.anchorNode
    : selection.anchorNode?.parentElement;
  const editor = anchor?.closest?.("[data-rich-editor]");
  if (editor) richTextSelection = { editor, range: selection.getRangeAt(0).cloneRange() };
});

document.addEventListener("beforeinput", (event) => {
  const editor = event.target.closest?.("[data-rich-editor]");
  if (!editor || !event.inputType?.startsWith("insert") || event.inputType === "insertFromPaste") return;
  const selectionLength = window.getSelection()?.toString().length || 0;
  const addedLength = String(event.data || "").length;
  if (plainTextFromRichEditor(editor).length - selectionLength + addedLength > MAX_CORRESPONDENCE_TEXT) {
    event.preventDefault();
    showToast(`O conteúdo pode ter no máximo ${MAX_CORRESPONDENCE_TEXT} caracteres.`);
  }
});

document.addEventListener("paste", (event) => {
  const editor = event.target.closest?.("[data-rich-editor]");
  if (!editor) return;
  event.preventDefault();
  const clipboard = event.clipboardData;
  const selectedLength = window.getSelection()?.toString().length || 0;
  const remaining = Math.max(0, MAX_CORRESPONDENCE_TEXT - plainTextFromRichEditor(editor).length + selectedLength);
  const clipboardHtml = clipboard?.getData("text/html") || "";
  const clipboardText = clipboard?.getData("text/plain") || "";
  const safeHtml = clipboardHtml ? sanitizeRichTextHtml(clipboardHtml) : "";
  const pastedText = clipboardText || (() => {
    const holder = document.createElement("div");
    holder.innerHTML = safeHtml;
    return holder.innerText;
  })();
  if (pastedText.length > remaining || !safeHtml) {
    document.execCommand("insertText", false, pastedText.slice(0, remaining));
    if (pastedText.length > remaining) showToast(`O conteúdo foi limitado a ${MAX_CORRESPONDENCE_TEXT} caracteres.`);
  } else {
    document.execCommand("insertHTML", false, safeHtml);
  }
  updateRichEditorState(editor);
});

document.addEventListener("focusout", (event) => {
  const editor = event.target.closest?.("[data-rich-editor]");
  if (!editor) return;
  const safeHtml = sanitizeRichTextHtml(editor.innerHTML);
  if (safeHtml !== editor.innerHTML) editor.innerHTML = safeHtml;
  updateRichEditorState(editor);
});

document.addEventListener("keydown", (event) => {
  if (!["Enter", " "].includes(event.key)) return;
  const target = event.target.closest("[role='button'][data-action]");
  if (!target || target.tagName === "BUTTON") return;
  event.preventDefault();
  handleAction(target.dataset.action, target);
});

document.addEventListener("input", (event) => {
  const target = event.target;
  clearValidationHighlight(target);
  if (target.dataset.richEditor) {
    updateRichEditorState(target);
    return;
  }
  if (target.dataset.bind) {
    setPath(target.dataset.bind, getBoundValue(target));
    updateCounter(target);
    scheduleSave();
  }
  if (target.dataset.photoDescription) {
    const photo = state.report.photos.find((item) => item.id === target.dataset.photoDescription);
    if (photo) {
      photo.description = target.value;
      if (photo.status === "done") photo.status = "idle";
    }
  }
  if (target.dataset.notificationPhotoCaption) {
    const photo = noticeState().photos.find((item) => item.id === target.dataset.notificationPhotoCaption);
    if (photo) photo.caption = target.value;
  }
  if (target.dataset.correspondencePhotoCaption) {
    const photo = state.correspondence.photos.find((item) => item.id === target.dataset.correspondencePhotoCaption);
    if (photo) photo.caption = target.value;
  }
  if (target.dataset.topicField) {
    const topic = state.report.topics.find((item) => item.id === target.dataset.id);
    if (topic) topic[target.dataset.topicField] = target.value;
  }
});

document.addEventListener("change", (event) => {
  const target = event.target;
  clearValidationHighlight(target);
  if (target.dataset.kanbanStatus !== undefined) {
    moveKanbanCard(target.dataset.id, target.value);
    return;
  }
  if (target.dataset.richBlock !== undefined) {
    applyRichTextBlock(target);
    return;
  }
  if (target.dataset.correspondenceRecipientSelect !== undefined) {
    const selectedValue = target.value;
    state.correspondence.recipientSecretariat = selectedValue;
    if (selectedValue === OTHER_RECIPIENT_VALUE) {
      state.correspondence.recipient = "";
    } else {
      const secretariat = MUNICIPAL_SECRETARIATS.find((item) => item.acronym === selectedValue);
      state.correspondence.recipient = secretariat ? `${secretariat.acronym} — ${secretariat.name}` : "";
    }
    render();
    scheduleSave();
    return;
  }
  if (target.dataset.correspondenceSalutationSelect !== undefined) {
    const selectedValue = target.value;
    state.correspondence.salutationOption = selectedValue;
    state.correspondence.salutation = selectedValue === OTHER_SALUTATION_VALUE ? "" : selectedValue;
    render();
    scheduleSave();
    return;
  }
  if (target.dataset.signatureTarget) {
    handleSignatureSelection(target);
    return;
  }
  if (target.dataset.file) {
    handleFiles(target.dataset.file, target.files, target.dataset.id);
    return;
  }
  if (target.dataset.bind) {
    setPath(target.dataset.bind, getBoundValue(target));
    if (target.dataset.bind === "report.order") {
      sortPhotos();
      render();
    }
    if (target.dataset.bind === "cota.useAI") render();
    scheduleSave();
  }
});

document.addEventListener("dragover", (event) => {
  const kanbanColumn = event.target.closest("[data-kanban-column]");
  if (kanbanColumn && draggedKanbanCardId) {
    event.preventDefault();
    kanbanColumn.classList.add("is-drag-over");
    return;
  }
  const dropZone = event.target.closest("[data-drop]");
  if (!dropZone) return;
  event.preventDefault();
  dropZone.classList.add("is-dragging");
});

document.addEventListener("dragleave", (event) => {
  const kanbanColumn = event.target.closest("[data-kanban-column]");
  if (kanbanColumn) kanbanColumn.classList.remove("is-drag-over");
  const dropZone = event.target.closest("[data-drop]");
  if (dropZone) dropZone.classList.remove("is-dragging");
});

document.addEventListener("drop", (event) => {
  const kanbanColumn = event.target.closest("[data-kanban-column]");
  if (kanbanColumn && draggedKanbanCardId) {
    event.preventDefault();
    kanbanColumn.classList.remove("is-drag-over");
    const cardId = draggedKanbanCardId;
    draggedKanbanCardId = "";
    moveKanbanCard(cardId, kanbanColumn.dataset.kanbanColumn);
    return;
  }
  const dropZone = event.target.closest("[data-drop]");
  if (!dropZone) return;
  event.preventDefault();
  dropZone.classList.remove("is-dragging");
  handleFiles(["correspondence-photos", "notification-photos", "warning-photos"].includes(dropZone.dataset.drop) ? dropZone.dataset.drop : "report-photos", event.dataTransfer.files);
});

document.addEventListener("dragstart", (event) => {
  const card = event.target.closest("[data-kanban-card-id]");
  if (!card) return;
  draggedKanbanCardId = card.dataset.kanbanCardId;
  card.classList.add("is-dragging");
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", draggedKanbanCardId);
  }
});

document.addEventListener("dragend", (event) => {
  event.target.closest("[data-kanban-card-id]")?.classList.remove("is-dragging");
  document.querySelectorAll("[data-kanban-column].is-drag-over").forEach((column) => column.classList.remove("is-drag-over"));
  draggedKanbanCardId = "";
});

elements.modelSelect.addEventListener("change", () => {
  elements.customModelField.classList.toggle("is-hidden", elements.modelSelect.value !== "custom");
  if (elements.modelSelect.value === "custom") elements.customModelInput.focus();
});

elements.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await submitLogin();
});

elements.registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await submitRegistration();
});

elements.apiForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await saveApiConfiguration();
});

elements.apiDialog.addEventListener("click", (event) => {
  if (event.target === elements.apiDialog) closeDialog(elements.apiDialog);
});

elements.signatureProfileForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await saveSignatureProfile();
});

elements.signatureDialog.addEventListener("click", (event) => {
  if (event.target === elements.signatureDialog) closeSignatureConfiguration();
});

elements.messageDialog.addEventListener("click", (event) => {
  if (event.target === elements.messageDialog) closeDialog(elements.messageDialog);
});

elements.renameForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await submitHistoryRename();
});

elements.kanbanCardForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await saveKanbanCard();
});

elements.kanbanCardDialog.addEventListener("click", (event) => {
  if (event.target === elements.kanbanCardDialog) closeKanbanCardDialog();
});

elements.renameDialog.addEventListener("click", (event) => {
  if (event.target === elements.renameDialog) closeHistoryRename();
});

window.addEventListener("beforeunload", () => {
  stopNotificationPolling();
  state.report.photos.forEach((photo) => URL.revokeObjectURL(photo.url));
  state.notification.photos.forEach((photo) => URL.revokeObjectURL(photo.url));
  state.warning.photos.forEach((photo) => URL.revokeObjectURL(photo.url));
  if (state.lastDownload?.url) URL.revokeObjectURL(state.lastDownload.url);
  state.history.pdfCache.forEach((cached) => cached.url && URL.revokeObjectURL(cached.url));
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && state.auth.user) {
    void loadKanbanNotifications({ silent: true });
  }
});

bootstrapAuth();
