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
const COTA_STEPS = ["Conteúdo", "Revisão e download"];
const MEMORANDUM_STEPS = ["Dados do memorando", "Conteúdo", "Revisão e download"];
const CORRESPONDENCE_STEPS = ["Dados do documento", "Conteúdo", "Revisão e download"];
const NOTIFICATION_STEPS = ["Dados da notificação", "Conteúdo e anexos", "Revisão e download"];
const WARNING_STEPS = ["Dados da advertência", "Conteúdo e anexos", "Revisão e download"];
const CORRESPONDENCE_TYPES = {
  memorando: {
    label: "Memorando",
    article: "o",
    completed: "concluído",
    description: "Comunicação interna objetiva entre setores, unidades ou responsáveis.",
    recipientPrefix: "Ao(À)",
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
const MAX_COTA_TEXT = 2500;
const MAX_COTA_LINES = 32;
const COTA_TEMPLATE_URL = "templates/MODELO_FOLHA_COTA.docx";
const MEMORANDUM_TEMPLATE_URL = "templates/MODELO_MEMORANDO.docx";
const NOTIFICATION_TEMPLATE_URL = "templates/MODELO_NOTIFICACAO.docx";
const COTA_TEXT_STYLE = { font: "Arial", size: 24, language: { value: "pt-BR" } };
const COTA_HEADER_FIELD_STYLE = { ...COTA_TEXT_STYLE, bold: true, italics: false };
const MAX_CORRESPONDENCE_TEXT = 7000;
const ACCEPTED_IMAGES = ["image/jpeg", "image/png", "image/bmp", "image/gif", "image/webp"];

const DEFAULT_RESPONSIBLES = [
  "Lucas P. Simões",
  "Pedro Sodré Almeida",
  "Rogério Araújo dos Santos",
  "Leonardo Piccoli",
  "José Ferreira Filho",
  "Jéssica Simão",
  "John Kennedy Batista Reis",
  "Guilherme Teixeira de Almeida",
  "Diego Martins de Souza",
];

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
  messageDialog: document.querySelector("#messageDialog"),
  messageIcon: document.querySelector("#messageIcon"),
  messageTitle: document.querySelector("#messageTitle"),
  messageText: document.querySelector("#messageText"),
  messageActions: document.querySelector("#messageActions"),
  toast: document.querySelector("#toast"),
  saveStatus: document.querySelector("#saveStatus"),
};

const persisted = readStorage("docflow-preferences", {});

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
  report: createReportState(persisted),
  cota: createCotaState(persisted),
  correspondence: createCorrespondenceState(persisted),
  notification: createNotificationState(persisted, "notification"),
  warning: createNotificationState(persisted, "warning"),
  analysis: { running: false, total: 0, done: 0 },
  generation: { running: false, progress: 0, message: "" },
  lastDownload: null,
  history: { open: false, loading: false, loaded: false, items: [], error: "" },
  messageCallbacks: new Map(),
};

let toastTimer = null;
let saveTimer = null;
let cotaTemplatePromise = null;
let memorandumTemplatePromise = null;
let notificationTemplatePromise = null;

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
    responsibleOptions: Array.isArray(saved.responsibleOptions)
      ? unique([...DEFAULT_RESPONSIBLES, ...saved.responsibleOptions])
      : [...DEFAULT_RESPONSIBLES],
    responsibles: Array.isArray(saved.responsibles) ? saved.responsibles : [],
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
    recipientRole: "",
    salutation: "",
    subject: "",
    baseText: "",
    finalText: "",
    signer: "",
    signerRole: "",
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
    signatories: [{ id: makeId(`${kind}-signer`), name: "", role: "" }],
    photos: [],
    complete: false,
  };
}

function todayInputValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
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
        responsibleOptions: state.report.responsibleOptions,
        responsibles: state.report.responsibles,
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

function setAuthFeedback(element, message) {
  element.textContent = message;
  element.classList.toggle("is-hidden", !message);
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
  const selectedModel = payload.api?.model || "gpt-5.6-terra";
  const knownModels = new Set(["gpt-5.6-terra", "gpt-5.6-sol", "gpt-5.6-luna"]);
  state.api = {
    hasKey: Boolean(payload.api?.hasKey),
    lastFour: payload.api?.lastFour || "",
    model: knownModels.has(selectedModel) ? selectedModel : "custom",
    customModel: knownModels.has(selectedModel) ? "" : selectedModel,
  };
  elements.accountName.textContent = payload.user?.name || payload.user?.email || "";
  elements.authGate.classList.add("is-hidden");
  elements.siteShell.hidden = false;
  elements.siteShell.classList.remove("is-hidden");
  render();
  loadDocumentHistory();
}

function showAuthGate(view = "login") {
  state.auth.user = null;
  state.history = { open: false, loading: false, loaded: false, items: [], error: "" };
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
    const account = await apiRequest("/api/auth/register", {
      method: "POST",
      body: {
        name: elements.registerName.value.trim(),
        email: elements.registerEmail.value.trim(),
        password: elements.registerPassword.value,
      },
    });
    applyAccount(account);
    elements.registerForm.reset();
    showToast("Conta criada com sucesso.");
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
    button.className = `button ${action.primary ? "button-primary" : "button-secondary"}`;
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
  if (state.history.open) {
    elements.sidebar.classList.add("is-hidden");
    elements.actionBar.classList.add("is-hidden");
    elements.view.className = "view home-view";
    elements.view.innerHTML = renderDocumentHistory();
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
          : isMemorandumFlow()
            ? renderMemorandum()
            : renderCorrespondence();
    configureActionBar();
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
  if (isMemorandumFlow()) return MEMORANDUM_STEPS;
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
  } else if (isMemorandumFlow()) {
    elements.flowEyebrow.textContent = "Memorando";
    elements.flowTitle.textContent = "Prepare o memorando";
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
    <div class="home-history-row">
      <button class="button button-primary home-history-button" type="button" data-action="show-history">
        Histórico de documentos <span aria-hidden="true">→</span>
      </button>
    </div>
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
        <p>Gere o memorando no modelo oficial da Prefeitura de Bertioga, com os campos e a formatação do arquivo fornecido.</p>
        <span class="card-link">Criar memorando <span aria-hidden="true">→</span></span>
      </article>
      <article class="document-card is-admin" tabindex="0" role="button" data-action="start-correspondence" data-kind="oficio">
        <span class="card-status is-development">Em desenvolvimento</span>
        <span class="card-number" aria-hidden="true">04</span><span class="card-icon" aria-hidden="true">O</span>
        <h3>Ofício</h3>
        <p>Prepare uma comunicação formal para órgãos, entidades ou destinatários externos.</p>
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

function renderDocumentHistory() {
  const history = state.history;
  const content = history.loading && !history.loaded
    ? `<div class="history-state"><span class="history-spinner" aria-hidden="true"></span><strong>Carregando seus documentos…</strong></div>`
    : history.error
      ? `<div class="history-state is-error"><strong>Não foi possível carregar o histórico</strong><span>${e(history.error)}</span><button class="button button-secondary" type="button" data-action="refresh-history">Tentar novamente</button></div>`
      : history.items.length
        ? `<div class="history-list">${history.items.map(renderHistoryItem).join("")}</div>`
        : `<div class="history-state"><strong>Seu histórico ainda está vazio</strong><span>Quando você gerar um documento, ele aparecerá aqui para baixar novamente.</span><button class="button button-primary" type="button" data-action="home">Criar primeiro documento</button></div>`;

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
  return `<article class="history-item">
    <span class="history-file-mark" aria-hidden="true">W</span>
    <div class="history-file-copy"><strong>${e(document.filename)}</strong><span>${e(document.documentType)} • ${e(formatHistoryDate(document.createdAt))} • ${e(formatFileSize(document.sizeBytes))}</span></div>
    <button class="button button-secondary" type="button" data-action="download-history" data-id="${e(document.id)}">Baixar novamente <span aria-hidden="true">↓</span></button>
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
  state.history.open = true;
  render();
  focusMain();
  if (!state.history.loaded) loadDocumentHistory();
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
    ${panelHeader("Responsáveis pelas assinaturas", "Selecione pelo menos uma pessoa. Você também pode adicionar outro nome.")}
    <div class="responsible-list">${r.responsibleOptions.map((name) => `<label class="check-row"><input type="checkbox" data-responsible="${e(name)}" ${r.responsibles.includes(name) ? "checked" : ""} /><span>${e(name)}</span></label>`).join("")}</div>
    <div class="inline-add"><input id="newResponsible" type="text" placeholder="Nome de outro responsável" maxlength="100" /><button class="button button-secondary" type="button" data-action="add-responsible">Adicionar</button></div>
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
    <div class="review-block"><h3>Responsáveis</h3><p>${e(r.responsibles.join(" • "))}</p></div>
  </section>
  <div class="notice"><span aria-hidden="true">✓</span><span><strong>O documento será criado localmente.</strong> A geração do Word não envia seus arquivos a nenhum servidor.</span></div>`;
}

function summaryCard(label, value, detail) {
  return `<article class="summary-card"><span>${e(label)}</span><strong>${e(value)}</strong><small>${e(detail)}</small></article>`;
}

function renderCota() {
  return state.step === 0 ? renderCotaContent() : renderCotaReview();
}

function renderCotaContent() {
  const c = state.cota;
  const metrics = cotaMetrics(c.baseText);
  return `${pageHeading("Etapa 1", "Escreva a ideia principal", "Informe o texto-base, escolha se deseja assistência da IA e revise o resultado antes de gerar o Word.")}
  <section class="panel">
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
  return `${pageHeading("Etapa 2", "Revise a redação final", c.useAI ? "Confira o texto analisado pela IA e faça qualquer ajuste necessário." : "Confira o texto digitado antes de gerar o Word.")}
  <section class="panel">
    ${panelHeader("Texto final", "O conteúdo será distribuído em até 32 linhas na folha pautada.", reviewAction)}
    <label class="field"><span>Redação administrativa *</span><textarea data-bind="cota.finalText" maxlength="${MAX_COTA_TEXT}">${e(c.finalText)}</textarea><span class="text-counter"><span id="cotaLineCount">${metrics.lines} de ${MAX_COTA_LINES} linhas estimadas</span><span id="cotaCharCount">${metrics.characters}/${MAX_COTA_TEXT}</span></span></label>
  </section>
  <div class="summary-grid">
    ${summaryCard("Processo", c.processNumber || "Em branco", c.year || "Ano em branco")}
    ${summaryCard("Folha", c.sheetNumber || "Em branco", "Campo editável no Word")}
    ${summaryCard("Capacidade", `${metrics.lines}/${MAX_COTA_LINES} linhas`, `${metrics.characters} caracteres`)}
  </div>
  ${c.useAI ? `<div class="notice"><span aria-hidden="true">✦</span><span>Texto analisado com <strong>${e(modelDisplayName(getSelectedModel()))}</strong>${c.contextImage ? ` usando <strong>${e(c.contextImage.file.name)}</strong> como contexto visual` : ""}. Revise todas as informações.</span></div>` : `<div class="notice"><span aria-hidden="true">✓</span><span><strong>Modo direto:</strong> este é o texto digitado por você, sem análise da IA.</span></div>`}`;
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
    ${panelHeader("Pessoas que vão assinar", "O cargo de cada pessoa aparecerá imediatamente abaixo do respectivo nome.", `<button class="button button-secondary" type="button" data-action="add-notification-signer">+ Adicionar pessoa</button>`)}
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
    <div class="field-grid">
      <label class="field"><span>Nome completo *</span><input type="text" data-notification-signatory-field="name" data-id="${e(signatory.id)}" value="${e(signatory.name)}" placeholder="Nome da pessoa" /></label>
      <label class="field"><span>Cargo ou função *</span><input type="text" data-notification-signatory-field="role" data-id="${e(signatory.id)}" value="${e(signatory.role)}" placeholder="Ex.: Fiscal do contrato" /></label>
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
  const signerNames = n.signatories.map((item) => `${item.name} — ${item.role}`).join(" • ");
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
    <div class="review-block"><h3>Assinaturas</h3><p>${e(signerNames)}</p></div>
  </section>
  <div class="notice"><span aria-hidden="true">✓</span><span><strong>Modelo conferido.</strong> O arquivo será criado com o cabeçalho oficial da Prefeitura de Bertioga e a formatação do documento fornecido.</span></div>`;
}

function isMemorandumFlow(flow = state.flow) {
  return flow === "correspondence" && state.correspondence.kind === "memorando";
}

function renderMemorandum() {
  const renders = [renderMemorandumInfo, renderMemorandumContent, renderMemorandumReview];
  return renders[state.step]();
}

function renderMemorandumInfo() {
  const c = state.correspondence;
  return `${pageHeading("Etapa 1", "Identifique o memorando", "Preencha os campos que aparecerão no modelo oficial da Prefeitura de Bertioga.")}
  <section class="panel">
    ${panelHeader("Modelo oficial", "O brasão, o cabeçalho, a página A4, as margens e a tipografia serão preservados conforme o arquivo fornecido.")}
    <div class="field-grid three">
      <label class="field"><span>Cidade *</span><input type="text" data-bind="correspondence.place" value="${e(c.place)}" placeholder="Ex.: Bertioga" /></label>
      <label class="field"><span>Data *</span><input type="date" data-bind="correspondence.date" value="${e(c.date)}" /></label>
      <label class="field"><span>Número do memorando *</span><input type="text" data-bind="correspondence.number" value="${e(c.number)}" placeholder="Ex.: 0268/2026" /></label>
    </div>
  </section>
  <section class="panel">
    ${panelHeader("Destinatário", "O setor ou destinatário e o tratamento serão apresentados em negrito, como no modelo original.")}
    <div class="field-grid">
      <label class="field"><span>Destinatário ou setor *</span><input type="text" data-bind="correspondence.recipient" value="${e(c.recipient)}" placeholder="Ex.: SCON" /></label>
      <label class="field"><span>Saudação ou tratamento *</span><input type="text" data-bind="correspondence.salutation" value="${e(c.salutation)}" placeholder="Ex.: Sra. Chefe," /></label>
    </div>
  </section>`;
}

function renderMemorandumContent() {
  const c = state.correspondence;
  return `${pageHeading("Etapa 2", "Escreva o memorando", "Informe o texto e a pessoa que assinará o documento.")}
  <section class="panel">
    ${panelHeader("Texto do memorando", "Separe os parágrafos com uma linha em branco; o Word manterá Arial 12, alinhamento justificado e espaçamento de 1,5 linha.")}
    <label class="field"><span>Conteúdo *</span><textarea data-bind="correspondence.baseText" maxlength="${MAX_CORRESPONDENCE_TEXT}" placeholder="Escreva o texto integral do memorando…">${e(c.baseText)}</textarea><span class="text-counter"><span>Use parágrafos para organizar as informações</span><span>${c.baseText.length}/${MAX_CORRESPONDENCE_TEXT}</span></span></label>
  </section>
  <section class="panel">
    ${panelHeader("Assinatura", "O cargo será colocado imediatamente abaixo do nome, ambos centralizados e em negrito.")}
    <div class="field-grid">
      <label class="field"><span>Nome do signatário *</span><input type="text" data-bind="correspondence.signer" value="${e(c.signer)}" placeholder="Nome completo" /></label>
      <label class="field"><span>Cargo ou função *</span><input type="text" data-bind="correspondence.signerRole" value="${e(c.signerRole)}" placeholder="Ex.: Secretário de Obras e Habitação" /></label>
    </div>
  </section>
  <div class="notice is-warning"><span aria-hidden="true">!</span><span>A IA pode revisar a linguagem na etapa seguinte, sem inventar fatos, datas, números ou providências. Confira o texto antes de gerar o Word.</span></div>`;
}

function renderMemorandumReview() {
  const c = state.correspondence;
  return `${pageHeading("Etapa 3", "Revise o memorando", "Confira os dados e ajuste o texto final antes de baixar o Word.")}
  <section class="panel">
    ${panelHeader("Texto final", "Somente o conteúdo deste campo será usado como corpo do memorando.", `<button class="button button-secondary" type="button" data-action="improve-correspondence">✦ Revisar com IA</button>`)}
    <label class="field"><span>Redação final *</span><textarea data-bind="correspondence.finalText" maxlength="${MAX_CORRESPONDENCE_TEXT}">${e(c.finalText)}</textarea><span class="text-counter"><span>Revise nomes, datas, valores e números</span><span>${c.finalText.length}/${MAX_CORRESPONDENCE_TEXT}</span></span></label>
  </section>
  <div class="summary-grid">
    ${summaryCard("Memorando", c.number, `${c.place}, ${formatDateLong(c.date)}`)}
    ${summaryCard("Destinatário", formatMemorandumRecipient(c.recipient), c.salutation)}
    ${summaryCard("Assinatura", c.signer, c.signerRole)}
  </div>
  <div class="notice"><span aria-hidden="true">✓</span><span><strong>Modelo conferido.</strong> O arquivo será criado com o cabeçalho oficial, a paginação e a formatação do memorando fornecido.</span></div>`;
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
    <label class="field"><span>Corpo do documento *</span><textarea data-bind="correspondence.baseText" maxlength="${MAX_CORRESPONDENCE_TEXT}" placeholder="Escreva o conteúdo do documento…">${e(c.baseText)}</textarea><span class="text-counter"><span>Use parágrafos para organizar as informações</span><span>${c.baseText.length}/${MAX_CORRESPONDENCE_TEXT}</span></span></label>
  </section>
  <section class="panel">
    ${panelHeader("Assinatura", "Identifique a pessoa responsável pela emissão do documento.")}
    <div class="field-grid">
      <label class="field"><span>Nome do signatário *</span><input type="text" data-bind="correspondence.signer" value="${e(c.signer)}" placeholder="Nome completo" /></label>
      <label class="field"><span>Cargo ou função</span><input type="text" data-bind="correspondence.signerRole" value="${e(c.signerRole)}" placeholder="Ex.: Diretor do Departamento" /></label>
    </div>
  </section>
  <div class="notice is-warning"><span aria-hidden="true">!</span><span>A IA será orientada a revisar a linguagem sem inventar fatos, datas, leis, prazos ou penalidades. Confira o texto antes de gerar o Word.</span></div>`;
}

function renderCorrespondenceReview() {
  const c = state.correspondence;
  const type = correspondenceType();
  return `${pageHeading("Etapa 3", `Revise ${type.article} ${type.label.toLowerCase()}`, "Edite livremente, solicite uma revisão opcional da IA ou gere o Word com o texto atual.")}
  <section class="panel">
    ${panelHeader("Texto final", "Somente o conteúdo deste campo será incluído como corpo do documento.", `<button class="button button-secondary" type="button" data-action="improve-correspondence">✦ Revisar com IA</button>`)}
    <label class="field"><span>Redação final *</span><textarea data-bind="correspondence.finalText" maxlength="${MAX_CORRESPONDENCE_TEXT}">${e(c.finalText)}</textarea><span class="text-counter"><span>Revise nomes, datas e informações sensíveis</span><span>${c.finalText.length}/${MAX_CORRESPONDENCE_TEXT}</span></span></label>
  </section>
  <div class="summary-grid">
    ${summaryCard("Documento", type.label, c.number || "Sem número")}
    ${summaryCard("Destinatário", c.recipient, c.recipientRole || "Sem complemento")}
    ${summaryCard("Emissão", formatDate(c.date), c.place || "Local não informado")}
  </div>
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
  return { characters: text.length, lines: wrapCotaText(text).length };
}

function wrapCotaText(text) {
  const normalized = String(text || "").replace(/\r\n?/g, "\n").trim();
  if (!normalized) return [];
  const lines = [];
  const paragraphs = normalized.split(/\n\s*\n/);
  paragraphs.forEach((paragraph, paragraphIndex) => {
    const words = paragraph.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
    let line = "";
    words.forEach((word) => {
      const candidate = line ? `${line} ${word}` : word;
      if (candidate.length <= 38 || !line) line = candidate;
      else {
        lines.push(line);
        line = word;
      }
    });
    if (line) lines.push(line);
    if (paragraphIndex < paragraphs.length - 1) lines.push("");
  });
  return lines;
}

function startFlow(flow, kind = "") {
  state.history.open = false;
  state.flow = flow;
  if (flow === "correspondence" && CORRESPONDENCE_TYPES[kind]) {
    if (state.correspondence.kind !== kind) {
      state.correspondence = createCorrespondenceState(readStorage("docflow-preferences", {}));
    }
    state.correspondence.kind = kind;
    state.correspondence.complete = false;
  }
  if (isNoticeFlow(flow)) noticeState(flow).complete = false;
  state.step = 0;
  state.generation = { running: false, progress: 0, message: "" };
  currentData().complete = false;
  render();
  focusMain();
}

function goHome() {
  state.flow = null;
  state.history.open = false;
  state.step = 0;
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
  render();
  focusMain();
}

function validateCurrentStep() {
  if (state.flow === "report") {
    const r = state.report;
    if (state.step === 0) {
      if (!r.title.trim() || !r.date || !r.introduction.trim()) {
        showMessage({ title: "Complete os dados principais", text: "Informe o título, a data e a introdução antes de continuar." });
        return false;
      }
    }
    if (state.step === 1 && !r.photos.length) {
      showMessage({ title: "Adicione as fotografias", text: "Selecione pelo menos uma imagem para montar o relatório." });
      return false;
    }
    if (state.step === 2) {
      const invalidTopic = r.topics.find((topic) => !topic.title.trim() || !topic.text.trim());
      if (invalidTopic) {
        showMessage({ title: "Complete os tópicos", text: "Todo tópico adicionado precisa ter título e texto, ou deve ser removido." });
        return false;
      }
      if (!r.responsibles.length) {
        showMessage({ title: "Selecione um responsável", text: "Escolha pelo menos uma pessoa para a área de assinaturas." });
        return false;
      }
    }
    return true;
  }

  if (state.flow === "correspondence") {
    const c = state.correspondence;
    if (isMemorandumFlow()) {
      if (state.step === 0 && (!c.place.trim() || !c.date || !c.number.trim() || !c.recipient.trim() || !c.salutation.trim())) {
        showMessage({ title: "Complete a identificação", text: "Informe cidade, data, número do memorando, destinatário e saudação antes de continuar." });
        return false;
      }
      if (state.step === 1 && (!c.baseText.trim() || !c.signer.trim() || !c.signerRole.trim())) {
        showMessage({ title: "Complete o conteúdo", text: "Informe o texto, o nome e o cargo da pessoa que vai assinar." });
        return false;
      }
      if (state.step === 2 && !c.finalText.trim()) {
        showMessage({ title: "Texto final vazio", text: "Mantenha algum conteúdo antes de gerar o memorando." });
        return false;
      }
      return true;
    }
    if (state.step === 0 && (!c.date || !c.recipient.trim() || !c.subject.trim())) {
      showMessage({ title: "Complete os dados do documento", text: "Informe a data, o destinatário e o assunto antes de continuar." });
      return false;
    }
    if (state.step === 1 && (!c.baseText.trim() || !c.signer.trim())) {
      showMessage({ title: "Complete o conteúdo", text: "Informe o corpo do documento e o nome do signatário antes de continuar." });
      return false;
    }
    if (state.step === 2 && !c.finalText.trim()) {
      showMessage({ title: "Texto final vazio", text: "Mantenha algum conteúdo antes de gerar o documento." });
      return false;
    }
    return true;
  }

  if (isNoticeFlow()) {
    const n = noticeState();
    const notice = noticeCopy();
    if (state.step === 0 && (!n.city.trim() || !n.date || !n.number.trim() || !n.process.trim() || !n.work.trim() || !n.contractor.trim())) {
      showMessage({ title: "Complete a identificação", text: `Informe cidade, data, número da ${notice.lower}, processo, obra e contratada antes de continuar.` });
      return false;
    }
    if (state.step === 1) {
      if (!n.baseText.trim()) {
        showMessage({ title: "Informe o texto", text: `Escreva o conteúdo da ${notice.lower} antes de continuar.` });
        return false;
      }
      const invalidSigner = n.signatories.find((item) => !item.name.trim() || !item.role.trim());
      if (!n.signatories.length || invalidSigner) {
        showMessage({ title: "Complete as assinaturas", text: "Informe o nome e o respectivo cargo de cada pessoa que vai assinar." });
        return false;
      }
      const photoWithoutCaption = n.photos.find((photo) => !photo.caption.trim());
      if (photoWithoutCaption) {
        showMessage({ title: "Complete as legendas", text: "Toda foto anexada precisa ter uma legenda, ou deve ser removida." });
        return false;
      }
    }
    if (state.step === 2 && !n.finalText.trim()) {
      showMessage({ title: "Texto final vazio", text: `Mantenha algum conteúdo antes de gerar a ${notice.lower}.` });
      return false;
    }
    return true;
  }

  const c = state.cota;
  if (state.step === 0) {
    if (!c.baseText.trim()) {
      showMessage({ title: "Escreva o texto-base", text: "Informe a ideia que deverá constar na folha de cota." });
      return false;
    }
    if (c.year && !/^\d{4}$/.test(c.year)) {
      showMessage({ title: "Ano inválido", text: "Informe o ano com quatro dígitos, por exemplo 2026." });
      return false;
    }
  }
  if (state.step === 1) {
    const metrics = cotaMetrics(c.finalText);
    if (!c.finalText.trim()) {
      showMessage({ title: "Texto final vazio", text: "Mantenha algum conteúdo antes de gerar o documento." });
      return false;
    }
    if (metrics.characters > MAX_COTA_TEXT || metrics.lines > MAX_COTA_LINES) {
      showMessage({ title: "Texto acima da capacidade", text: `Reduza o conteúdo para no máximo ${MAX_COTA_TEXT} caracteres e ${MAX_COTA_LINES} linhas estimadas.` });
      return false;
    }
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

  if (kind === "notification-photos" || kind === "warning-photos") {
    const owner = kind === "warning-photos" ? state.warning : state.notification;
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
    message: isMemorandumFlow()
      ? "Aplicando o modelo oficial do memorando…"
      : `Montando ${type.article} ${type.label.toLowerCase()}…`,
  };
  render();
  try {
    const blob = isMemorandumFlow()
      ? await buildMemorandumDocument((progress, message) => setGenerationProgress(progress, message))
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
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
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
    const cells = r.responsibles.map((name) => new TableCell({
      width: { size: 50, type: WidthType.PERCENTAGE },
      margins: { top: 520, bottom: 80, left: 120, right: 120 },
      verticalAlign: VerticalAlign.BOTTOM,
      borders: noBorders(),
      children: [new Paragraph({ alignment: AlignmentType.CENTER, border: { top: { style: "single", size: 6, color: "68756F" } }, spacing: { before: 80 }, children: [new TextRun({ text: name, bold: true, size: 19 })] })],
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
    creator: "DocFlow",
    title: r.title,
    description: "Relatório fotográfico gerado no DocFlow",
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
  const { patchDocument, PatchType, TextRun } = window.docx;
  const c = state.cota;
  const lines = wrapCotaText(c.finalText);
  if (lines.length > MAX_COTA_LINES) throw new Error(`O texto ocupa ${lines.length} linhas; o limite é ${MAX_COTA_LINES}.`);
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
  for (let index = 0; index < MAX_COTA_LINES; index += 1) {
    patches[`line_${String(index + 1).padStart(2, "0")}`] = {
      type: PatchType.PARAGRAPH,
      children: [new TextRun({ text: lines[index] || "", ...COTA_TEXT_STYLE })],
    };
  }

  onProgress(70, "Aplicando Arial 12 e alinhamento justificado…");
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

async function loadMemorandumTemplate() {
  if (!memorandumTemplatePromise) {
    memorandumTemplatePromise = fetch(MEMORANDUM_TEMPLATE_URL)
      .then((response) => {
        if (!response.ok) throw new Error("O modelo oficial do memorando não pôde ser carregado.");
        return response.arrayBuffer();
      })
      .catch((error) => {
        memorandumTemplatePromise = null;
        throw error;
      });
  }
  const data = await memorandumTemplatePromise;
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
        new Paragraph({ spacing: { after: 0, line: 240 }, children: [new TextRun({ text: signatory.role.trim(), font: "Arial", size: 24, bold: true, color: "222222" })] }),
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

function formatMemorandumRecipient(value) {
  const recipient = String(value || "").trim().replace(/^(?:à|a)\s+/iu, "");
  return `À ${recipient}`;
}

function memorandumRun(text, bold = false) {
  const { TextRun } = window.docx;
  return new TextRun({ text: String(text || ""), font: "Arial", size: 24, bold, color: "000000" });
}

function memorandumBlankParagraph() {
  const { Paragraph } = window.docx;
  return new Paragraph({ children: [memorandumRun("")] });
}

function memorandumBodyParagraphs(text) {
  const { Paragraph, AlignmentType } = window.docx;
  return String(text || "")
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .filter((paragraph) => paragraph.trim())
    .map((paragraph) => new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: 1134 },
      spacing: { before: 100, after: 100, line: 360 },
      children: [memorandumRun(paragraph.replace(/\s*\n\s*/g, " ").trim())],
    }));
}

async function buildMemorandumDocument(onProgress) {
  const { Paragraph, AlignmentType, patchDocument, PatchType } = window.docx;
  const c = state.correspondence;
  if (typeof patchDocument !== "function" || !PatchType) {
    throw new Error("O componente de preenchimento do modelo Word não está disponível.");
  }

  onProgress(18, "Carregando o modelo oficial do memorando…");
  const template = await loadMemorandumTemplate();
  const children = [
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [memorandumRun(`${c.place.trim()}, ${formatDateLong(c.date)}.`, true)],
    }),
    memorandumBlankParagraph(),
    memorandumBlankParagraph(),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      children: [memorandumRun(`Memorando nº ${c.number.trim()}`, true)],
    }),
    memorandumBlankParagraph(),
    memorandumBlankParagraph(),
    memorandumBlankParagraph(),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      children: [memorandumRun(formatMemorandumRecipient(c.recipient), true)],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      children: [memorandumRun(c.salutation.trim(), true)],
    }),
    memorandumBlankParagraph(),
    memorandumBlankParagraph(),
    memorandumBlankParagraph(),
  ];

  onProgress(45, "Formatando o texto em Arial 12 e espaçamento de 1,5 linha…");
  children.push(...memorandumBodyParagraphs(c.finalText));
  for (let index = 0; index < 5; index += 1) children.push(memorandumBlankParagraph());
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      indent: { left: -357, right: -318 },
      children: [memorandumRun(c.signer.trim(), true)],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      indent: { left: -357, right: -318 },
      children: [memorandumRun(c.signerRole.trim(), true)],
    }),
  );

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
  onProgress(100, "Memorando concluído.");
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
  children.push(...paragraphsFromText(c.finalText));
  children.push(
    new Paragraph({ spacing: { before: 420, after: 70 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "________________________________________", color: "68756F", size: 20 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 20 }, children: [new TextRun({ text: c.signer.trim(), bold: true, size: 21 })] }),
  );
  if (c.signerRole.trim()) {
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: c.signerRole.trim(), size: 20, color: "405049" })] }));
  }

  onProgress(82, "Aplicando cabeçalho e paginação…");
  const header = await headerFor({ organization: c.organization, department: c.department, logo: null });
  const documentFile = new Document({
    creator: "DocFlow",
    title: `${type.label}${documentNumber}`,
    description: `${type.label} gerado no DocFlow`,
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
    if (callback) callback();
    return;
  }
  if (action === "home") return goHome();
  if (action === "show-history") return showDocumentHistory();
  if (action === "refresh-history") return loadDocumentHistory();
  if (action === "download-history") return triggerHistoryDownload(target.dataset.id);
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
  if (action === "add-responsible") {
    const input = document.querySelector("#newResponsible");
    const name = input?.value.trim();
    if (!name) return;
    state.report.responsibleOptions = unique([...state.report.responsibleOptions, name]);
    state.report.responsibles = unique([...state.report.responsibles, name]);
    scheduleSave();
    render();
    return;
  }
  if (action === "add-notification-signer") {
    noticeState().signatories.push({ id: makeId(`${state.flow}-signer`), name: "", role: "" });
    render();
    return;
  }
  if (action === "remove-notification-signer") {
    const notice = noticeState();
    notice.signatories = notice.signatories.filter((item) => item.id !== target.dataset.id);
    if (!notice.signatories.length) {
      notice.signatories.push({ id: makeId(`${state.flow}-signer`), name: "", role: "" });
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

document.addEventListener("keydown", (event) => {
  if (!["Enter", " "].includes(event.key)) return;
  const target = event.target.closest("[role='button'][data-action]");
  if (!target || target.tagName === "BUTTON") return;
  event.preventDefault();
  handleAction(target.dataset.action, target);
});

document.addEventListener("input", (event) => {
  const target = event.target;
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
  if (target.dataset.notificationSignatoryField) {
    const signatory = noticeState().signatories.find((item) => item.id === target.dataset.id);
    if (signatory) signatory[target.dataset.notificationSignatoryField] = target.value;
  }
  if (target.dataset.notificationPhotoCaption) {
    const photo = noticeState().photos.find((item) => item.id === target.dataset.notificationPhotoCaption);
    if (photo) photo.caption = target.value;
  }
  if (target.dataset.topicField) {
    const topic = state.report.topics.find((item) => item.id === target.dataset.id);
    if (topic) topic[target.dataset.topicField] = target.value;
  }
});

document.addEventListener("change", (event) => {
  const target = event.target;
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
  if (target.dataset.responsible) {
    const name = target.dataset.responsible;
    state.report.responsibles = target.checked
      ? unique([...state.report.responsibles, name])
      : state.report.responsibles.filter((item) => item !== name);
    scheduleSave();
  }
});

document.addEventListener("dragover", (event) => {
  const dropZone = event.target.closest("[data-drop]");
  if (!dropZone) return;
  event.preventDefault();
  dropZone.classList.add("is-dragging");
});

document.addEventListener("dragleave", (event) => {
  const dropZone = event.target.closest("[data-drop]");
  if (dropZone) dropZone.classList.remove("is-dragging");
});

document.addEventListener("drop", (event) => {
  const dropZone = event.target.closest("[data-drop]");
  if (!dropZone) return;
  event.preventDefault();
  dropZone.classList.remove("is-dragging");
  handleFiles(["notification-photos", "warning-photos"].includes(dropZone.dataset.drop) ? dropZone.dataset.drop : "report-photos", event.dataTransfer.files);
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

elements.messageDialog.addEventListener("click", (event) => {
  if (event.target === elements.messageDialog) closeDialog(elements.messageDialog);
});

window.addEventListener("beforeunload", () => {
  state.report.photos.forEach((photo) => URL.revokeObjectURL(photo.url));
  state.notification.photos.forEach((photo) => URL.revokeObjectURL(photo.url));
  state.warning.photos.forEach((photo) => URL.revokeObjectURL(photo.url));
  if (state.lastDownload?.url) URL.revokeObjectURL(state.lastDownload.url);
});

bootstrapAuth();
