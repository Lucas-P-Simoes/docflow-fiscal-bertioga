/* DocFlow — aplicação web independente para geração de documentos. */

const LEGACY_DOCFLOW_PATHS = new Set(["/docflow/", "/docflow/index.html"]);
const APP_HISTORY_KEY = "__fiscalBertiogaNavigation";
const NAVIGABLE_FLOWS = new Set(["drainage", "report", "etp", "tr", "cota", "correspondence", "notification", "warning"]);
if (LEGACY_DOCFLOW_PATHS.has(window.location.pathname)) {
  window.history.replaceState(
    null,
    "",
    `/${window.location.search}${window.location.hash}`,
  );
}

const REPORT_STEPS = ["Identificação", "Mapa e vias", "Fotografias", "Parecer e assinaturas", "Revisão"];
const ETP_STEPS = ["Identificação", "Necessidade e planejamento", "Mercado e solução", "Resultados e impactos", "Riscos e assinaturas", "Revisão"];
const TR_STEPS = ["Identificação", "Condições gerais", "Qualificação técnica", "Gestão e assinatura", "Revisão"];
const COTA_STEPS = ["Conteúdo", "Revisão", "Assinatura e download"];
const OFFICIAL_CORRESPONDENCE_STEPS = ["Dados do documento", "Conteúdo", "Revisão e download"];
const CORRESPONDENCE_STEPS = ["Dados do documento", "Conteúdo", "Revisão e download"];
const NOTIFICATION_STEPS = ["Dados da notificação", "Conteúdo e anexos", "Revisão e download"];
const WARNING_STEPS = ["Dados da advertência", "Conteúdo e anexos", "Revisão e download"];
const DRAINAGE_STEPS = ["Dados da obra", "Serviços", "Parâmetros", "Quantitativos", "Memória e Excel"];
const DRAINAGE_IMAGES = {
  system: "images/drenagem-sistema-v1.png",
  block: "images/drenagem-bloco-v1.png",
};
const DRAINAGE_COMPOSITIONS = {
  masonry: [
    { material: "Cimento", coefficient: 5.5, unit: "saco/estrutura", precision: 0 },
    { material: "Areia", coefficient: 0.417, unit: "m³/estrutura", precision: 2 },
    { material: "Brita", coefficient: 0.333, unit: "m³/estrutura", precision: 2 },
    { material: "Aço Ø8", coefficient: 16.67, unit: "m/estrutura", precision: 2 },
    { material: "Arame", coefficient: 0.833, unit: "kg/estrutura", precision: 2 },
    { material: "Compensado", coefficient: 1.333, unit: "chapa/estrutura", precision: 0 },
    { material: "Caibro", coefficient: 4, unit: "peça/estrutura", precision: 0 },
    { material: "Pregos", coefficient: 0.833, unit: "kg/estrutura", precision: 2 },
  ],
  concrete123: [
    { material: "Cimento", coefficient: 7.576, unit: "saco/m³", precision: 0 },
    { material: "Areia", coefficient: 0.515, unit: "m³/m³", precision: 2 },
    { material: "Brita", coefficient: 0.773, unit: "m³/m³", precision: 2 },
  ],
  interlocking: { material: "Piso intertravado sextavado 30 cm", coefficient: 14.13, unit: "un/m²" },
};
const HOME_CARD_OPTIONS = [
  { key: "report", label: "Parecer técnico", mark: "PT" },
  { key: "etp", label: "Estudo Técnico Preliminar", mark: "ETP" },
  { key: "tr", label: "Termo de Referência", mark: "TR" },
  { key: "cota", label: "Folha de cota", mark: "FC" },
  { key: "memorando", label: "Memorando", mark: "M" },
  { key: "oficio", label: "Ofício", mark: "O" },
  { key: "notification", label: "Notificação", mark: "N" },
  { key: "warning", label: "Advertência", mark: "A" },
];
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
const TECHNICAL_OPINION_TEMPLATE_URL = "templates/MODELO_PARECER_TECNICO.docx";
const ETP_TEMPLATE_URL = "templates/MODELO_ETP.docx";
const TR_TEMPLATE_URL = "templates/MODELO_TR.docx";
const COTA_TEXT_STYLE = { font: "Arial", size: 24, language: { value: "pt-BR" } };
const COTA_HEADER_FIELD_STYLE = { ...COTA_TEXT_STYLE, bold: true, italics: false };
const MAX_CORRESPONDENCE_TEXT = 7000;
const ACCEPTED_IMAGES = ["image/jpeg", "image/png", "image/bmp", "image/gif", "image/webp"];
const OTHER_SIGNATURE_VALUE = "__other__";
const OTHER_RECIPIENT_VALUE = "__other_recipient__";
const OTHER_SALUTATION_VALUE = "__other_salutation__";
const DEFAULT_TECHNICAL_RECOMMENDATIONS = [
  "Reposição completa dos bloquetes ausentes com material compatível ao existente",
  "Correção dos recalques, desníveis e afundamentos, com nivelamento adequado do pavimento",
  "Reassentamento e paginação correta dos bloquetes nos trechos pendentes ou instáveis",
  "Regularização final, correção dos pontos de empoçamento e limpeza dos trechos afetados",
].join("\n");

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
  processesButton: document.querySelector("#processesButton"),
  documentsButton: document.querySelector("#documentsButton"),
  historyButton: document.querySelector(".history-button"),
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
  kanbanBoardDialog: document.querySelector("#kanbanBoardDialog"),
  kanbanBoardForm: document.querySelector("#kanbanBoardForm"),
  kanbanBoardFormTitle: document.querySelector("#kanbanBoardFormTitle"),
  kanbanBoardId: document.querySelector("#kanbanBoardId"),
  kanbanBoardName: document.querySelector("#kanbanBoardName"),
  kanbanBoardDescription: document.querySelector("#kanbanBoardDescription"),
  kanbanBoardMemberList: document.querySelector("#kanbanBoardMemberList"),
  kanbanBoardFeedback: document.querySelector("#kanbanBoardFeedback"),
  saveKanbanBoardButton: document.querySelector("#saveKanbanBoardButton"),
  deleteKanbanBoardButton: document.querySelector("#deleteKanbanBoardButton"),
  processGuideDialog: document.querySelector("#processGuideDialog"),
  processGuideForm: document.querySelector("#processGuideForm"),
  processGuideFormTitle: document.querySelector("#processGuideFormTitle"),
  processGuideId: document.querySelector("#processGuideId"),
  processGuideTitle: document.querySelector("#processGuideTitle"),
  processGuideSummary: document.querySelector("#processGuideSummary"),
  processGuideChecklist: document.querySelector("#processGuideChecklist"),
  processGuideLinks: document.querySelector("#processGuideLinks"),
  processGuideFeedback: document.querySelector("#processGuideFeedback"),
  saveProcessGuideButton: document.querySelector("#saveProcessGuideButton"),
  kanbanHistoryDialog: document.querySelector("#kanbanHistoryDialog"),
  kanbanHistoryDialogTitle: document.querySelector("#kanbanHistoryDialogTitle"),
  kanbanHistoryDialogContent: document.querySelector("#kanbanHistoryDialogContent"),
  kanbanCardDialog: document.querySelector("#kanbanCardDialog"),
  kanbanCardForm: document.querySelector("#kanbanCardForm"),
  kanbanCardFormTitle: document.querySelector("#kanbanCardFormTitle"),
  kanbanCardId: document.querySelector("#kanbanCardId"),
  kanbanCardTitle: document.querySelector("#kanbanCardTitle"),
  kanbanCardDescription: document.querySelector("#kanbanCardDescription"),
  kanbanCardStartDate: document.querySelector("#kanbanCardStartDate"),
  kanbanCardDurationDays: document.querySelector("#kanbanCardDurationDays"),
  kanbanSchedulePreview: document.querySelector("#kanbanSchedulePreview"),
  kanbanCardStatus: document.querySelector("#kanbanCardStatus"),
  kanbanAssigneeList: document.querySelector("#kanbanAssigneeList"),
  kanbanCardCollaboration: document.querySelector("#kanbanCardCollaboration"),
  kanbanAttachmentInput: document.querySelector("#kanbanAttachmentInput"),
  kanbanAttachmentList: document.querySelector("#kanbanAttachmentList"),
  kanbanAttachmentFeedback: document.querySelector("#kanbanAttachmentFeedback"),
  kanbanCardTimeline: document.querySelector("#kanbanCardTimeline"),
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

function createProcessesState() {
  return {
    open: false,
    loading: false,
    loaded: false,
    saving: false,
    items: [],
    error: "",
    busy: new Map(),
  };
}

function createKanbanState() {
  return {
    open: false,
    loading: false,
    loaded: false,
    boards: [],
    activeBoardId: "",
    board: null,
    cards: [],
    people: [],
    activity: [],
    error: "",
    busy: new Map(),
    editingCardId: "",
    cardDetails: {
      cardId: "",
      loading: false,
      error: "",
      attachments: [],
      timeline: [],
      uploading: false,
    },
    notifications: [],
    unreadCount: 0,
    notificationTotalCount: 0,
    notificationsLoading: false,
    notificationsOpen: false,
    notificationsExpanded: false,
  };
}

const state = {
  auth: {
    user: null,
    cardAccess: normalizeCardAccess(),
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
  etp: createEtpState(persisted),
  tr: createTrState(persisted),
  cota: createCotaState(persisted),
  correspondence: createCorrespondenceState(persisted),
  notification: createNotificationState(persisted, "notification"),
  warning: createNotificationState(persisted, "warning"),
  drainage: createDrainageState(readStorage("docflow-drainage-draft", {})),
  analysis: { running: false, total: 0, done: 0 },
  generation: { running: false, progress: 0, message: "" },
  lastDownload: null,
  history: createHistoryState(),
  admin: createAdminState(),
  processes: createProcessesState(),
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
let technicalOpinionTemplatePromise = null;
let etpTemplatePromise = null;
let trTemplatePromise = null;
let pendingSignatureTarget = null;
let notificationPollTimer = null;
let draggedKanbanCardId = "";
let homeSearchQuery = "";

function currentNavigationRoute() {
  if (state.flow) {
    return {
      view: "flow",
      flow: state.flow,
      kind: state.flow === "correspondence" ? state.correspondence.kind : "",
      step: state.step,
      complete: Boolean(currentData().complete),
    };
  }
  if (state.admin.open) return { view: "admin" };
  if (state.processes.open) return { view: "processes" };
  if (state.history.open) return { view: "history" };
  if (state.kanban.open) return { view: "kanban", boardId: state.kanban.activeBoardId || "" };
  return { view: "home" };
}

function writeNavigationState(mode = "push", route = currentNavigationRoute()) {
  const currentRoute = window.history.state?.[APP_HISTORY_KEY];
  const nextRoute = { ...route };
  if (mode === "push" && JSON.stringify(currentRoute) === JSON.stringify(nextRoute)) return;
  const historyState = { ...(window.history.state || {}), [APP_HISTORY_KEY]: nextRoute };
  const url = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.history[mode === "replace" ? "replaceState" : "pushState"](historyState, "", url);
}

function pushNavigationState() {
  writeNavigationState("push");
}

function replaceNavigationState(route = currentNavigationRoute()) {
  writeNavigationState("replace", route);
}

function applyNavigationRoute(route) {
  if (!state.auth.user || !route) return;
  const requestedView = String(route.view || "home");
  const view = requestedView === "admin" && !state.auth.user.isAdmin ? "home" : requestedView;
  state.admin.open = view === "admin";
  state.processes.open = view === "processes";
  state.history.open = view === "history";
  state.kanban.open = view === "kanban";
  state.validationFields = [];
  state.generation.running = false;

  if (view === "flow" && NAVIGABLE_FLOWS.has(route.flow)) {
    state.flow = route.flow;
    if (state.flow === "correspondence" && CORRESPONDENCE_TYPES[route.kind]) {
      state.correspondence.kind = route.kind;
    }
    const lastStep = Math.max(0, currentSteps().length - 1);
    state.step = Math.min(lastStep, Math.max(0, Number(route.step) || 0));
    currentData().complete = Boolean(route.complete);
  } else {
    state.flow = null;
    state.step = 0;
  }

  if (view === "kanban" && route.boardId) state.kanban.activeBoardId = route.boardId;
  closeNotificationPopover();
  render();
  focusMain();
  if (view === "admin" && !state.admin.loaded) void loadAdminUsers();
  if (view === "processes" && !state.processes.loaded) void loadProcesses();
  if (view === "history" && !state.history.loaded) void loadDocumentHistory();
  if (view === "kanban" && !state.kanban.loaded) void loadKanban();
}

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
    city: saved.technicalOpinionCity || "Bertioga",
    date: todayInputValue(),
    neighborhood: "",
    responsibleCompany: "SABESP",
    intervention: "implantação ou manutenção de redes de abastecimento de água e esgoto",
    map: null,
    mapCaption: "Ruas vistoriadas destacadas no mapa.",
    streets: "",
    photos: [],
    order: "name",
    findings: "",
    impacts: "",
    recommendations: DEFAULT_TECHNICAL_RECOMMENDATIONS,
    responsibles: [],
    onePerPage: saved.onePerPage !== false,
    complete: false,
  };
}

function createEtpRisk(values = {}) {
  return {
    id: values.id || makeId("etp-risk"),
    title: values.title || "",
    probability: values.probability || "",
    impact: values.impact || "",
    damage: values.damage || "",
    preventiveAction: values.preventiveAction || "",
    contingencyAction: values.contingencyAction || "",
  };
}

function createEtpState(saved = {}) {
  return {
    object: "",
    processNumber: "",
    requestingUnit: saved.department || "",
    city: saved.technicalOpinionCity || "Bertioga",
    date: todayInputValue(),
    introduction: "",
    needDescription: "",
    annualPlan: "",
    budgetAllocation: "",
    requirements: "",
    quantityEstimate: "",
    marketSurvey: "",
    estimatedValue: "",
    solutionDescription: "",
    parcelingJustification: "",
    expectedResults: "",
    socialAssessment: "",
    operationalQualification: "",
    priorMeasures: "",
    relatedContracts: "",
    environmentalImpacts: "",
    licenses: "",
    risks: [createEtpRisk()],
    responsibles: [],
    complete: false,
  };
}

function createTrState(saved = {}) {
  return {
    object: "",
    interventionImage: null,
    location: "",
    durationNumber: "",
    durationWords: "",
    estimatedCost: "",
    estimatedCostWords: "",
    priceReference: "",
    bidMode: "Concorrência",
    relevanceCriteria: "Para definição das parcelas de maior relevância técnica foram considerados critérios de representatividade financeira, complexidade executiva, impacto na funcionalidade e desempenho do objeto.",
    accessoryService: "Embora o serviço de fechamento provisório por tapume apresente representatividade financeira na planilha orçamentária, trata-se de atividade acessória e preparatória, não demandando expertise técnica específica capaz de comprometer a adequada execução do objeto.",
    relevantServices: "Foram consideradas parcelas de maior relevância os serviços de pintura em estrutura metálica com preparo de superfície e aplicação de fundo antioxidante, bem como a instalação de sistema de iluminação LED em fachada, por envolverem técnicas executivas específicas e interferirem diretamente na durabilidade, desempenho e resultado final da intervenção.",
    operationalQualification: "5.1.\tQualificação Técnico-Operacional - Registro ou inscrição da empresa na entidade profissional competente, em plena validade, junto ao Conselho de Arquitetura e Urbanismo – CAU e ao Conselho Federal de Engenharia e Agronomia – CONFEA/Conselho Regional de Engenharia e Agronomia – CREA, conforme a área de atuação e atribuições profissionais pertinentes ao objeto da contratação. Comprovação de aptidão para execução de serviço similar ou do item pertinente, por meio da apresentação de certidões ou atestados emitidos por pessoas jurídicas de direito público ou privado e devidamente registrado na entidade competente. As comprovações de capacidade técnica devem ser apresentadas em nome da licitante e referente aos seguintes serviços:",
    relevantService1: "Pintura em estrutura metálica com preparo de superfície no mínimo 253,87 m².",
    relevantService2: "Instalação de sistema de iluminação FITA LED EXTERNA no mínimo 99,20 m.",
    professionalQualification: "5.2.\tQualificação Técnico-Profissional - Apresentação do(s) profissional(is) devidamente registrado(s) no conselho profissional competente (CAU ou CREA, conforme suas atribuições legais), detentor(es) de atestado de responsabilidade técnica por serviço com características semelhantes ao objeto licitado.",
    eligibleProfessionals: "5.3\tPara fins de cumprimento das atribuições e responsabilidades do objeto, serão admitidos profissionais com habilitação em Engenharia ou Arquitetura, observadas as respectivas resoluções de cada Conselho Profissional.",
    certificateAggregation: "5.4\tSerá admitida, para fins de comprovação do quantitativo mínimo exigido, a apresentação e o somatório de diferentes atestados, inclusive executados de forma concomitante, desde que compatíveis com o objeto licitado e observadas as atribuições legais do profissional responsável.",
    councilCompatibility: "5.5\tA comprovação da capacidade técnico-profissional e técnico-operacional deverá respeitar as atribuições profissionais estabelecidas pela legislação vigente, sendo vedada a exigência de registro em conselho diverso daquele legalmente competente para o exercício da atividade.",
    professionalBond: "5.6\tO profissional detentor do Acervo Técnico deverá possuir seu vínculo com a licitante na data da apresentação dos documentos de habilitação e proposta, nos termos da Súmula nº 25 do Tribunal de Contas do Estado de São Paulo (TCE-SP).",
    management: "",
    city: saved.technicalOpinionCity || "Bertioga",
    date: todayInputValue(),
    signerProfileId: "",
    signerName: "",
    signerRole: "",
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

function createDrainageState(saved = {}) {
  const defaults = {
    project: {
      name: "Drenagem Rua 22",
      neighborhood: "São Lourenço",
      extension: 140,
      roadWidth: 7,
      standardLoss: 10,
      responsible: "Eng. Civil",
      date: todayInputValue(),
    },
    services: { bl: true, pv: true, pipes: true, pavement: true, gutter: true },
    bl: {
      quantity: 6,
      internalLength: 1,
      internalWidth: 0.6,
      height: 1,
      wallThickness: 0.14,
      blockWidthCm: 14,
      blockHeightCm: 19,
      blockLengthCm: 39,
      horizontalJointCm: 1,
      verticalJointCm: 1,
      channelLengthCm: 39,
      channelRows: 1,
      loss: 10,
    },
    pv: {
      quantity: 3,
      internalLength: 1,
      internalWidth: 1,
      height: 1,
      wallThickness: 0.14,
      blockWidthCm: 14,
      blockHeightCm: 19,
      blockLengthCm: 39,
      horizontalJointCm: 1,
      verticalJointCm: 1,
      channelLengthCm: 39,
      channelRows: 1,
      loss: 10,
    },
    pipes: [
      { diameter: "DN 400", extension: 36, commercialLength: 6, loss: 0 },
      { diameter: "DN 600", extension: 140, commercialLength: 6, loss: 0 },
    ],
    pavement: {
      length: 150,
      width: 7,
      effectiveArea: 150,
      bedThicknessCm: 5,
      baseThicknessCm: 15,
      interlockingCoefficient: 14.13,
    },
    gutter: {
      length: 100,
      width: 0.3,
      thickness: 0.1,
      loss: 10,
    },
    adopted: {},
    complete: false,
  };
  const savedPipes = Array.isArray(saved.pipes) ? saved.pipes : [];
  return {
    ...defaults,
    ...saved,
    project: { ...defaults.project, ...(saved.project || {}) },
    services: { ...defaults.services, ...(saved.services || {}) },
    bl: { ...defaults.bl, ...(saved.bl || {}) },
    pv: { ...defaults.pv, ...(saved.pv || {}) },
    pipes: defaults.pipes.map((pipe, index) => ({ ...pipe, ...(savedPipes[index] || {}) })),
    pavement: { ...defaults.pavement, ...(saved.pavement || {}) },
    gutter: { ...defaults.gutter, ...(saved.gutter || {}) },
    adopted: saved.adopted && typeof saved.adopted === "object" ? saved.adopted : {},
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
        organization: state.cota.organization || state.correspondence.organization,
        department: state.cota.department || state.correspondence.department,
        technicalOpinionCity: state.report.city,
        onePerPage: state.report.onePerPage,
        memorandumCity: state.correspondence.kind === "memorando" ? state.correspondence.place : (persisted.memorandumCity || "Bertioga"),
        notificationCity: state.notification.city,
        warningCity: state.warning.city,
      };
      localStorage.setItem("docflow-preferences", JSON.stringify(preferences));
      localStorage.setItem("docflow-drainage-draft", JSON.stringify({ ...state.drainage, complete: false }));
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

function renderReportSignatureChoices() {
  const profiles = sortedSignatureProfiles();
  const selectedProfileIds = new Set(
    state.report.responsibles.map((signature) => signature.profileId).filter(Boolean),
  );
  if (state.signatures.loading) {
    return '<div class="report-signature-choices signature-profile-state" data-report-signature-group><strong>Carregando assinaturas…</strong><span>Aguarde para selecionar as pessoas que assinarão o parecer.</span></div>';
  }
  if (state.signatures.error) {
    return '<div class="report-signature-choices signature-profile-state is-error" data-report-signature-group><strong>Não foi possível carregar as assinaturas</strong><span>' +
      e(state.signatures.error) +
      '</span><button class="button button-secondary" type="button" data-action="reload-signatures">Tentar novamente</button></div>';
  }
  if (!profiles.length) {
    return '<div class="report-signature-choices signature-profile-state" data-report-signature-group><strong>Nenhuma assinatura cadastrada</strong><span>Cadastre as pessoas e depois marque todas as que assinarão este parecer.</span></div>';
  }
  const choices = profiles.map((profile) =>
    '<label class="report-signature-choice"><input type="checkbox" data-report-signature-choice="' +
    e(profile.id) +
    '" ' +
    (selectedProfileIds.has(profile.id) ? "checked" : "") +
    ' /><span><strong>' +
    e(profile.name) +
    '</strong><em>' +
    e(profile.role) +
    '</em></span></label>'
  ).join("");
  return '<fieldset class="report-signature-choices" data-report-signature-group><legend>Selecione uma ou mais pessoas *</legend><p>Marque todas as pessoas que deverão aparecer na área de assinaturas do Word.</p><div class="report-signature-choice-grid">' +
    choices +
    '</div></fieldset>';
}

function renderEtpSignatureChoices() {
  const profiles = sortedSignatureProfiles();
  const selectedProfileIds = new Set(
    state.etp.responsibles.map((signature) => signature.profileId).filter(Boolean),
  );
  if (state.signatures.loading) {
    return '<div class="report-signature-choices signature-profile-state" data-etp-signature-group><strong>Carregando assinaturas…</strong><span>Aguarde para selecionar os responsáveis pelo ETP.</span></div>';
  }
  if (state.signatures.error) {
    return '<div class="report-signature-choices signature-profile-state is-error" data-etp-signature-group><strong>Não foi possível carregar as assinaturas</strong><span>' +
      e(state.signatures.error) +
      '</span><button class="button button-secondary" type="button" data-action="reload-signatures">Tentar novamente</button></div>';
  }
  if (!profiles.length) {
    return '<div class="report-signature-choices signature-profile-state" data-etp-signature-group><strong>Nenhuma assinatura cadastrada</strong><span>Cadastre as pessoas e depois marque quem assinará o ETP.</span></div>';
  }
  const choices = profiles.map((profile) =>
    '<label class="report-signature-choice"><input type="checkbox" data-etp-signature-choice="' +
    e(profile.id) +
    '" ' +
    (selectedProfileIds.has(profile.id) ? "checked" : "") +
    ' /><span><strong>' +
    e(profile.name) +
    '</strong><em>' +
    e(profile.role) +
    '</em></span></label>'
  ).join("");
  return '<fieldset class="report-signature-choices" data-etp-signature-group><legend>Selecione uma ou mais pessoas *</legend><p>As assinaturas aparecerão no final do documento, no padrão do ETP de referência.</p><div class="report-signature-choice-grid">' +
    choices +
    '</div></fieldset>';
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
      showToast("Essa assinatura já foi adicionada ao parecer.");
      return;
    }
    state.report.responsibles.push({ profileId: profile.id, name: profile.name, role: profile.role });
  } else if (target.type === "etp") {
    if (state.etp.responsibles.some((item) => item.profileId === profile.id)) {
      showToast("Essa assinatura já foi adicionada ao ETP.");
      return;
    }
    state.etp.responsibles.push({ profileId: profile.id, name: profile.name, role: profile.role });
  } else if (target.type === "cota") {
    state.cota.signerProfileId = profile.id;
    state.cota.signer = profile.name;
    state.cota.signerRole = profile.role;
  } else if (target.type === "tr") {
    state.tr.signerProfileId = profile.id;
    state.tr.signerName = profile.name;
    state.tr.signerRole = profile.role;
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
  state.etp.responsibles = state.etp.responsibles.map((item) =>
    item.profileId === profile.id ? { profileId: profile.id, name: profile.name, role: profile.role } : item,
  );
  if (state.cota.signerProfileId === profile.id) {
    state.cota.signer = profile.name;
    state.cota.signerRole = profile.role;
  }
  if (state.tr.signerProfileId === profile.id) {
    state.tr.signerName = profile.name;
    state.tr.signerRole = profile.role;
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
    state.etp.responsibles = state.etp.responsibles.map((item) =>
      item.profileId === profile.id ? { ...item, profileId: "" } : item,
    );
    if (state.cota.signerProfileId === profile.id) state.cota.signerProfileId = "";
    if (state.tr.signerProfileId === profile.id) state.tr.signerProfileId = "";
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
    : select.dataset.signatureTarget === "tr"
      ? { type: "tr" }
    : select.dataset.signatureTarget === "correspondence"
      ? { type: "correspondence" }
      : { type: "notice", signatoryId: select.dataset.id };
  if (select.value === OTHER_SIGNATURE_VALUE) {
    if (target.type === "cota") select.value = state.cota.signerProfileId;
    else if (target.type === "tr") select.value = state.tr.signerProfileId;
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
  state.auth.cardAccess = normalizeCardAccess(payload.cards);
  state.signatures = createSignatureConfigurationState();
  state.admin = createAdminState();
  state.processes = createProcessesState();
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
  replaceNavigationState();
  loadSignatureProfiles();
  loadDocumentHistory();
  loadKanbanNotifications({ silent: true });
  startNotificationPolling();
  if (isAdmin) loadAdminUsers({ silent: true });
}

function showAuthGate(view = "login") {
  state.auth.user = null;
  state.auth.cardAccess = normalizeCardAccess();
  state.signatures = createSignatureConfigurationState();
  state.admin = createAdminState();
  state.processes = createProcessesState();
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
  replaceNavigationState({ view: "auth" });
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

async function refreshCurrentCardAccess() {
  if (!state.auth.user) return;
  try {
    const account = await apiRequest("/api/auth/session");
    const nextAccess = normalizeCardAccess(account.cards);
    const changed = HOME_CARD_OPTIONS.some(
      (card) => nextAccess[card.key] !== state.auth.cardAccess?.[card.key],
    );
    if (!changed) return;
    state.auth.cardAccess = nextAccess;
    if (!state.flow && !state.admin.open && !state.processes.open && !state.history.open && !state.kanban.open) render();
  } catch {
    // A próxima navegação ou atualização da página repetirá a verificação da sessão.
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
  const onDocuments = !state.admin.open && !state.processes.open && !state.history.open && !state.kanban.open;
  [
    [elements.kanbanButton, state.kanban.open],
    [elements.processesButton, state.processes.open],
    [elements.documentsButton, onDocuments],
    [elements.adminButton, state.admin.open],
    [elements.historyButton, state.history.open],
  ].forEach(([button, active]) => {
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-current", active ? "page" : "false");
  });
  elements.main.classList.toggle("is-home", !state.admin.open && !state.processes.open && !state.history.open && !state.kanban.open && !state.flow);
  elements.main.classList.toggle("is-kanban", state.kanban.open);
  if (state.processes.open) {
    elements.sidebar.classList.add("is-hidden");
    elements.actionBar.classList.add("is-hidden");
    elements.view.className = "view home-view processes-view";
    elements.view.innerHTML = renderProcesses();
    return;
  }
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
    filterHomeDocuments();
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
    elements.view.innerHTML = state.flow === "drainage"
      ? renderDrainage()
      : state.flow === "report"
        ? renderReport()
      : state.flow === "etp"
        ? renderEtp()
      : state.flow === "tr"
        ? renderTr()
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
  if (state.flow === "drainage") return state.drainage;
  if (state.flow === "report") return state.report;
  if (state.flow === "etp") return state.etp;
  if (state.flow === "tr") return state.tr;
  if (state.flow === "cota") return state.cota;
  if (isNoticeFlow()) return noticeState();
  return state.correspondence;
}

function currentSteps() {
  if (state.flow === "drainage") return DRAINAGE_STEPS;
  if (state.flow === "report") return REPORT_STEPS;
  if (state.flow === "etp") return ETP_STEPS;
  if (state.flow === "tr") return TR_STEPS;
  if (state.flow === "cota") return COTA_STEPS;
  if (state.flow === "notification") return NOTIFICATION_STEPS;
  if (state.flow === "warning") return WARNING_STEPS;
  if (isOfficialCorrespondenceFlow()) return OFFICIAL_CORRESPONDENCE_STEPS;
  return CORRESPONDENCE_STEPS;
}

function renderSidebar() {
  if (state.flow === "drainage") {
    elements.flowEyebrow.textContent = "Engenharia de drenagem";
    elements.flowTitle.textContent = "Monte o quantitativo";
    elements.flowDescription.textContent = "Informe a geometria e confira cálculo, valor adotado e memória.";
  } else if (state.flow === "report") {
    elements.flowEyebrow.textContent = "Parecer técnico";
    elements.flowTitle.textContent = "Prepare a vistoria";
    elements.flowDescription.textContent = "Preencha o modelo, anexe o mapa e organize as evidências.";
  } else if (state.flow === "etp") {
    elements.flowEyebrow.textContent = "Estudo Técnico Preliminar";
    elements.flowTitle.textContent = "Estruture o ETP";
    elements.flowDescription.textContent = "Preencha as 14 seções e gere o Word no modelo oficial.";
  } else if (state.flow === "tr") {
    elements.flowEyebrow.textContent = "Termo de Referência";
    elements.flowTitle.textContent = "Prepare o TR";
    elements.flowDescription.textContent = "Atualize somente os trechos variáveis do modelo oficial.";
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
    ? state.flow === "drainage"
      ? `Baixar Excel <span aria-hidden="true">↓</span>`
      : `Gerar documento <span aria-hidden="true">↓</span>`
    : `Continuar <span aria-hidden="true">→</span>`;
  elements.actionHint.textContent = lastStep
    ? state.flow === "drainage" ? "Planilha técnica com 7 abas" : "Pronto para criar o arquivo"
    : `Etapa ${state.step + 1} de ${currentSteps().length}`;
}

function normalizeCardAccess(value = {}) {
  return Object.fromEntries(
    HOME_CARD_OPTIONS.map((card) => [card.key, value?.[card.key] !== false]),
  );
}

function canAccessHomeCard(cardKey) {
  if (state.auth.user?.isAdmin) return true;
  return HOME_CARD_OPTIONS.some((card) => card.key === cardKey)
    && state.auth.cardAccess?.[cardKey] !== false;
}

function homeCardVisibilityAttribute(cardKey) {
  return canAccessHomeCard(cardKey) ? "" : 'hidden aria-hidden="true"';
}

function recentDocumentDate(unixSeconds) {
  const date = new Date(Number(unixSeconds) * 1000);
  if (Number.isNaN(date.getTime())) return "Data não informada";
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfToday.getDate() - 1);
  if (date >= startOfToday) return "Hoje";
  if (date >= startOfYesterday) return "Ontem";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date);
}

function lucideIcon(name) {
  return '<svg class="lucide-icon" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-' + name + '"></use></svg>';
}

function renderRecentDocuments() {
  const history = state.history;
  const content = history.error
    ? `<p class="recent-state">Não foi possível carregar os documentos recentes.</p>`
    : !history.loaded
      ? `<p class="recent-state">Carregando documentos recentes…</p>`
      : history.items.length
        ? `<div class="recent-list">${history.items.slice(0, 3).map((item, index) => `
          <button class="recent-item recent-tone-${index + 1}" type="button" data-action="preview-history-pdf" data-id="${e(item.id)}" title="Visualizar ${e(item.filename)}">
            <span class="recent-icon" aria-hidden="true">${lucideIcon("file-text")}</span>
            <span class="recent-copy"><strong>${e(item.filename.replace(/\.(docx|doc)$/i, ""))}</strong><small>${e(recentDocumentDate(item.createdAt))}</small></span>
          </button>`).join("")}</div>`
        : `<p class="recent-state">Os documentos que você gerar aparecerão aqui.</p>`;
  return `<aside class="recent-panel" aria-label="Documentos recentes">
    <div class="recent-heading"><h2>${lucideIcon("clock-3")} Recentes</h2><button type="button" data-action="show-history">Ver todos <span aria-hidden="true">→</span></button></div>
    ${content}
  </aside>`;
}

function filterHomeDocuments() {
  const query = homeSearchQuery.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
  const cards = [...document.querySelectorAll(".document-grid [data-card-key]")];
  let visible = 0;
  cards.forEach((card) => {
    const searchableText = card.textContent.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
    card.hidden = !canAccessHomeCard(card.dataset.cardKey) || (query && !searchableText.includes(query));
    if (!card.hidden) visible += 1;
  });
  const empty = document.querySelector("#homeSearchEmpty");
  if (empty) empty.hidden = !query || visible > 0;
}

function renderHome() {
  return `<section class="document-section">
    <div class="documents-overview">
      <div class="documents-intro">
        <span class="eyebrow eyebrow-dark">Documentos</span>
        <h1>Documentos</h1>
        <p>Gere documentos técnicos e administrativos utilizando os modelos oficiais.</p>
      </div>
      ${renderRecentDocuments()}
    </div>
    <label class="document-search" for="homeDocumentSearch">
      ${lucideIcon("search")}
      <input id="homeDocumentSearch" type="search" autocomplete="off" placeholder="Buscar documento..." value="${e(homeSearchQuery)}" aria-label="Buscar tipos de documento" />
      <kbd aria-hidden="true">Ctrl K</kbd>
    </label>
    <div class="document-grid">
      <article class="document-card" tabindex="0" role="button" ${homeCardVisibilityAttribute("report")} data-card-key="report" data-action="start-report">
        <span class="card-status is-ready">Pronto</span>
        <span class="card-number" aria-hidden="true">01</span><span class="card-icon" aria-hidden="true">${lucideIcon("clipboard-check")}</span>
        <h3>Parecer técnico</h3>
        <p>Registre uma vistoria e gere o parecer oficial.</p>
        <span class="card-link">Criar parecer <span aria-hidden="true">→</span></span>
      </article>
      <article class="document-card is-etp" tabindex="0" role="button" ${homeCardVisibilityAttribute("etp")} data-card-key="etp" data-action="start-etp">
        <span class="card-status is-ready">Pronto</span>
        <span class="card-number" aria-hidden="true">02</span><span class="card-icon" aria-hidden="true">${lucideIcon("list-checks")}</span>
        <h3>Estudo Técnico Preliminar</h3>
        <p>Preencha as 14 seções e gere o ETP timbrado.</p>
        <span class="card-link">Criar ETP <span aria-hidden="true">→</span></span>
      </article>
      <article class="document-card is-tr" tabindex="0" role="button" ${homeCardVisibilityAttribute("tr")} data-card-key="tr" data-action="start-tr">
        <span class="card-status is-ready">Pronto</span>
        <span class="card-number" aria-hidden="true">03</span><span class="card-icon" aria-hidden="true">${lucideIcon("file-text")}</span>
        <h3>Termo de Referência</h3>
        <p>Atualize os trechos variáveis e gere o TR no modelo oficial.</p>
        <span class="card-link">Criar TR <span aria-hidden="true">→</span></span>
      </article>
      <article class="document-card is-cota" tabindex="0" role="button" ${homeCardVisibilityAttribute("cota")} data-card-key="cota" data-action="start-cota">
        <span class="card-status is-ready">Pronto</span>
        <span class="card-number" aria-hidden="true">04</span><span class="card-icon" aria-hidden="true">${lucideIcon("notebook-pen")}</span>
        <h3>Folha de cota</h3>
        <p>Converta anotações em folha pautada.</p>
        <span class="card-link">Preparar folha <span aria-hidden="true">→</span></span>
      </article>
      <article class="document-card is-admin" tabindex="0" role="button" ${homeCardVisibilityAttribute("memorando")} data-card-key="memorando" data-action="start-correspondence" data-kind="memorando">
        <span class="card-status is-ready">Pronto</span>
        <span class="card-number" aria-hidden="true">05</span><span class="card-icon" aria-hidden="true">${lucideIcon("file-text")}</span>
        <h3>Memorando</h3>
        <p>Gere memorandos no padrão oficial.</p>
        <span class="card-link">Criar memorando <span aria-hidden="true">→</span></span>
      </article>
      <article class="document-card is-admin" tabindex="0" role="button" ${homeCardVisibilityAttribute("oficio")} data-card-key="oficio" data-action="start-correspondence" data-kind="oficio">
        <span class="card-status is-ready">Pronto</span>
        <span class="card-number" aria-hidden="true">06</span><span class="card-icon" aria-hidden="true">${lucideIcon("send")}</span>
        <h3>Ofício</h3>
        <p>Crie ofícios no modelo da Prefeitura.</p>
        <span class="card-link">Criar ofício <span aria-hidden="true">→</span></span>
      </article>
      <article class="document-card is-alert" tabindex="0" role="button" ${homeCardVisibilityAttribute("notification")} data-card-key="notification" data-action="start-notification">
        <span class="card-status is-ready">Pronto</span>
        <span class="card-number" aria-hidden="true">07</span><span class="card-icon" aria-hidden="true">${lucideIcon("bell-ring")}</span>
        <h3>Notificação</h3>
        <p>Emita notificações com texto e anexos.</p>
        <span class="card-link">Criar notificação <span aria-hidden="true">→</span></span>
      </article>
      <article class="document-card is-alert" tabindex="0" role="button" ${homeCardVisibilityAttribute("warning")} data-card-key="warning" data-action="start-warning">
        <span class="card-status is-ready">Pronto</span>
        <span class="card-number" aria-hidden="true">08</span><span class="card-icon" aria-hidden="true">${lucideIcon("triangle-alert")}</span>
        <h3>Advertência</h3>
        <p>Gere advertências padronizadas.</p>
        <span class="card-link">Criar advertência <span aria-hidden="true">→</span></span>
      </article>
    </div>
    <div id="homeSearchEmpty" class="home-search-empty" hidden>Nenhum tipo de documento encontrado.</div>
    ${HOME_CARD_OPTIONS.some((card) => canAccessHomeCard(card.key)) ? "" : `<div class="home-access-empty">
      <span aria-hidden="true">○</span>
      <strong>Nenhum card está liberado para sua conta</strong>
      <p>Solicite ao administrador a liberação das ferramentas que você precisa utilizar.</p>
    </div>`}
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
      <div><span class="eyebrow eyebrow-dark">Acesso restrito</span><h2>Administração de usuários</h2><p>Revise cadastros, acompanhe o último acesso e escolha quais cards cada pessoa poderá utilizar.</p></div>
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
  const cardAccess = normalizeCardAccess(user.cardAccess);
  const enabledCards = HOME_CARD_OPTIONS.filter((card) => cardAccess[card.key]).length;
  const accessPanel = user.status === "approved" && !user.isAdmin
    ? `<div class="admin-card-access">
        <div class="admin-card-access-heading">
          <div><strong>Cards visíveis para este usuário</strong><span>Ative ou desative cada ferramenta da página inicial.</span></div>
          <b>${enabledCards} de ${HOME_CARD_OPTIONS.length} liberados</b>
        </div>
        <div class="admin-card-access-options">
          ${HOME_CARD_OPTIONS.map((card) => `<label class="admin-card-toggle">
            <span class="admin-card-mark" aria-hidden="true">${e(card.mark)}</span>
            <span class="admin-card-label">${e(card.label)}</span>
            <input type="checkbox" role="switch" data-admin-card-user="${e(user.id)}" data-admin-card-key="${e(card.key)}" ${cardAccess[card.key] ? "checked" : ""} ${disabled} aria-label="Liberar ${e(card.label)} para ${e(user.name)}" />
            <span class="admin-card-switch" aria-hidden="true"></span>
          </label>`).join("")}
        </div>
      </div>`
    : "";
  return `<article class="admin-user-item">
    <span class="admin-user-avatar" aria-hidden="true">${e(String(user.name || user.email || "U").slice(0, 1).toUpperCase())}</span>
    <div class="admin-user-copy">
      <div class="admin-user-title"><strong>${e(user.name)}</strong><span class="admin-status is-${e(user.isAdmin ? "admin" : user.status)}">${e(statusLabel)}</span></div>
      <span>${e(user.email)}</span>
      <small>Solicitação: ${e(formatHistoryDate(user.createdAt))} • Último acesso: ${e(user.lastLoginAt ? formatHistoryDate(user.lastLoginAt) : "Ainda não acessou")}</small>
    </div>
    ${actions}
    ${accessPanel}
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
  state.processes.open = false;
  state.kanban.open = false;
  state.admin.open = true;
  render();
  pushNavigationState();
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

async function setAdminUserCardAccess(userId, cardKey, enabled) {
  const user = state.admin.users.find((item) => item.id === userId);
  if (!state.auth.user?.isAdmin || !user || user.isAdmin || user.status !== "approved" || state.admin.busy.has(userId)) return;
  if (!HOME_CARD_OPTIONS.some((card) => card.key === cardKey)) return;

  const previousAccess = normalizeCardAccess(user.cardAccess);
  state.admin.busy.set(userId, `card:${cardKey}`);
  state.admin.error = "";
  state.admin.users = state.admin.users.map((item) => item.id === userId
    ? { ...item, cardAccess: { ...previousAccess, [cardKey]: enabled } }
    : item);
  if (state.admin.open) render();

  try {
    const payload = await apiRequest(`/api/admin/users/${encodeURIComponent(userId)}/cards`, {
      method: "PATCH",
      body: { cardKey, enabled },
    });
    state.admin.users = state.admin.users.map((item) => item.id === userId
      ? { ...item, cardAccess: normalizeCardAccess(payload.cardAccess) }
      : item);
    const card = HOME_CARD_OPTIONS.find((item) => item.key === cardKey);
    showToast(`${card?.label || "Card"} ${enabled ? "liberado" : "ocultado"} para ${user.name}.`);
  } catch (error) {
    state.admin.users = state.admin.users.map((item) => item.id === userId
      ? { ...item, cardAccess: previousAccess }
      : item);
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

function renderProcesses() {
  const processes = state.processes;
  const isAdmin = Boolean(state.auth.user?.isAdmin);
  const errorNotice = processes.error
    ? `<div class="notice is-warning"><span aria-hidden="true">!</span><span>${e(processes.error)}</span></div>`
    : "";
  const content = processes.loading && !processes.loaded
    ? `<div class="processes-state"><span class="history-spinner" aria-hidden="true"></span><strong>Carregando cartilhas…</strong></div>`
    : processes.items.length
      ? `<div class="process-guide-grid">${processes.items.map(renderProcessGuide).join("")}</div>`
      : `<div class="processes-state"><span class="processes-empty-icon" aria-hidden="true">▤</span><strong>Nenhum processo cadastrado</strong><span>${isAdmin ? "Cadastre a primeira cartilha para orientar a equipe." : "O administrador ainda não publicou uma cartilha."}</span>${isAdmin ? '<button class="button button-primary" type="button" data-action="add-process-guide">+ Novo processo</button>' : ""}</div>`;

  return `<section class="document-section processes-section">
    <div class="processes-heading">
      <div><span class="eyebrow eyebrow-dark">Cartilha de apoio</span><h2>Mural</h2><p>Consulte os documentos, justificativas e links necessários antes de formalizar uma solicitação.</p></div>
      <div class="processes-heading-actions">
        <button class="button button-secondary" type="button" data-action="home">← Voltar</button>
        <button class="button button-secondary" type="button" data-action="refresh-processes" ${processes.loading ? "disabled" : ""}>Atualizar</button>
        ${isAdmin ? '<button class="button button-primary" type="button" data-action="add-process-guide">+ Novo processo</button>' : ""}
      </div>
    </div>
    <div class="processes-intro"><span aria-hidden="true">✓</span><p><strong>Informação para toda a equipe</strong>Confira cada item e abra os sites oficiais indicados. Somente o administrador pode alterar as cartilhas.</p></div>
    ${errorNotice}
    ${content}
  </section>`;
}

function renderProcessGuide(process) {
  const isAdmin = Boolean(state.auth.user?.isAdmin);
  const busy = state.processes.busy.get(process.id) || "";
  const links = Array.isArray(process.links) ? process.links.filter((link) => processGuideHref(link.url)) : [];
  return `<article class="process-guide-card">
    <header class="process-guide-header">
      <span class="process-guide-mark" aria-hidden="true">▤</span>
      <div><span class="eyebrow eyebrow-dark">Orientação de processo</span><h3>${e(process.title)}</h3><p>${e(process.summary)}</p></div>
      ${isAdmin ? `<div class="process-guide-admin-actions"><button class="button button-quiet" type="button" data-action="edit-process-guide" data-id="${e(process.id)}" ${busy ? "disabled" : ""}>Editar</button><button class="button button-quiet button-danger" type="button" data-action="delete-process-guide" data-id="${e(process.id)}" ${busy ? "disabled" : ""}>${busy === "delete" ? "Excluindo…" : "Excluir"}</button></div>` : ""}
    </header>
    <section class="process-guide-block" aria-labelledby="process-checklist-${e(process.id)}">
      <h4 id="process-checklist-${e(process.id)}">Documentos e orientações</h4>
      <ol class="process-guide-checklist">${(process.checklist || []).map((item) => `<li><span aria-hidden="true">✓</span><p>${e(item)}</p></li>`).join("")}</ol>
    </section>
    ${links.length ? `<section class="process-guide-block process-guide-links" aria-labelledby="process-links-${e(process.id)}"><h4 id="process-links-${e(process.id)}">Links oficiais e consultas</h4><div>${links.map((link) => `<a href="${e(processGuideHref(link.url))}" target="_blank" rel="noopener noreferrer"><span>${e(link.label)}</span><strong>Abrir site ↗</strong></a>`).join("")}</div></section>` : ""}
    <footer>Atualizado em ${e(formatHistoryDate(process.updatedAt))}</footer>
  </article>`;
}

function processGuideHref(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch {
    return "";
  }
}

async function loadProcesses() {
  if (!state.auth.user || state.processes.loading) return;
  state.processes.loading = true;
  state.processes.error = "";
  if (state.processes.open) render();
  try {
    const payload = await apiRequest("/api/processes");
    state.processes.items = Array.isArray(payload.processes) ? payload.processes : [];
    state.processes.loaded = true;
  } catch (error) {
    state.processes.error = error.message;
  } finally {
    state.processes.loading = false;
    if (state.processes.open) render();
  }
}

function showProcesses() {
  state.flow = null;
  state.admin.open = false;
  state.history.open = false;
  state.kanban.open = false;
  state.processes.open = true;
  render();
  pushNavigationState();
  focusMain();
  if (!state.processes.loaded) loadProcesses();
}

function setProcessGuideFeedback(message, kind = "error") {
  elements.processGuideFeedback.textContent = message;
  elements.processGuideFeedback.className = `inline-feedback${message ? "" : " is-hidden"}${kind === "error" ? " is-error" : ""}`;
}

function openProcessGuideDialog(processId = "") {
  if (!state.auth.user?.isAdmin) return;
  const process = state.processes.items.find((item) => item.id === processId);
  elements.processGuideForm.reset();
  elements.processGuideId.value = process?.id || "";
  elements.processGuideFormTitle.textContent = process ? "Editar processo" : "Novo processo";
  elements.processGuideTitle.value = process?.title || "";
  elements.processGuideSummary.value = process?.summary || "";
  elements.processGuideChecklist.value = Array.isArray(process?.checklist) ? process.checklist.join("\n") : "";
  elements.processGuideLinks.value = Array.isArray(process?.links)
    ? process.links.map((link) => `${link.label} | ${link.url}`).join("\n")
    : "";
  elements.saveProcessGuideButton.textContent = process ? "Salvar alterações" : "Salvar processo";
  setProcessGuideFeedback("");
  openDialog(elements.processGuideDialog);
  setTimeout(() => elements.processGuideTitle.focus(), 50);
}

function closeProcessGuideDialog() {
  if (state.processes.saving) return;
  closeDialog(elements.processGuideDialog);
  setProcessGuideFeedback("");
}

function processGuideLinksFromInput(value) {
  const lines = String(value || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const links = [];
  for (const line of lines) {
    const separator = line.indexOf("|");
    if (separator < 1) return null;
    const label = line.slice(0, separator).trim();
    const url = processGuideHref(line.slice(separator + 1).trim());
    if (!label || !url) return null;
    links.push({ label, url });
  }
  return links;
}

async function saveProcessGuide() {
  if (!state.auth.user?.isAdmin || state.processes.saving) return;
  const id = elements.processGuideId.value;
  const checklist = elements.processGuideChecklist.value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  const links = processGuideLinksFromInput(elements.processGuideLinks.value);
  if (!elements.processGuideTitle.value.trim() || elements.processGuideSummary.value.trim().length < 10 || !checklist.length) {
    setProcessGuideFeedback("Preencha o nome, o resumo e pelo menos um documento ou orientação.");
    return;
  }
  if (!links) {
    setProcessGuideFeedback("Revise os links. Use uma linha por item no formato: Nome do site | endereço.");
    return;
  }

  state.processes.saving = true;
  elements.saveProcessGuideButton.disabled = true;
  elements.saveProcessGuideButton.textContent = "Salvando…";
  setProcessGuideFeedback("");
  try {
    const payload = await apiRequest(id ? `/api/processes/${encodeURIComponent(id)}` : "/api/processes", {
      method: id ? "PATCH" : "POST",
      body: {
        title: elements.processGuideTitle.value.trim(),
        summary: elements.processGuideSummary.value.trim(),
        checklist,
        links,
      },
    });
    const saved = payload.process;
    state.processes.items = id
      ? state.processes.items.map((item) => item.id === id ? saved : item)
      : [...state.processes.items, saved];
    state.processes.items.sort((left, right) => Number(right.updatedAt || 0) - Number(left.updatedAt || 0) || String(left.title).localeCompare(String(right.title), "pt-BR"));
    closeDialog(elements.processGuideDialog);
    render();
    showToast(id ? "Processo atualizado." : "Processo publicado para a equipe.");
  } catch (error) {
    setProcessGuideFeedback(error.message);
  } finally {
    state.processes.saving = false;
    elements.saveProcessGuideButton.disabled = false;
    elements.saveProcessGuideButton.textContent = id ? "Salvar alterações" : "Salvar processo";
  }
}

function confirmProcessGuideDeletion(processId) {
  const process = state.processes.items.find((item) => item.id === processId);
  if (!process || !state.auth.user?.isAdmin) return;
  showMessage({
    title: "Excluir esta cartilha?",
    text: `O processo “${process.title}” deixará de aparecer para toda a equipe. Esta ação não pode ser desfeita.`,
    kind: "error",
    actions: [
      { label: "Cancelar" },
      { label: "Excluir cartilha", danger: true, onClick: () => deleteProcessGuide(processId) },
    ],
  });
}

async function deleteProcessGuide(processId) {
  if (!state.auth.user?.isAdmin || state.processes.busy.has(processId)) return;
  state.processes.busy.set(processId, "delete");
  render();
  try {
    await apiRequest(`/api/processes/${encodeURIComponent(processId)}`, { method: "DELETE" });
    state.processes.items = state.processes.items.filter((item) => item.id !== processId);
    showToast("Processo excluído.");
  } catch (error) {
    state.processes.error = error.message;
  } finally {
    state.processes.busy.delete(processId);
    render();
  }
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
    if (state.history.open || (!state.flow && !state.admin.open && !state.processes.open && !state.kanban.open)) render();
  }
}

function showDocumentHistory() {
  state.flow = null;
  state.admin.open = false;
  state.processes.open = false;
  state.kanban.open = false;
  state.history.open = true;
  render();
  pushNavigationState();
  focusMain();
  if (!state.history.loaded) loadDocumentHistory();
}

const KANBAN_COLUMNS = [
  { id: "todo", label: "A fazer", description: "Atividades que ainda não começaram" },
  { id: "doing", label: "Em andamento", description: "Atividades em execução" },
  { id: "done", label: "Concluído", description: "Atividades finalizadas" },
];

const KANBAN_PRIORITIES = [
  { id: "high", label: "Alta", className: "is-high" },
  { id: "medium", label: "Média", className: "is-medium" },
  { id: "low", label: "Baixa", className: "is-low" },
];

const KANBAN_PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

function renderKanban() {
  const kanban = state.kanban;
  const loading = kanban.loading && !kanban.loaded;
  const error = kanban.error
    ? `<div class="notice is-warning"><span aria-hidden="true">!</span><span>${e(kanban.error)}</span></div>`
    : "";
  if (loading) {
    return `<section class="document-section kanban-section"><div class="kanban-loading"><span class="history-spinner" aria-hidden="true"></span><strong>Carregando seus quadros…</strong></div></section>`;
  }

  const board = kanban.board;
  const main = board
    ? `<div class="kanban-main-panel">
        <div class="kanban-heading">
          <div>
            <span class="eyebrow eyebrow-dark">${board.isOwner ? "Quadro criado por você" : "Quadro compartilhado com você"}</span>
            <h2>${e(board.name)}</h2>
            <p>${board.description ? e(board.description) : "Organize as atividades, mova os cartões e acompanhe cada alteração com transparência."}</p>
          </div>
          <div class="kanban-heading-actions">
            <button class="button button-secondary" type="button" data-action="refresh-kanban" ${kanban.loading ? "disabled" : ""}>Atualizar</button>
            ${board.isOwner ? `<button class="button button-secondary" type="button" data-action="edit-kanban-board">Renomear quadro</button>
            <button class="button button-secondary button-danger" type="button" data-action="delete-kanban-board">Excluir quadro</button>` : ""}
            <button class="button button-primary" type="button" data-action="add-kanban-card" ${kanban.loading || !board.canEdit ? "disabled" : ""}>+ Novo cartão</button>
          </div>
        </div>
        <div class="kanban-member-strip" aria-label="Participantes do quadro">
          <div class="kanban-member-avatars">${board.members.slice(0, 6).map((person) => `<span title="${e(person.name)} — ${e(person.email)}">${e(personInitials(person.name))}</span>`).join("")}${board.members.length > 6 ? `<span>+${board.members.length - 6}</span>` : ""}</div>
          <span>${board.members.length} participante${board.members.length === 1 ? "" : "s"} com acesso</span>
          <strong>Somente membros deste quadro podem visualizar e editar</strong>
        </div>
        <div class="kanban-summary" aria-label="Resumo do quadro">
          <article><span>Total</span><strong data-kanban-summary="total">${kanban.cards.length}</strong></article>
          ${KANBAN_COLUMNS.map((column) => `<article><span>${e(column.label)}</span><strong data-kanban-summary="${e(column.id)}">${kanban.cards.filter((card) => card.status === column.id).length}</strong></article>`).join("")}
        </div>
        ${error}
        <div class="kanban-board" aria-label="Quadro Kanban">
          ${KANBAN_COLUMNS.map((column) => renderKanbanColumn(column)).join("")}
        </div>
      </div>`
    : `<div class="kanban-main-panel kanban-empty-board">
        ${error}
        <span class="kanban-empty-icon" aria-hidden="true">▦</span>
        <span class="eyebrow eyebrow-dark">Seu espaço de trabalho</span>
        <h2>Crie seu primeiro quadro</h2>
        <p>Defina um nome e escolha exatamente quem poderá visualizar e editar os cartões.</p>
        <button class="button button-primary" type="button" data-action="add-kanban-board">+ Novo quadro</button>
      </div>`;

  return `<section class="document-section kanban-section">
    <div class="kanban-workspace">
      ${renderKanbanBoardSidebar()}
      ${main}
    </div>
  </section>`;
}

function renderKanbanBoardSidebar() {
  const kanban = state.kanban;
  return `<aside class="kanban-board-sidebar">
    <button class="kanban-sidebar-back" type="button" data-action="home">← Voltar ao início</button>
    <div class="kanban-sidebar-heading"><div><span class="eyebrow eyebrow-dark">Kanban</span><h3>Meus quadros</h3></div><button type="button" data-action="add-kanban-board" aria-label="Criar novo quadro">+</button></div>
    <nav class="kanban-board-list" aria-label="Quadros disponíveis">
      ${kanban.boards.length
        ? kanban.boards.map((board) => `<div class="kanban-board-list-item${board.id === kanban.activeBoardId ? " is-active" : ""}"><button class="kanban-board-link${board.id === kanban.activeBoardId ? " is-active" : ""}" type="button" data-action="select-kanban-board" data-id="${e(board.id)}" aria-current="${board.id === kanban.activeBoardId ? "page" : "false"}"><span class="kanban-board-link-icon" aria-hidden="true">▥</span><span><strong>${e(board.name)}</strong><small>${board.isOwner ? "Criado por você" : `Compartilhado por ${e(board.createdBy?.name || "outro usuário")}`}</small></span><em>${board.cardCount}</em></button><button class="kanban-board-history-button" type="button" data-action="open-kanban-history" data-id="${e(board.id)}" aria-label="Ver histórico do quadro ${e(board.name)}" title="Ver histórico do quadro"><span aria-hidden="true">⚙</span></button></div>`).join("")
        : `<div class="kanban-sidebar-empty">Nenhum quadro disponível.</div>`}
    </nav>
    <div class="kanban-sidebar-security"><span aria-hidden="true">◆</span><p><strong>Acesso privado</strong>Os quadros aparecem apenas para as pessoas selecionadas.</p></div>
  </aside>`;
}

function renderKanbanActivity(items = []) {
  return `<div class="kanban-activity-list">
      ${items.length
        ? items.map((item) => `<article class="kanban-activity-item"><span class="kanban-activity-avatar" aria-hidden="true">${e(personInitials(item.actor?.name || "Sistema"))}</span><div><p><strong>${e(item.actor?.name || "Sistema")}</strong> ${e(item.summary)}</p><time datetime="${new Date(item.createdAt * 1000).toISOString()}">${e(formatHistoryDate(item.createdAt))}</time></div></article>`).join("")
        : `<div class="kanban-activity-empty"><span aria-hidden="true">↻</span><strong>Nenhuma alteração registrada</strong><p>As ações deste quadro aparecerão aqui.</p></div>`}
    </div>`;
}

function renderKanbanColumn(column) {
  const cards = state.kanban.cards
    .filter((card) => card.status === column.id)
    .sort(compareKanbanCardsByPriority);
  return `<section class="kanban-column" data-kanban-column="${e(column.id)}" aria-labelledby="kanban-${e(column.id)}-title">
    <div class="kanban-column-heading">
      <div><h3 id="kanban-${e(column.id)}-title">${e(column.label)}</h3><p>${e(column.description)}</p></div>
      <span>${cards.length}</span>
    </div>
    <div class="kanban-column-cards">
      ${cards.length ? cards.map(renderKanbanCard).join("") : renderKanbanColumnEmpty()}
    </div>
  </section>`;
}

function renderKanbanColumnEmpty() {
  return `<div class="kanban-column-empty"><strong>Nenhum cartão</strong><span>Arraste uma atividade para cá ou crie um novo cartão.</span></div>`;
}

function renderKanbanCard(card) {
  const busy = state.kanban.busy.get(card.id) || "";
  const canEdit = Boolean(state.kanban.board?.canEdit);
  const disabled = busy || !canEdit ? "disabled" : "";
  const syncing = busy === "move" || busy === "priority";
  const busyClass = syncing ? " is-syncing" : busy ? " is-busy" : "";
  const priority = kanbanPriority(card.priority);
  const assignees = card.assignees.length
    ? `<div class="kanban-card-assignees" aria-label="Responsáveis">${card.assignees.map((person) => `<span class="kanban-person-chip" title="${e(person.name)} — ${e(person.email)}"><span aria-hidden="true">${e(personInitials(person.name))}</span>${e(person.name)}</span>`).join("")}</div>`
    : `<span class="kanban-unassigned">Sem responsável</span>`;
  const schedule = renderKanbanCardSchedule(card);
  return `<article class="kanban-card${busyClass}" draggable="${busy || !canEdit ? "false" : "true"}" data-kanban-card-id="${e(card.id)}" tabindex="0"${syncing ? ' aria-busy="true"' : ""}>
    <div class="kanban-card-topline">
      <span>${e(kanbanStatusLabel(card.status))}</span>
      <label class="kanban-priority-control ${e(priority.className)}"><span class="sr-only">Prioridade de ${e(card.title)}</span><span class="kanban-priority-dot" aria-hidden="true"></span><select data-kanban-priority data-id="${e(card.id)}" aria-label="Prioridade de ${e(card.title)}" ${disabled}>${KANBAN_PRIORITIES.map((item) => `<option class="${e(item.className)}" value="${e(item.id)}" ${priority.id === item.id ? "selected" : ""}>${e(item.label)}</option>`).join("")}</select></label>
      <small>${e(formatHistoryDate(card.updatedAt))}</small>
    </div>
    <h4>${e(card.title)}</h4>
    ${card.description ? `<p>${e(card.description).replace(/\n/g, "<br>")}</p>` : ""}
    ${schedule}
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

function kanbanPriority(value) {
  return KANBAN_PRIORITIES.find((priority) => priority.id === value) || KANBAN_PRIORITIES[1];
}

function compareKanbanCardsByPriority(first, second) {
  const priorityDifference = KANBAN_PRIORITY_RANK[kanbanPriority(first.priority).id] - KANBAN_PRIORITY_RANK[kanbanPriority(second.priority).id];
  if (priorityDifference) return priorityDifference;
  return Number(second.position || 0) - Number(first.position || 0) || Number(second.createdAt || 0) - Number(first.createdAt || 0);
}

function renderKanbanCardSchedule(card) {
  const schedule = getKanbanSchedule(card.startDate, card.durationDays);
  if (!schedule) {
    return `<div class="kanban-card-schedule is-missing"><span aria-hidden="true">◷</span><div><strong>Prazo não definido</strong><small>Edite o cartão para informar o início e a vigência.</small></div></div>`;
  }
  return `<div class="kanban-card-schedule ${e(schedule.className)}"><span aria-hidden="true">◷</span><div><strong>${e(schedule.label)}</strong><small>Início: ${e(formatDate(schedule.startDate))} • Término: ${e(formatDate(schedule.endDate))}</small></div></div>`;
}

function getKanbanSchedule(startDate, durationDays) {
  const startTime = isoDateToUtc(startDate);
  const duration = Number(durationDays);
  if (!Number.isFinite(startTime) || !Number.isInteger(duration) || duration < 1) return null;
  const dayMilliseconds = 86_400_000;
  const endTime = startTime + duration * dayMilliseconds;
  const todayTime = isoDateToUtc(todayInputValue());
  const daysRemaining = Math.round((endTime - todayTime) / dayMilliseconds);
  const label = daysRemaining > 1
    ? `Faltam ${daysRemaining} dias`
    : daysRemaining === 1
      ? "Falta 1 dia"
      : daysRemaining === 0
        ? "Termina hoje"
        : `Em atraso há ${Math.abs(daysRemaining)} ${Math.abs(daysRemaining) === 1 ? "dia" : "dias"}`;
  return {
    startDate,
    endDate: new Date(endTime).toISOString().slice(0, 10),
    daysRemaining,
    label,
    className: daysRemaining < 0 ? "is-overdue" : daysRemaining <= 3 ? "is-ending" : "is-active",
  };
}

function isoDateToUtc(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return Number.NaN;
  const [year, month, day] = String(value).split("-").map(Number);
  const timestamp = Date.UTC(year, month - 1, day);
  const normalized = new Date(timestamp).toISOString().slice(0, 10);
  return normalized === value ? timestamp : Number.NaN;
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
    const query = state.kanban.activeBoardId ? `?boardId=${encodeURIComponent(state.kanban.activeBoardId)}` : "";
    const payload = await apiRequest(`/api/kanban${query}`);
    state.kanban.boards = Array.isArray(payload.boards) ? payload.boards : [];
    state.kanban.board = payload.board || null;
    state.kanban.activeBoardId = payload.board?.id || "";
    state.kanban.cards = Array.isArray(payload.cards) ? payload.cards : [];
    state.kanban.people = Array.isArray(payload.people) ? payload.people : [];
    state.kanban.activity = Array.isArray(payload.activity) ? payload.activity : [];
    state.kanban.loaded = true;
  } catch (error) {
    state.kanban.error = error.message;
    if (!silent) showToast("Não foi possível atualizar o Kanban.");
  } finally {
    state.kanban.loading = false;
    if (state.kanban.open) render();
  }
}

async function showKanban({ focusCardId = "", boardId = "" } = {}) {
  state.flow = null;
  state.admin.open = false;
  state.history.open = false;
  state.processes.open = false;
  state.kanban.open = true;
  if (boardId) state.kanban.activeBoardId = boardId;
  closeNotificationPopover();
  render();
  pushNavigationState();
  focusMain();
  if (!state.kanban.loaded || boardId) await loadKanban();
  if (focusCardId) {
    requestAnimationFrame(() => {
      const card = document.querySelector(`[data-kanban-card-id="${focusCardId}"]`);
      card?.scrollIntoView?.({ behavior: "smooth", block: "center", inline: "center" });
      card?.classList.add("is-notification-target");
      setTimeout(() => card?.classList.remove("is-notification-target"), 2200);
    });
  }
}

async function selectKanbanBoard(boardId) {
  if (!boardId || boardId === state.kanban.activeBoardId || state.kanban.loading) return;
  state.kanban.activeBoardId = boardId;
  state.kanban.cards = [];
  state.kanban.activity = [];
  await loadKanban();
  pushNavigationState();
}

async function openKanbanHistoryDialog(boardId) {
  const board = state.kanban.boards.find((item) => item.id === boardId);
  if (!board) {
    showToast("Não foi possível localizar este quadro.");
    return;
  }
  elements.kanbanHistoryDialog.dataset.boardId = boardId;
  elements.kanbanHistoryDialogTitle.textContent = `Histórico — ${board.name}`;
  elements.kanbanHistoryDialogContent.innerHTML = `<div class="kanban-history-loading"><span class="history-spinner" aria-hidden="true"></span><strong>Carregando histórico…</strong></div>`;
  openDialog(elements.kanbanHistoryDialog);
  try {
    const payload = await apiRequest(`/api/kanban?boardId=${encodeURIComponent(boardId)}`);
    if (!elements.kanbanHistoryDialog.open || elements.kanbanHistoryDialog.dataset.boardId !== boardId) return;
    const items = Array.isArray(payload.activity) ? payload.activity : [];
    if (boardId === state.kanban.activeBoardId) state.kanban.activity = items;
    elements.kanbanHistoryDialogTitle.textContent = `Histórico — ${payload.board?.name || board.name}`;
    elements.kanbanHistoryDialogContent.innerHTML = renderKanbanActivity(items);
  } catch (error) {
    if (!elements.kanbanHistoryDialog.open || elements.kanbanHistoryDialog.dataset.boardId !== boardId) return;
    elements.kanbanHistoryDialogContent.innerHTML = `<div class="notice is-warning"><span aria-hidden="true">!</span><span>${e(error.message)}</span></div>`;
  }
}

function closeKanbanHistoryDialog() {
  elements.kanbanHistoryDialog.dataset.boardId = "";
  closeDialog(elements.kanbanHistoryDialog);
}

async function openKanbanBoardDialog(boardId = "") {
  if (!state.kanban.loaded) await loadKanban();
  const board = boardId ? state.kanban.boards.find((item) => item.id === boardId) : null;
  const fullBoard = boardId === state.kanban.board?.id ? state.kanban.board : null;
  if (boardId && (!board || !board.isOwner || !fullBoard)) {
    showToast("Somente o criador pode gerenciar este quadro.");
    return;
  }
  elements.kanbanBoardId.value = board?.id || "";
  elements.kanbanBoardName.value = board?.name || "";
  elements.kanbanBoardDescription.value = board?.description || "";
  elements.kanbanBoardFormTitle.textContent = board ? "Renomear e gerenciar quadro" : "Novo quadro";
  elements.saveKanbanBoardButton.textContent = board ? "Salvar alterações" : "Criar quadro";
  elements.saveKanbanBoardButton.disabled = false;
  elements.deleteKanbanBoardButton.classList.toggle("is-hidden", !board);
  setKanbanBoardFeedback();
  const selectedIds = new Set(fullBoard?.members.map((person) => person.id) || [state.auth.user.id]);
  elements.kanbanBoardMemberList.innerHTML = state.kanban.people.length
    ? state.kanban.people.map((person) => {
        const isCreator = person.id === state.auth.user.id;
        return `<label class="kanban-assignee-option${isCreator ? " is-locked" : ""}"><input type="checkbox" data-kanban-board-member value="${e(person.id)}" ${selectedIds.has(person.id) || isCreator ? "checked" : ""} ${isCreator ? "disabled" : ""} /><span class="kanban-assignee-avatar" aria-hidden="true">${e(personInitials(person.name))}</span><span><strong>${e(person.name)}</strong><small>${isCreator ? "Criador — acesso permanente" : e(person.email)}</small></span></label>`;
      }).join("")
    : `<div class="kanban-assignee-empty">Nenhuma pessoa com acesso aprovado foi encontrada.</div>`;
  openDialog(elements.kanbanBoardDialog);
  setTimeout(() => elements.kanbanBoardName.focus(), 40);
}

function closeKanbanBoardDialog() {
  if (elements.saveKanbanBoardButton.disabled) return;
  elements.kanbanBoardForm.reset();
  setKanbanBoardFeedback();
  closeDialog(elements.kanbanBoardDialog);
}

function setKanbanBoardFeedback(message = "") {
  elements.kanbanBoardFeedback.textContent = message;
  elements.kanbanBoardFeedback.className = `inline-feedback${message ? " is-error" : " is-hidden"}`;
  elements.kanbanBoardName.classList.toggle("is-validation-error", Boolean(message && !elements.kanbanBoardName.value.trim()));
}

async function saveKanbanBoard() {
  const boardId = elements.kanbanBoardId.value;
  const name = elements.kanbanBoardName.value.trim();
  if (!name) {
    setKanbanBoardFeedback("Informe o nome do quadro.");
    elements.kanbanBoardName.focus();
    return;
  }
  const memberIds = Array.from(elements.kanbanBoardMemberList.querySelectorAll("[data-kanban-board-member]:checked")).map((input) => input.value);
  if (!memberIds.includes(state.auth.user.id)) memberIds.push(state.auth.user.id);
  elements.saveKanbanBoardButton.disabled = true;
  elements.saveKanbanBoardButton.textContent = boardId ? "Salvando…" : "Criando…";
  setKanbanBoardFeedback();
  try {
    const payload = await apiRequest(boardId ? `/api/kanban/boards/${encodeURIComponent(boardId)}` : "/api/kanban/boards", {
      method: boardId ? "PATCH" : "POST",
      body: { name, description: elements.kanbanBoardDescription.value.trim(), memberIds },
    });
    elements.saveKanbanBoardButton.disabled = false;
    closeDialog(elements.kanbanBoardDialog);
    state.kanban.activeBoardId = payload.board.id;
    await loadKanban({ silent: true });
    showToast(boardId ? "Quadro e acessos atualizados." : "Quadro privado criado.");
  } catch (error) {
    elements.saveKanbanBoardButton.disabled = false;
    elements.saveKanbanBoardButton.textContent = boardId ? "Salvar alterações" : "Criar quadro";
    setKanbanBoardFeedback(error.message);
  }
}

function confirmKanbanBoardDeletion() {
  const board = state.kanban.board;
  if (!board?.isOwner) return;
  closeKanbanBoardDialog();
  showMessage({
    title: "Excluir este quadro?",
    text: `O quadro “${board.name}”, todos os cartões e o histórico serão removidos para todos os participantes.`,
    kind: "error",
    actions: [
      { label: "Cancelar" },
      { label: "Excluir quadro", danger: true, onClick: deleteActiveKanbanBoard },
    ],
  });
}

async function deleteActiveKanbanBoard() {
  const boardId = state.kanban.activeBoardId;
  if (!boardId) return;
  try {
    await apiRequest(`/api/kanban/boards/${encodeURIComponent(boardId)}`, { method: "DELETE" });
    state.kanban.activeBoardId = "";
    await loadKanban({ silent: true });
    showToast("Quadro excluído.");
  } catch (error) {
    state.kanban.error = error.message;
    render();
  }
}

async function openKanbanCardDialog(cardId = "") {
  if (!state.kanban.loaded) await loadKanban();
  if (!state.kanban.board?.canEdit) {
    showToast("Selecione um quadro que você possa editar.");
    return;
  }
  const card = cardId ? state.kanban.cards.find((item) => item.id === cardId) : null;
  state.kanban.editingCardId = card?.id || "";
  elements.kanbanCardId.value = card?.id || "";
  elements.kanbanCardTitle.value = card?.title || "";
  elements.kanbanCardDescription.value = card?.description || "";
  elements.kanbanCardStartDate.value = card?.startDate || (card ? "" : todayInputValue());
  elements.kanbanCardDurationDays.value = card?.durationDays || "";
  elements.kanbanCardStatus.value = card?.status || "todo";
  elements.kanbanCardFormTitle.textContent = card ? "Editar cartão" : "Novo cartão";
  elements.saveKanbanCardButton.textContent = card ? "Salvar alterações" : "Criar cartão";
  elements.saveKanbanCardButton.disabled = false;
  setKanbanCardFeedback();
  renderKanbanSchedulePreview();
  resetKanbanCardDetails(card?.id || "");
  const selectedIds = new Set(card?.assignees.map((person) => person.id) || []);
  const members = state.kanban.board.members || [];
  elements.kanbanAssigneeList.innerHTML = members.length
    ? members.map((person) => `<label class="kanban-assignee-option"><input type="checkbox" data-kanban-assignee value="${e(person.id)}" ${selectedIds.has(person.id) ? "checked" : ""} /><span class="kanban-assignee-avatar" aria-hidden="true">${e(personInitials(person.name))}</span><span><strong>${e(person.name)}</strong><small>${e(person.email)}</small></span></label>`).join("")
    : `<div class="kanban-assignee-empty">Este quadro ainda não possui participantes.</div>`;
  renderKanbanCardDetails();
  openDialog(elements.kanbanCardDialog);
  setTimeout(() => elements.kanbanCardTitle.focus(), 40);
  if (card) void loadKanbanCardDetails(card.id);
}

function closeKanbanCardDialog() {
  if (elements.saveKanbanCardButton.disabled || state.kanban.cardDetails.uploading) return;
  state.kanban.editingCardId = "";
  resetKanbanCardDetails();
  elements.kanbanCardForm.reset();
  setKanbanCardFeedback();
  closeDialog(elements.kanbanCardDialog);
}

function resetKanbanCardDetails(cardId = "") {
  state.kanban.cardDetails = {
    cardId,
    loading: false,
    error: "",
    attachments: [],
    timeline: [],
    uploading: false,
  };
  if (elements.kanbanAttachmentInput) elements.kanbanAttachmentInput.value = "";
  if (elements.kanbanAttachmentFeedback) {
    elements.kanbanAttachmentFeedback.textContent = "";
    elements.kanbanAttachmentFeedback.className = "inline-feedback is-hidden";
  }
}

function renderKanbanCardDetails() {
  const details = state.kanban.cardDetails;
  const visible = Boolean(details.cardId);
  elements.kanbanCardCollaboration.classList.remove("is-hidden");
  if (!visible) {
    elements.kanbanAttachmentInput.disabled = true;
    elements.kanbanAttachmentInput.closest(".kanban-attachment-button")?.classList.add("is-disabled");
    elements.kanbanAttachmentFeedback.textContent = "";
    elements.kanbanAttachmentFeedback.className = "inline-feedback is-hidden";
    elements.kanbanAttachmentList.innerHTML = `<div class="kanban-card-detail-state"><strong>Crie o cartão para anexar arquivos</strong><span>Depois de salvar, esta área será liberada sem fechar a janela.</span></div>`;
    elements.kanbanCardTimeline.innerHTML = `<div class="kanban-card-detail-state"><strong>O histórico começa ao criar o cartão</strong><span>As alterações feitas no cartão ficarão registradas aqui.</span></div>`;
    return;
  }

  const fileMessage = details.error || "";
  elements.kanbanAttachmentFeedback.textContent = fileMessage;
  elements.kanbanAttachmentFeedback.className = `inline-feedback${fileMessage ? " is-error" : " is-hidden"}`;
  elements.kanbanAttachmentInput.disabled = details.loading || details.uploading;
  const uploadLabel = elements.kanbanAttachmentInput.closest(".kanban-attachment-button");
  uploadLabel?.classList.toggle("is-disabled", elements.kanbanAttachmentInput.disabled);
  const uploadText = uploadLabel?.querySelector(":scope > span");
  if (uploadText) uploadText.textContent = details.uploading ? "Enviando…" : "+ Adicionar arquivos";

  elements.kanbanAttachmentList.innerHTML = details.loading
    ? `<div class="kanban-card-detail-state"><span class="history-spinner" aria-hidden="true"></span><strong>Carregando arquivos…</strong></div>`
    : details.attachments.length
      ? details.attachments.map((attachment) => `<article class="kanban-attachment-item">
          <span class="kanban-attachment-icon" aria-hidden="true">${e(attachmentFileMark(attachment.filename))}</span>
          <div><strong>${e(attachment.filename)}</strong><small>${e(formatFileSize(attachment.sizeBytes))} • ${e(attachment.uploadedBy?.name || "Usuário removido")} • ${e(formatHistoryDate(attachment.createdAt))}</small></div>
          <div class="kanban-attachment-actions">
            <a class="button button-quiet kanban-attachment-preview" href="/api/kanban/cards/${encodeURIComponent(details.cardId)}/attachments/${encodeURIComponent(attachment.id)}/download?view=1" target="_blank" rel="noopener noreferrer" aria-label="Visualizar ${e(attachment.filename)} em uma nova guia">Visualizar <span aria-hidden="true">↗</span></a>
            <a class="button button-quiet" href="/api/kanban/cards/${encodeURIComponent(details.cardId)}/attachments/${encodeURIComponent(attachment.id)}/download" aria-label="Baixar ${e(attachment.filename)}">Baixar</a>
            <button class="button button-quiet button-danger" type="button" data-action="delete-kanban-attachment" data-id="${e(attachment.id)}" ${details.uploading ? "disabled" : ""}>Remover</button>
          </div>
        </article>`).join("")
      : `<div class="kanban-card-detail-state"><strong>Nenhum arquivo anexado</strong><span>Adicione documentos, imagens ou planilhas relacionados a esta atividade.</span></div>`;

  elements.kanbanCardTimeline.innerHTML = details.loading
    ? `<div class="kanban-card-detail-state"><span class="history-spinner" aria-hidden="true"></span><strong>Carregando histórico…</strong></div>`
    : details.timeline.length
      ? details.timeline.map(renderKanbanCardTimelineItem).join("")
      : `<div class="kanban-card-detail-state"><strong>Histórico ainda vazio</strong><span>As alterações deste cartão aparecerão aqui.</span></div>`;
}

function renderKanbanCardTimelineItem(item) {
  const actorName = item.actor?.name || "Sistema";
  const descriptionSnapshot = item.type === "activity" && item.details
    ? `<div class="kanban-activity-snapshot"><strong>${item.action === "card_created" ? "Descrição inicial" : "Descrição salva nesta alteração"}</strong><p>${e(item.details).replace(/\n/g, "<br>")}</p></div>`
    : "";
  const content = item.type === "comment"
    ? `<p>${e(item.body).replace(/\n/g, "<br>")}</p>`
    : `<p><strong>${e(actorName)}</strong> ${e(item.summary)}</p>`;
  return `<article class="kanban-card-timeline-item is-${e(item.type)}">
    <span class="kanban-activity-avatar" aria-hidden="true">${e(personInitials(actorName))}</span>
    <div>${item.type === "comment" ? `<strong>${e(actorName)}</strong>` : ""}${content}${descriptionSnapshot}<time datetime="${new Date(item.createdAt * 1000).toISOString()}">${e(formatHistoryDate(item.createdAt))}</time></div>
  </article>`;
}

function attachmentFileMark(filename) {
  const extension = String(filename || "").split(".").pop()?.slice(0, 4).toUpperCase();
  return extension && extension !== filename.toUpperCase() ? extension : "ARQ";
}

async function loadKanbanCardDetails(cardId) {
  const details = state.kanban.cardDetails;
  if (!cardId || details.cardId !== cardId || details.loading) return;
  details.loading = true;
  details.error = "";
  renderKanbanCardDetails();
  try {
    const payload = await apiRequest(`/api/kanban/cards/${encodeURIComponent(cardId)}/details`);
    if (state.kanban.cardDetails.cardId !== cardId) return;
    state.kanban.cardDetails.attachments = Array.isArray(payload.attachments) ? payload.attachments : [];
    state.kanban.cardDetails.timeline = Array.isArray(payload.timeline) ? payload.timeline : [];
  } catch (error) {
    if (state.kanban.cardDetails.cardId === cardId) state.kanban.cardDetails.error = error.message;
  } finally {
    if (state.kanban.cardDetails.cardId === cardId) {
      state.kanban.cardDetails.loading = false;
      renderKanbanCardDetails();
    }
  }
}

async function uploadKanbanAttachments(fileList) {
  const details = state.kanban.cardDetails;
  const cardId = details.cardId;
  const files = Array.from(fileList || []);
  if (!cardId || !files.length || details.uploading) return;
  if (files.length > 5) {
    details.error = "Selecione no máximo 5 arquivos por vez.";
    renderKanbanCardDetails();
    return;
  }
  if (files.some((file) => file.size <= 0 || file.size > 10 * 1024 * 1024)) {
    details.error = "Cada arquivo deve ter conteúdo e no máximo 10 MB.";
    renderKanbanCardDetails();
    return;
  }

  const formData = new FormData();
  files.forEach((file) => formData.append("files", file, file.name));
  details.uploading = true;
  details.error = "";
  renderKanbanCardDetails();
  try {
    const payload = await apiRequest(`/api/kanban/cards/${encodeURIComponent(cardId)}/attachments`, {
      method: "POST",
      body: formData,
    });
    if (state.kanban.cardDetails.cardId !== cardId) return;
    details.attachments = Array.isArray(payload.attachments) ? payload.attachments : [];
    details.timeline = Array.isArray(payload.timeline) ? payload.timeline : details.timeline;
    showToast(files.length === 1 ? "Arquivo anexado ao cartão." : `${files.length} arquivos anexados ao cartão.`);
  } catch (error) {
    if (state.kanban.cardDetails.cardId === cardId) details.error = error.message;
  } finally {
    if (state.kanban.cardDetails.cardId === cardId) {
      details.uploading = false;
      elements.kanbanAttachmentInput.value = "";
      renderKanbanCardDetails();
    }
  }
}

function confirmKanbanAttachmentDeletion(attachmentId) {
  const details = state.kanban.cardDetails;
  const attachment = details.attachments.find((item) => item.id === attachmentId);
  if (!attachment) return;
  showMessage({
    title: "Remover este arquivo?",
    text: `O arquivo “${attachment.filename}” será removido deste cartão. Esta ação ficará registrada no histórico.`,
    kind: "error",
    actions: [
      { label: "Cancelar" },
      { label: "Remover arquivo", danger: true, onClick: () => deleteKanbanAttachment(attachmentId) },
    ],
  });
}

async function deleteKanbanAttachment(attachmentId) {
  const details = state.kanban.cardDetails;
  const cardId = details.cardId;
  if (!cardId || details.uploading) return;
  details.uploading = true;
  details.error = "";
  renderKanbanCardDetails();
  try {
    const payload = await apiRequest(`/api/kanban/cards/${encodeURIComponent(cardId)}/attachments/${encodeURIComponent(attachmentId)}`, {
      method: "DELETE",
    });
    if (state.kanban.cardDetails.cardId !== cardId) return;
    details.attachments = Array.isArray(payload.attachments) ? payload.attachments : [];
    details.timeline = Array.isArray(payload.timeline) ? payload.timeline : details.timeline;
    showToast("Arquivo removido do cartão.");
  } catch (error) {
    if (state.kanban.cardDetails.cardId === cardId) details.error = error.message;
  } finally {
    if (state.kanban.cardDetails.cardId === cardId) {
      details.uploading = false;
      renderKanbanCardDetails();
    }
  }
}

function setKanbanCardFeedback(message = "") {
  elements.kanbanCardFeedback.textContent = message;
  elements.kanbanCardFeedback.className = `inline-feedback${message ? " is-error" : " is-hidden"}`;
  elements.kanbanCardTitle.classList.toggle("is-validation-error", Boolean(message && !elements.kanbanCardTitle.value.trim()));
  elements.kanbanCardStartDate.classList.toggle("is-validation-error", Boolean(message && !elements.kanbanCardStartDate.value));
  const duration = Number(elements.kanbanCardDurationDays.value);
  elements.kanbanCardDurationDays.classList.toggle("is-validation-error", Boolean(message && (!Number.isInteger(duration) || duration < 1 || duration > 3650)));
}

function renderKanbanSchedulePreview() {
  const schedule = getKanbanSchedule(elements.kanbanCardStartDate.value, elements.kanbanCardDurationDays.value);
  elements.kanbanSchedulePreview.className = `kanban-schedule-preview${schedule ? ` ${schedule.className}` : ""}`;
  elements.kanbanSchedulePreview.textContent = schedule
    ? `${schedule.label}. Término calculado: ${formatDate(schedule.endDate)}.`
    : "Informe a data de início e a vigência para calcular o término.";
}

async function saveKanbanCard() {
  const cardId = elements.kanbanCardId.value;
  const title = elements.kanbanCardTitle.value.trim();
  if (!title) {
    setKanbanCardFeedback("Informe o título do cartão.");
    elements.kanbanCardTitle.focus();
    return;
  }
  const startDate = elements.kanbanCardStartDate.value;
  const durationDays = Number(elements.kanbanCardDurationDays.value);
  if (!startDate) {
    setKanbanCardFeedback("Informe a data de início da tarefa.");
    elements.kanbanCardStartDate.focus();
    return;
  }
  if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 3650) {
    setKanbanCardFeedback("Informe uma vigência entre 1 e 3650 dias.");
    elements.kanbanCardDurationDays.focus();
    return;
  }
  const body = {
    boardId: state.kanban.activeBoardId,
    title,
    description: elements.kanbanCardDescription.value.trim(),
    startDate,
    durationDays,
    status: elements.kanbanCardStatus.value,
    priority: state.kanban.cards.find((item) => item.id === cardId)?.priority || "medium",
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
    const savedCard = payload.card;
    const savedDurationDays = Number(savedCard?.durationDays);
    if (!savedCard?.id || savedCard.startDate !== startDate || savedDurationDays !== durationDays) {
      throw new ApiRequestError("O servidor não confirmou a data de início e a vigência. Tente salvar novamente.", 502);
    }
    if (!cardId) {
      const createdCardId = savedCard.id;
      state.kanban.editingCardId = createdCardId;
      elements.kanbanCardId.value = createdCardId;
      elements.kanbanCardFormTitle.textContent = "Editar cartão";
      elements.saveKanbanCardButton.disabled = false;
      elements.saveKanbanCardButton.textContent = "Salvar alterações";
      resetKanbanCardDetails(createdCardId);
      renderKanbanCardDetails();
      await loadKanban({ silent: true });
      void loadKanbanCardDetails(createdCardId);
      showToast("Cartão criado. O prazo será atualizado automaticamente.");
      return;
    }
    const previousCard = state.kanban.cards.find((item) => item.id === cardId);
    state.kanban.cards = state.kanban.cards.map((item) => item.id === cardId ? savedCard : item);
    state.kanban.editingCardId = "";
    elements.saveKanbanCardButton.disabled = false;
    closeDialog(elements.kanbanCardDialog);
    if (state.kanban.open && state.kanban.activeBoardId === savedCard.boardId) {
      if (previousCard?.status !== savedCard.status) moveKanbanCardInView(cardId, savedCard.status);
      settleKanbanCardInView(cardId, savedCard);
    }
    showToast("Cartão e prazo atualizados.");
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
  const boardId = state.kanban.activeBoardId;
  const previousCard = card;
  const optimisticCard = { ...card, status, updatedAt: Math.floor(Date.now() / 1000) };
  state.kanban.busy.set(cardId, "move");
  state.kanban.error = "";
  state.kanban.cards = state.kanban.cards.map((item) => item.id === cardId ? optimisticCard : item);
  moveKanbanCardInView(cardId, status);
  try {
    const payload = await apiRequest(`/api/kanban/cards/${encodeURIComponent(cardId)}`, {
      method: "PATCH",
      body: {
        title: card.title,
        description: card.description,
        startDate: card.startDate,
        durationDays: card.durationDays,
        status,
        priority: card.priority || "medium",
        assigneeIds: card.assignees.map((person) => person.id),
      },
    });
    state.kanban.cards = state.kanban.cards.map((item) => item.id === cardId ? (payload.card || optimisticCard) : item);
    state.kanban.busy.delete(cardId);
    if (state.kanban.open && state.kanban.activeBoardId === boardId) {
      settleKanbanCardInView(cardId, payload.card || optimisticCard);
    }
    showToast(`Cartão movido para ${kanbanStatusLabel(status)}.`);
  } catch (error) {
    state.kanban.cards = state.kanban.cards.map((item) => item.id === cardId ? previousCard : item);
    state.kanban.busy.delete(cardId);
    if (state.kanban.open && state.kanban.activeBoardId === boardId) {
      state.kanban.error = error.message;
      moveKanbanCardInView(cardId, previousCard.status);
      settleKanbanCardInView(cardId, previousCard);
      showToast("Não foi possível mover o cartão. A alteração foi desfeita.");
    }
  }
}

async function changeKanbanCardPriority(cardId, priority) {
  const card = state.kanban.cards.find((item) => item.id === cardId);
  if (!card || kanbanPriority(card.priority).id === priority || state.kanban.busy.has(cardId)) return;
  const selectedPriority = kanbanPriority(priority).id;
  const boardId = state.kanban.activeBoardId;
  const previousCard = card;
  const optimisticCard = { ...card, priority: selectedPriority, updatedAt: Math.floor(Date.now() / 1000) };
  state.kanban.busy.set(cardId, "priority");
  state.kanban.error = "";
  state.kanban.cards = state.kanban.cards.map((item) => item.id === cardId ? optimisticCard : item);
  settleKanbanCardInView(cardId, optimisticCard);
  try {
    const payload = await apiRequest(`/api/kanban/cards/${encodeURIComponent(cardId)}`, {
      method: "PATCH",
      body: {
        title: card.title,
        description: card.description,
        startDate: card.startDate,
        durationDays: card.durationDays,
        status: card.status,
        priority: selectedPriority,
        assigneeIds: card.assignees.map((person) => person.id),
      },
    });
    const savedCard = payload.card || optimisticCard;
    state.kanban.cards = state.kanban.cards.map((item) => item.id === cardId ? savedCard : item);
    state.kanban.busy.delete(cardId);
    if (state.kanban.open && state.kanban.activeBoardId === boardId) settleKanbanCardInView(cardId, savedCard);
    showToast(`Prioridade alterada para ${kanbanPriority(selectedPriority).label}.`);
  } catch (error) {
    state.kanban.cards = state.kanban.cards.map((item) => item.id === cardId ? previousCard : item);
    state.kanban.busy.delete(cardId);
    if (state.kanban.open && state.kanban.activeBoardId === boardId) {
      state.kanban.error = error.message;
      settleKanbanCardInView(cardId, previousCard);
      showToast("Não foi possível alterar a prioridade. A alteração foi desfeita.");
    }
  }
}

function moveKanbanCardInView(cardId, status) {
  if (!state.kanban.open) return;
  const cardElement = document.querySelector(`[data-kanban-card-id="${cardId}"]`);
  const targetColumn = document.querySelector(`[data-kanban-column="${status}"]`);
  const targetCards = targetColumn?.querySelector(".kanban-column-cards");
  if (!cardElement || !targetCards) {
    render();
    return;
  }

  const sourceColumn = cardElement.closest("[data-kanban-column]");
  const previousRect = cardElement.getBoundingClientRect();
  targetCards.querySelector(".kanban-column-empty")?.remove();
  targetCards.append(cardElement);
  sortKanbanColumnInView(status);
  syncKanbanColumnInView(sourceColumn);
  syncKanbanColumnInView(targetColumn);
  syncKanbanSummaryInView();

  const statusBadge = cardElement.querySelector(".kanban-card-topline > span");
  const statusSelect = cardElement.querySelector("[data-kanban-status]");
  if (statusBadge) statusBadge.textContent = kanbanStatusLabel(status);
  if (statusSelect) statusSelect.value = status;
  setKanbanCardSyncingInView(cardElement, true);

  if (!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    const nextRect = cardElement.getBoundingClientRect();
    const translateX = previousRect.left - nextRect.left;
    const translateY = previousRect.top - nextRect.top;
    if (translateX || translateY) {
      cardElement.style.transition = "none";
      cardElement.style.transform = `translate(${translateX}px, ${translateY}px)`;
      cardElement.getBoundingClientRect();
      requestAnimationFrame(() => {
        cardElement.style.transition = "";
        cardElement.style.transform = "";
      });
    }
  }
}

function syncKanbanColumnInView(columnElement) {
  if (!columnElement) return;
  const status = columnElement.dataset.kanbanColumn;
  const count = state.kanban.cards.filter((card) => card.status === status).length;
  const counter = columnElement.querySelector(".kanban-column-heading > span");
  const cards = columnElement.querySelector(".kanban-column-cards");
  if (counter) counter.textContent = String(count);
  if (!cards) return;
  if (count === 0 && !cards.querySelector(".kanban-column-empty")) {
    cards.insertAdjacentHTML("beforeend", renderKanbanColumnEmpty());
  } else if (count > 0) {
    cards.querySelector(".kanban-column-empty")?.remove();
  }
}

function syncKanbanSummaryInView() {
  for (const status of ["total", ...KANBAN_COLUMNS.map((column) => column.id)]) {
    const value = status === "total"
      ? state.kanban.cards.length
      : state.kanban.cards.filter((card) => card.status === status).length;
    const counter = document.querySelector(`[data-kanban-summary="${status}"]`);
    if (counter) counter.textContent = String(value);
  }
}

function setKanbanCardSyncingInView(cardElement, syncing) {
  cardElement.classList.toggle("is-syncing", syncing);
  if (syncing) cardElement.setAttribute("aria-busy", "true");
  else cardElement.removeAttribute("aria-busy");
  cardElement.draggable = !syncing && Boolean(state.kanban.board?.canEdit);
  cardElement.querySelectorAll("select, button").forEach((control) => {
    control.disabled = syncing || !state.kanban.board?.canEdit;
  });
}

function settleKanbanCardInView(cardId, card) {
  const cardElement = document.querySelector(`[data-kanban-card-id="${cardId}"]`);
  if (!cardElement) {
    render();
    return;
  }
  cardElement.outerHTML = renderKanbanCard(card);
  sortKanbanColumnInView(card.status);
}

function sortKanbanColumnInView(status) {
  const cardsContainer = document.querySelector(`[data-kanban-column="${status}"] .kanban-column-cards`);
  if (!cardsContainer) return;
  state.kanban.cards
    .filter((card) => card.status === status)
    .sort(compareKanbanCardsByPriority)
    .forEach((card) => {
      const cardElement = cardsContainer.querySelector(`[data-kanban-card-id="${card.id}"]`);
      if (cardElement) cardsContainer.append(cardElement);
    });
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
    await loadKanban({ silent: true });
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
  const expanded = state.kanban.notificationsExpanded;
  const totalCount = Math.max(state.kanban.notificationTotalCount, notifications.length);
  const visibleNotifications = expanded ? notifications : notifications.slice(0, 5);
  elements.notificationPopover.classList.toggle("is-expanded", expanded);
  if (state.kanban.notificationsLoading && !notifications.length) {
    elements.notificationList.innerHTML = `<div class="notification-state"><span class="history-spinner" aria-hidden="true"></span><strong>Carregando…</strong></div>`;
    return;
  }
  if (!notifications.length) {
    elements.notificationList.innerHTML = `<div class="notification-state"><span class="notification-empty-bell" aria-hidden="true">&#128276;&#65038;</span><strong>Nenhuma notificação</strong><span>Quando outro participante alterar um cartão do seu quadro, o aviso aparecerá aqui.</span></div>`;
    return;
  }
  const expandButton = totalCount > 5
    ? `<button class="notification-expand-button" type="button" data-action="toggle-notification-expansion" aria-expanded="${expanded}" aria-controls="notificationList">${expanded ? "Mostrar menos" : `Ver todas as notificações (${totalCount})`}</button>`
    : "";
  const readAllButton = state.kanban.unreadCount
    ? `<button class="notification-read-all" type="button" data-action="read-all-notifications">Marcar todas como lidas</button>`
    : "";
  elements.notificationList.innerHTML = `<div class="notification-items">${visibleNotifications.map((notification) => `<button class="notification-item${notification.readAt ? "" : " is-unread"}" type="button" data-action="open-kanban-notification" data-id="${e(notification.id)}" data-board-id="${e(notification.boardId)}" data-card-id="${e(notification.cardId)}"><span class="notification-item-bell" aria-hidden="true">&#128276;&#65038;</span><span><strong>${e(notification.message)}</strong><small>${e(formatHistoryDate(notification.createdAt))}</small></span></button>`).join("")}</div>${expandButton || readAllButton ? `<div class="notification-actions">${expandButton}${readAllButton}</div>` : ""}`;
}

async function loadKanbanNotifications({ silent = false } = {}) {
  if (!state.auth.user || state.kanban.notificationsLoading) return;
  state.kanban.notificationsLoading = true;
  if (state.kanban.notificationsOpen) renderNotificationPopover();
  try {
    const query = state.kanban.notificationsExpanded ? "?all=1" : "";
    const payload = await apiRequest(`/api/kanban/notifications${query}`);
    state.kanban.notifications = Array.isArray(payload.notifications) ? payload.notifications : [];
    state.kanban.unreadCount = Number(payload.unreadCount) || 0;
    state.kanban.notificationTotalCount = Number(payload.totalCount) || state.kanban.notifications.length;
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
  state.kanban.notificationsExpanded = false;
  elements.notificationPopover.classList.add("is-hidden");
  elements.notificationPopover.classList.remove("is-expanded");
  elements.notificationButton.setAttribute("aria-expanded", "false");
}

async function toggleNotificationExpansion() {
  state.kanban.notificationsExpanded = !state.kanban.notificationsExpanded;
  renderNotificationPopover();
  if (state.kanban.notificationsExpanded) await loadKanbanNotifications({ silent: true });
}

async function openKanbanNotification(notificationId, boardId, cardId) {
  try {
    await apiRequest(`/api/kanban/notifications/${encodeURIComponent(notificationId)}`, { method: "PATCH" });
    state.kanban.notifications = state.kanban.notifications.map((item) => item.id === notificationId ? { ...item, readAt: Math.floor(Date.now() / 1_000) } : item);
    state.kanban.unreadCount = state.kanban.notifications.filter((item) => !item.readAt).length;
    updateNotificationBell();
  } catch {
    // O cartão ainda pode ser aberto mesmo se o aviso já tiver sido removido.
  }
  await showKanban({ boardId, focusCardId: cardId });
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

function renderDrainage() {
  return [
    renderDrainageProject,
    renderDrainageServices,
    renderDrainageParameters,
    renderDrainageResults,
    renderDrainageMemory,
  ][state.step]();
}

function renderDrainageProject() {
  const project = state.drainage.project;
  return `${pageHeading("Etapa 1", "Quantitativo de obras de drenagem", "Comece pelos dados gerais do trecho. Eles identificam a memória e alimentam os parâmetros iniciais.")}
  <section class="drainage-hero" aria-label="Visão geral do sistema de drenagem">
    <img src="${DRAINAGE_IMAGES.system}" alt="Corte ilustrado de pavimento, boca de lobo, tubo PEAD e poço de visita" />
    <div class="drainage-hero-copy">
      <span class="eyebrow eyebrow-dark">Cálculo rastreável</span>
      <h2>Da geometria ao material</h2>
      <p>Cada resultado registra a fórmula, o valor calculado e o quantitativo adotado pelo responsável.</p>
      <div class="drainage-flow-chips" aria-label="Etapas resumidas">
        <span>Dados</span><span>Serviços</span><span>Parâmetros</span><span>Memória</span><span>Excel</span>
      </div>
    </div>
  </section>
  <section class="panel drainage-panel">
    ${panelHeader("Dados da obra", "Identifique o trecho e defina a margem padrão. Os valores podem ser alterados a qualquer momento.")}
    <div class="field-grid">
      <label class="field"><span>Nome da obra *</span><input type="text" data-bind="drainage.project.name" value="${e(project.name)}" placeholder="Ex.: Drenagem Rua 22" /></label>
      <label class="field"><span>Bairro *</span><input type="text" data-bind="drainage.project.neighborhood" value="${e(project.neighborhood)}" placeholder="Ex.: São Lourenço" /></label>
    </div>
    <div class="field-grid three">
      ${drainageNumberField("Extensão da obra", "drainage.project.extension", project.extension, "m", { min: 0.01 })}
      ${drainageNumberField("Largura da via", "drainage.project.roadWidth", project.roadWidth, "m", { min: 0.01 })}
      ${drainageNumberField("Margem padrão de perdas", "drainage.project.standardLoss", project.standardLoss, "%", { min: 0, max: 100 })}
    </div>
    <div class="field-grid">
      <label class="field"><span>Responsável *</span><input type="text" data-bind="drainage.project.responsible" value="${e(project.responsible)}" placeholder="Ex.: Eng. Civil" /></label>
      <label class="field"><span>Data *</span><input type="date" data-bind="drainage.project.date" value="${e(project.date)}" /></label>
    </div>
  </section>`;
}

function renderDrainageServices() {
  const services = state.drainage.services;
  const choices = [
    { key: "bl", icon: "BL", title: "Boca de lobo", description: "Alvenaria, canaletas e materiais por geometria." },
    { key: "pv", icon: "PV", title: "Poço de visita", description: "Dimensões internas, paredes e composição escalonada." },
    { key: "pipes", icon: "◉", title: "Tubulação PEAD", description: "Extensão, barras comerciais, compra e sobra." },
    { key: "pavement", icon: "▦", title: "Pavimentação", description: "Lastro, aterro/base e piso intertravado." },
    { key: "gutter", icon: "⌞", title: "Sarjeta", description: "Volume com perdas e concreto 1:2:3." },
  ];
  return `${pageHeading("Etapa 2", "Quais serviços fazem parte da obra?", "Ative somente o que existe no trecho. As próximas etapas mostrarão apenas os parâmetros necessários.")}
  <section class="panel drainage-panel">
    ${panelHeader("Serviços do quantitativo", "Você poderá incluir ou retirar um serviço sem refazer os demais cálculos.")}
    <div class="drainage-service-grid" data-drainage-service-grid>
      ${choices.map((choice) => `<label class="drainage-service-choice${services[choice.key] ? " is-selected" : ""}">
        <input type="checkbox" data-bind="drainage.services.${choice.key}" ${services[choice.key] ? "checked" : ""} />
        <span class="drainage-service-icon" aria-hidden="true">${choice.icon}</span>
        <span><strong>${choice.title}</strong><small>${choice.description}</small></span>
        <span class="drainage-service-check" aria-hidden="true">✓</span>
      </label>`).join("")}
    </div>
    <div class="notice"><span aria-hidden="true">i</span><span><strong>Estrutura preparada para evoluir.</strong> Novos serviços poderão ser incluídos depois sem alterar as fórmulas já conferidas.</span></div>
  </section>`;
}

function renderDrainageParameters() {
  const drainage = state.drainage;
  const sections = [];
  if (drainage.services.bl) sections.push(renderDrainageStructureParameters("bl", "Boca de lobo — BL", "A quantidade de blocos usa a linha média das paredes e as dimensões modulares do bloco."));
  if (drainage.services.pv) sections.push(renderDrainageStructureParameters("pv", "Poço de visita — PV", "O mesmo motor geométrico da BL é aplicado às dimensões próprias do poço de visita."));
  if (drainage.services.pipes) sections.push(renderDrainagePipeParameters());
  if (drainage.services.pavement) sections.push(renderDrainagePavementParameters());
  if (drainage.services.gutter) sections.push(renderDrainageGutterParameters());
  return `${pageHeading("Etapa 3", "Informe dimensões e composições", "As unidades aparecem ao lado de cada campo para reduzir erros de preenchimento.")}
  <figure class="drainage-technical-figure">
    <img src="${DRAINAGE_IMAGES.block}" alt="Bloco de concreto dimensionado ao lado de uma estrutura de drenagem em alvenaria" />
    <figcaption><strong>O tamanho do bloco entra no cálculo.</strong><span>Comprimento e altura, somados às juntas, definem quantas peças ocupam cada metro quadrado de parede.</span></figcaption>
  </figure>
  <div class="drainage-parameter-stack">${sections.join("")}</div>`;
}

function renderDrainageStructureParameters(key, title, description) {
  const structure = state.drainage[key];
  return `<section class="panel drainage-panel drainage-parameter-section">
    ${panelHeader(title, description)}
    <div class="field-grid three">
      ${drainageNumberField("Quantidade", `drainage.${key}.quantity`, structure.quantity, "un", { min: 1, step: 1 })}
      ${drainageNumberField("Comprimento interno", `drainage.${key}.internalLength`, structure.internalLength, "m", { min: 0.01 })}
      ${drainageNumberField("Largura interna", `drainage.${key}.internalWidth`, structure.internalWidth, "m", { min: 0.01 })}
      ${drainageNumberField("Profundidade / altura", `drainage.${key}.height`, structure.height, "m", { min: 0.01 })}
      ${drainageNumberField("Espessura da parede", `drainage.${key}.wallThickness`, structure.wallThickness, "m", { min: 0.01 })}
      ${drainageNumberField("Perdas", `drainage.${key}.loss`, structure.loss, "%", { min: 0, max: 100 })}
    </div>
    <div class="drainage-subheading"><span class="drainage-subheading-mark" aria-hidden="true">▤</span><div><strong>Bloco e juntas</strong><small>Dimensões reais em centímetros.</small></div></div>
    <div class="field-grid three">
      ${drainageNumberField("Largura do bloco", `drainage.${key}.blockWidthCm`, structure.blockWidthCm, "cm", { min: 0.01 })}
      ${drainageNumberField("Altura do bloco", `drainage.${key}.blockHeightCm`, structure.blockHeightCm, "cm", { min: 0.01 })}
      ${drainageNumberField("Comprimento do bloco", `drainage.${key}.blockLengthCm`, structure.blockLengthCm, "cm", { min: 0.01 })}
      ${drainageNumberField("Junta horizontal", `drainage.${key}.horizontalJointCm`, structure.horizontalJointCm, "cm", { min: 0 })}
      ${drainageNumberField("Junta vertical", `drainage.${key}.verticalJointCm`, structure.verticalJointCm, "cm", { min: 0 })}
      ${drainageNumberField("Comprimento da canaleta", `drainage.${key}.channelLengthCm`, structure.channelLengthCm, "cm", { min: 0.01 })}
      ${drainageNumberField("Fiadas com canaleta", `drainage.${key}.channelRows`, structure.channelRows, "fiada", { min: 0, step: 1 })}
    </div>
  </section>`;
}

function renderDrainagePipeParameters() {
  return `<section class="panel drainage-panel drainage-parameter-section">
    ${panelHeader("Tubulação PEAD", "O sistema arredonda para barras inteiras e mostra automaticamente o comprimento comprado e a sobra.")}
    <div class="drainage-pipe-list">
      ${state.drainage.pipes.map((pipe, index) => `<article class="drainage-pipe-row">
        <label class="field"><span>Diâmetro</span><input type="text" data-bind="drainage.pipes.${index}.diameter" value="${e(pipe.diameter)}" placeholder="Ex.: DN 600" /></label>
        ${drainageNumberField("Extensão necessária", `drainage.pipes.${index}.extension`, pipe.extension, "m", { min: 0.01 })}
        ${drainageNumberField("Comprimento comercial", `drainage.pipes.${index}.commercialLength`, pipe.commercialLength, "m", { min: 0.01 })}
        ${drainageNumberField("Perda adicional", `drainage.pipes.${index}.loss`, pipe.loss, "%", { min: 0, max: 100 })}
      </article>`).join("")}
    </div>
  </section>`;
}

function renderDrainagePavementParameters() {
  const pavement = state.drainage.pavement;
  return `<section class="panel drainage-panel drainage-parameter-section">
    ${panelHeader("Pavimentação e intertravado", "Área da caixa, volumes de lastro e base, e consumo de peças da área recomposta.")}
    <div class="field-grid three">
      ${drainageNumberField("Comprimento", "drainage.pavement.length", pavement.length, "m", { min: 0.01 })}
      ${drainageNumberField("Largura", "drainage.pavement.width", pavement.width, "m", { min: 0.01 })}
      ${drainageNumberField("Área recomposta", "drainage.pavement.effectiveArea", pavement.effectiveArea, "m²", { min: 0.01 })}
      ${drainageNumberField("Espessura do lastro", "drainage.pavement.bedThicknessCm", pavement.bedThicknessCm, "cm", { min: 0.01 })}
      ${drainageNumberField("Espessura do aterro/base", "drainage.pavement.baseThicknessCm", pavement.baseThicknessCm, "cm", { min: 0.01 })}
      ${drainageNumberField("Consumo do intertravado", "drainage.pavement.interlockingCoefficient", pavement.interlockingCoefficient, "un/m²", { min: 0.01 })}
    </div>
  </section>`;
}

function renderDrainageGutterParameters() {
  const gutter = state.drainage.gutter;
  return `<section class="panel drainage-panel drainage-parameter-section">
    ${panelHeader("Sarjeta e concreto 1:2:3", "O volume geométrico recebe a perda e alimenta automaticamente cimento, areia e brita.")}
    <div class="field-grid three">
      ${drainageNumberField("Comprimento", "drainage.gutter.length", gutter.length, "m", { min: 0.01 })}
      ${drainageNumberField("Largura", "drainage.gutter.width", gutter.width, "m", { min: 0.01 })}
      ${drainageNumberField("Espessura", "drainage.gutter.thickness", gutter.thickness, "m", { min: 0.01 })}
      ${drainageNumberField("Perdas", "drainage.gutter.loss", gutter.loss, "%", { min: 0, max: 100 })}
    </div>
    <div class="drainage-composition-strip"><span>Concreto 1:2:3</span><strong>7,576 sacos</strong><small>cimento/m³</small><strong>0,515 m³</strong><small>areia/m³</small><strong>0,773 m³</strong><small>brita/m³</small></div>
  </section>`;
}

function drainageNumberField(label, path, value, unit, options = {}) {
  const min = options.min ?? 0;
  const max = options.max ?? "";
  const step = options.step ?? "any";
  return `<label class="field"><span>${e(label)}</span><span class="unit-field"><input type="number" data-bind="${e(path)}" value="${e(value)}" min="${e(min)}" ${max === "" ? "" : `max="${e(max)}"`} step="${e(step)}" inputmode="decimal" /><small>${e(unit)}</small></span></label>`;
}

function renderDrainageResults() {
  const results = calculateDrainageResults();
  const project = state.drainage.project;
  return `${pageHeading("Etapa 4", "Quantitativo consolidado", "Compare o cálculo automático com o valor que será adotado pelo responsável técnico.")}
  <section class="drainage-result-summary">
    <article><span>Obra</span><strong>${e(project.name)}</strong><small>${e(project.neighborhood)}</small></article>
    <article><span>Serviços ativos</span><strong>${drainageActiveServiceCount()}</strong><small>${results.rows.length} itens calculados</small></article>
    <article><span>Trecho</span><strong>${drainageFormat(project.extension)} m</strong><small>via com ${drainageFormat(project.roadWidth)} m</small></article>
  </section>
  <section class="panel drainage-panel">
    ${panelHeader("Materiais e serviços", "Edite somente a coluna adotada quando houver arredondamento ou margem operacional de engenharia.")}
    <div class="drainage-table-scroll">
      <table class="drainage-results-table">
        <thead><tr><th>Serviço</th><th>Material</th><th>Calculado</th><th>Adotado</th><th>Observação</th></tr></thead>
        <tbody>${results.rows.map((row) => `<tr>
          <td><span class="drainage-service-tag">${e(row.service)}</span></td>
          <td><strong>${e(row.material)}</strong></td>
          <td>${drainageFormat(row.calculated, row.precision)} <small>${e(row.unit)}</small></td>
          <td><span class="drainage-adopted-field"><input type="number" min="0" step="${row.precision === 0 ? 1 : 0.01}" data-drainage-adopted="${e(row.id)}" value="${e(drainageAdoptedValue(row))}" aria-label="Quantidade adotada de ${e(row.material)}" /><small>${e(row.unit)}</small></span></td>
          <td>${e(row.note || "Conforme memória de cálculo")}</td>
        </tr>`).join("")}</tbody>
      </table>
    </div>
    <div class="notice"><span aria-hidden="true">✓</span><span><strong>O calculado permanece preservado.</strong> Alterar o adotado não apaga a fórmula que justificou o quantitativo.</span></div>
  </section>`;
}

function renderDrainageMemory() {
  const results = calculateDrainageResults();
  const groups = [...new Set(results.rows.map((row) => row.service))];
  return `${pageHeading("Etapa 5", "Memória de cálculo e Excel", "Revise as fórmulas. A planilha terá sete abas com os mesmos números apresentados na tela.")}
  <section class="drainage-memory-actions">
    <div><strong>${results.rows.length} itens prontos</strong><span>Cálculo, valor adotado e composição no mesmo arquivo.</span></div>
    <button class="button button-secondary" type="button" data-action="print-drainage-memory">Imprimir / salvar PDF</button>
    <button class="button button-primary" type="button" data-action="download-drainage-excel">Baixar Excel</button>
  </section>
  <section class="drainage-memory-print" aria-label="Memória de cálculo de drenagem">
    <div class="drainage-memory-cover">
      <span class="eyebrow eyebrow-dark">Memória de cálculo</span>
      <h2>${e(state.drainage.project.name)}</h2>
      <p>${e(state.drainage.project.neighborhood)} • ${e(state.drainage.project.responsible)} • ${e(formatDrainageDate(state.drainage.project.date))}</p>
    </div>
    <div class="drainage-memory-grid">
      ${groups.map((group) => `<article class="drainage-memory-card">
        <div class="drainage-memory-card-heading"><span>${e(group)}</span><strong>${results.rows.filter((row) => row.service === group).length} itens</strong></div>
        ${results.rows.filter((row) => row.service === group).map((row) => `<div class="drainage-formula-row">
          <div><strong>${e(row.material)}</strong><span>${e(row.formula)}</span></div>
          <div><small>Calculado</small><strong>${drainageFormat(row.calculated, row.precision)} ${e(row.unit)}</strong></div>
          <div><small>Adotado</small><strong>${drainageFormat(drainageAdoptedValue(row), row.precision)} ${e(row.unit)}</strong></div>
        </div>`).join("")}
      </article>`).join("")}
    </div>
  </section>`;
}

function calculateDrainageResults() {
  const rows = [];
  if (state.drainage.services.bl) rows.push(...calculateDrainageStructure("bl", "BL"));
  if (state.drainage.services.pv) rows.push(...calculateDrainageStructure("pv", "PV"));
  if (state.drainage.services.pipes) rows.push(...calculateDrainagePipes());
  if (state.drainage.services.pavement) rows.push(...calculateDrainagePavement());
  if (state.drainage.services.gutter) rows.push(...calculateDrainageGutter());
  return { rows };
}

function calculateDrainageStructure(key, service) {
  const value = state.drainage[key];
  const quantity = drainageNumber(value.quantity);
  const internalLength = drainageNumber(value.internalLength);
  const internalWidth = drainageNumber(value.internalWidth);
  const height = drainageNumber(value.height);
  const wall = drainageNumber(value.wallThickness);
  const lossFactor = 1 + drainageNumber(value.loss) / 100;
  const meanPerimeter = 2 * ((internalLength + wall) + (internalWidth + wall));
  const wallArea = meanPerimeter * height * quantity;
  const modularWidth = (drainageNumber(value.blockLengthCm) + drainageNumber(value.verticalJointCm)) / 100;
  const modularHeight = (drainageNumber(value.blockHeightCm) + drainageNumber(value.horizontalJointCm)) / 100;
  const modularArea = modularWidth * modularHeight;
  const blocks = modularArea > 0 ? wallArea / modularArea * lossFactor : 0;
  const channelModule = (drainageNumber(value.channelLengthCm) + drainageNumber(value.verticalJointCm)) / 100;
  const channels = channelModule > 0
    ? meanPerimeter * quantity * drainageNumber(value.channelRows) / channelModule * lossFactor
    : 0;
  const internalPerimeter = 2 * (internalLength + internalWidth);
  const compositionFactor = internalPerimeter / 3.2;
  const result = [
    drainageResult({
      id: `${key}-blocks`, service, material: `Bloco ${drainageFormat(value.blockWidthCm, 0)} × ${drainageFormat(value.blockHeightCm, 0)} × ${drainageFormat(value.blockLengthCm, 0)} cm`,
      unit: "un", calculated: blocks, defaultAdopted: Math.ceil(blocks), precision: 0,
      formula: `${drainageFormat(wallArea)} m² ÷ ${drainageFormat(modularArea, 3)} m²/bloco × ${drainageFormat(lossFactor, 2)}`,
      note: `${drainageFormat(meanPerimeter)} m de perímetro médio`,
    }),
    drainageResult({
      id: `${key}-channels`, service, material: "Canaleta de concreto", unit: "un", calculated: channels,
      defaultAdopted: Math.ceil(channels), precision: 0,
      formula: `${drainageFormat(meanPerimeter)} m × ${drainageFormat(quantity, 0)} × ${drainageFormat(value.channelRows, 0)} fiada(s) ÷ ${drainageFormat(channelModule)} m × ${drainageFormat(lossFactor, 2)}`,
      note: "Cinta superior calculada pelo comprimento modular",
    }),
  ];
  DRAINAGE_COMPOSITIONS.masonry.forEach((composition) => {
    const calculated = quantity * composition.coefficient * compositionFactor;
    const unit = composition.unit.split("/")[0];
    result.push(drainageResult({
      id: `${key}-${slugify(composition.material)}`,
      service,
      material: composition.material,
      unit,
      calculated,
      defaultAdopted: composition.precision === 0 ? Math.ceil(calculated) : drainageRound(calculated),
      precision: composition.precision,
      formula: `${drainageFormat(quantity, 0)} × ${drainageFormat(composition.coefficient, 3)} × fator geométrico ${drainageFormat(compositionFactor, 3)}`,
      note: `Composição-base ajustada ao perímetro interno (${drainageFormat(internalPerimeter)} m)`,
    }));
  });
  return result;
}

function calculateDrainagePipes() {
  return state.drainage.pipes.map((pipe, index) => {
    const extension = drainageNumber(pipe.extension);
    const lossFactor = 1 + drainageNumber(pipe.loss) / 100;
    const required = extension * lossFactor;
    const commercialLength = drainageNumber(pipe.commercialLength);
    const bars = commercialLength > 0 ? Math.ceil(required / commercialLength) : 0;
    const purchased = bars * commercialLength;
    const leftover = Math.max(0, purchased - required);
    return drainageResult({
      id: `pipe-${index}`,
      service: "Tubulação",
      material: `Tubo PEAD ${pipe.diameter || `Linha ${index + 1}`}`,
      unit: "m",
      calculated: required,
      defaultAdopted: purchased,
      precision: 2,
      formula: `ceil(${drainageFormat(required)} ÷ ${drainageFormat(commercialLength)}) = ${bars} barras; ${bars} × ${drainageFormat(commercialLength)} = ${drainageFormat(purchased)} m`,
      note: `${bars} barras • sobra de ${drainageFormat(leftover)} m`,
    });
  });
}

function calculateDrainagePavement() {
  const value = state.drainage.pavement;
  const area = drainageNumber(value.length) * drainageNumber(value.width);
  const bed = area * drainageNumber(value.bedThicknessCm) / 100;
  const base = area * drainageNumber(value.baseThicknessCm) / 100;
  const interlocking = drainageNumber(value.effectiveArea) * drainageNumber(value.interlockingCoefficient);
  return [
    drainageResult({ id: "pavement-bed", service: "Pavimentação", material: "Lastro de brita", unit: "m³", calculated: bed, defaultAdopted: Math.ceil(bed), precision: 2, formula: `${drainageFormat(value.length)} × ${drainageFormat(value.width)} × ${drainageFormat(drainageNumber(value.bedThicknessCm) / 100, 3)}`, note: `Área da caixa: ${drainageFormat(area)} m²` }),
    drainageResult({ id: "pavement-base", service: "Pavimentação", material: "Aterro / base", unit: "m³", calculated: base, defaultAdopted: Math.ceil(base), precision: 2, formula: `${drainageFormat(value.length)} × ${drainageFormat(value.width)} × ${drainageFormat(drainageNumber(value.baseThicknessCm) / 100, 3)}`, note: `Área da caixa: ${drainageFormat(area)} m²` }),
    drainageResult({ id: "pavement-interlocking", service: "Pavimentação", material: DRAINAGE_COMPOSITIONS.interlocking.material, unit: "un", calculated: interlocking, defaultAdopted: Math.ceil(interlocking), precision: 0, formula: `${drainageFormat(value.effectiveArea)} m² × ${drainageFormat(value.interlockingCoefficient)} un/m²`, note: "Aplicado somente à área efetivamente recomposta" }),
  ];
}

function calculateDrainageGutter() {
  const value = state.drainage.gutter;
  const geometric = drainageNumber(value.length) * drainageNumber(value.width) * drainageNumber(value.thickness);
  const lossFactor = 1 + drainageNumber(value.loss) / 100;
  const concrete = geometric * lossFactor;
  const result = [drainageResult({
    id: "gutter-concrete", service: "Sarjeta", material: "Concreto", unit: "m³", calculated: concrete,
    defaultAdopted: drainageRound(concrete), precision: 2,
    formula: `${drainageFormat(value.length)} × ${drainageFormat(value.width)} × ${drainageFormat(value.thickness)} × ${drainageFormat(lossFactor, 2)}`,
    note: `Volume geométrico: ${drainageFormat(geometric)} m³`,
  })];
  DRAINAGE_COMPOSITIONS.concrete123.forEach((composition) => {
    const calculated = concrete * composition.coefficient;
    result.push(drainageResult({
      id: `gutter-${slugify(composition.material)}`, service: "Sarjeta", material: composition.material,
      unit: composition.unit.split("/")[0], calculated,
      defaultAdopted: composition.precision === 0 ? Math.ceil(calculated) : drainageRound(calculated),
      precision: composition.precision,
      formula: `${drainageFormat(concrete)} m³ × ${drainageFormat(composition.coefficient, 3)} ${composition.unit}`,
      note: "Composição de concreto 1:2:3",
    }));
  });
  return result;
}

function drainageResult(result) {
  return result;
}

function drainageActiveServiceCount() {
  return Object.values(state.drainage.services).filter(Boolean).length;
}

function drainageNumber(value) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function drainageRound(value, precision = 2) {
  const factor = 10 ** precision;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function drainageFormat(value, precision = 2) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision,
  }).format(drainageNumber(value));
}

function drainageAdoptedValue(row) {
  return Object.prototype.hasOwnProperty.call(state.drainage.adopted, row.id)
    ? drainageNumber(state.drainage.adopted[row.id])
    : row.defaultAdopted;
}

function formatDrainageDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return "Data não informada";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function printDrainageMemory() {
  document.body.classList.add("is-printing-drainage");
  const cleanup = () => document.body.classList.remove("is-printing-drainage");
  window.addEventListener("afterprint", cleanup, { once: true });
  window.print();
  setTimeout(cleanup, 1_500);
}

async function generateDrainageSpreadsheet() {
  if (!validateCurrentStep()) return;
  if (!window.JSZip) {
    showMessage({ title: "Gerador indisponível", text: "O componente de criação do Excel não foi carregado. Atualize a página e tente novamente.", kind: "error" });
    return;
  }
  state.generation = { running: true, progress: 12, message: "Organizando as sete abas do quantitativo…" };
  render();
  try {
    const blob = await buildDrainageWorkbook((progress, message) => setGenerationProgress(progress, message));
    const filename = `quantitativo-drenagem-${slugify(state.drainage.project.name, "obra")}.xlsx`;
    if (state.lastDownload?.url) URL.revokeObjectURL(state.lastDownload.url);
    const url = URL.createObjectURL(blob);
    state.lastDownload = { blob, filename, url, saved: false, localOnly: true };
    triggerDownload(url, filename);
    state.drainage.complete = true;
    state.generation.running = false;
    render();
    pushNavigationState();
  } catch (error) {
    state.generation.running = false;
    render();
    showMessage({ title: "Não foi possível gerar o Excel", text: error.message, kind: "error" });
  }
}

async function buildDrainageWorkbook(onProgress) {
  const sheets = drainageWorkbookSheets();
  const zip = new window.JSZip();
  const createdAt = new Date().toISOString();
  onProgress(24, "Montando o resumo e a memória de cálculo…");
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  ${sheets.map((_, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("\n  ")}
</Types>`);
  zip.folder("_rels").file(".rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`);
  zip.folder("docProps").file("core.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${xlsxXmlEscape(`Quantitativo de drenagem — ${state.drainage.project.name}`)}</dc:title>
  <dc:creator>Fiscal Bertioga</dc:creator>
  <cp:lastModifiedBy>Fiscal Bertioga</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${createdAt}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${createdAt}</dcterms:modified>
</cp:coreProperties>`);
  zip.folder("docProps").file("app.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Fiscal Bertioga</Application><DocSecurity>0</DocSecurity><ScaleCrop>false</ScaleCrop>
  <HeadingPairs><vt:vector size="2" baseType="variant"><vt:variant><vt:lpstr>Planilhas</vt:lpstr></vt:variant><vt:variant><vt:i4>${sheets.length}</vt:i4></vt:variant></vt:vector></HeadingPairs>
  <TitlesOfParts><vt:vector size="${sheets.length}" baseType="lpstr">${sheets.map((sheet) => `<vt:lpstr>${xlsxXmlEscape(sheet.name)}</vt:lpstr>`).join("")}</vt:vector></TitlesOfParts>
</Properties>`);
  const xl = zip.folder("xl");
  xl.file("workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <bookViews><workbookView xWindow="0" yWindow="0" windowWidth="24000" windowHeight="12000"/></bookViews>
  <sheets>${sheets.map((sheet, index) => `<sheet name="${xlsxXmlEscape(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join("")}</sheets>
  <calcPr calcId="191029"/>
</workbook>`);
  xl.folder("_rels").file("workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${sheets.map((_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join("\n  ")}
  <Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);
  xl.file("styles.xml", drainageWorkbookStyles());
  const worksheets = xl.folder("worksheets");
  sheets.forEach((sheet, index) => worksheets.file(`sheet${index + 1}.xml`, drainageWorksheetXml(sheet)));
  onProgress(72, "Aplicando títulos, colunas e valores adotados…");
  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  onProgress(100, "Planilha concluída.");
  return blob;
}

function drainageWorkbookSheets() {
  const results = calculateDrainageResults().rows;
  const project = state.drainage.project;
  const calculationRows = (rows) => rows.map((row) => [
    row.service,
    row.material,
    row.unit,
    drainageRound(row.calculated, Math.max(2, row.precision)),
    drainageAdoptedValue(row),
    row.formula,
    row.note || "",
  ]);
  const titledSheet = (name, title, headers, rows) => ({
    name,
    rows: [[title], [], headers, ...rows],
    styledRows: new Map([[1, 2], [3, 1]]),
  });
  const compositionRows = [
    ...DRAINAGE_COMPOSITIONS.masonry.map((item) => ["ALV001", "Alvenaria BL/PV", item.material, item.coefficient, item.unit]),
    ...DRAINAGE_COMPOSITIONS.concrete123.map((item) => ["CONC123", "Concreto 1:2:3", item.material, item.coefficient, item.unit]),
    ["PAV001", "Intertravado 30 cm", DRAINAGE_COMPOSITIONS.interlocking.material, DRAINAGE_COMPOSITIONS.interlocking.coefficient, DRAINAGE_COMPOSITIONS.interlocking.unit],
  ];
  return [
    titledSheet("01 - Resumo", `QUANTITATIVO CONSOLIDADO — ${project.name}`, ["Serviço", "Material", "Unidade", "Calculado", "Adotado", "Fórmula", "Observação"], calculationRows(results)),
    titledSheet("02 - Dados da Obra", "DADOS DA OBRA", ["Campo", "Valor", "Unidade"], [
      ["Nome da obra", project.name, ""], ["Bairro", project.neighborhood, ""], ["Extensão", drainageNumber(project.extension), "m"], ["Largura da via", drainageNumber(project.roadWidth), "m"], ["Margem padrão de perdas", drainageNumber(project.standardLoss), "%"], ["Responsável", project.responsible, ""], ["Data", formatDrainageDate(project.date), ""],
    ]),
    titledSheet("03 - BL e PV", "MEMÓRIA DE CÁLCULO — BL E PV", ["Serviço", "Material", "Unidade", "Calculado", "Adotado", "Fórmula", "Observação"], calculationRows(results.filter((row) => row.service === "BL" || row.service === "PV"))),
    titledSheet("04 - Tubulação", "TUBULAÇÃO — BARRAS E SOBRAS", ["Serviço", "Material", "Unidade", "Necessário", "Adquirido", "Fórmula", "Barras e sobra"], calculationRows(results.filter((row) => row.service === "Tubulação"))),
    titledSheet("05 - Pavimentação", "PAVIMENTAÇÃO, LASTRO E INTERTRAVADO", ["Serviço", "Material", "Unidade", "Calculado", "Adotado", "Fórmula", "Observação"], calculationRows(results.filter((row) => row.service === "Pavimentação"))),
    titledSheet("06 - Sarjeta", "SARJETA E COMPOSIÇÃO DO CONCRETO", ["Serviço", "Material", "Unidade", "Calculado", "Adotado", "Fórmula", "Observação"], calculationRows(results.filter((row) => row.service === "Sarjeta"))),
    titledSheet("07 - Composições", "BIBLIOTECA DE COMPOSIÇÕES UTILIZADA", ["Código", "Serviço", "Material", "Coeficiente", "Unidade"], compositionRows),
  ];
}

function drainageWorksheetXml(sheet) {
  const maxColumns = Math.max(1, ...sheet.rows.map((row) => row.length));
  const widths = Array.from({ length: maxColumns }, (_, columnIndex) => {
    const longest = Math.max(10, ...sheet.rows.map((row) => String(row[columnIndex] ?? "").length));
    return Math.min(62, Math.max(12, longest + 2));
  });
  const rowsXml = sheet.rows.map((row, rowIndex) => {
    const rowNumber = rowIndex + 1;
    const style = sheet.styledRows.get(rowNumber) || 0;
    const cells = row.map((value, columnIndex) => drainageCellXml(value, columnIndex, rowNumber, style)).join("");
    return `<row r="${rowNumber}"${rowNumber === 1 ? ' ht="24" customHeight="1"' : ""}>${cells}</row>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="3" topLeftCell="A4" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  <cols>${widths.map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`).join("")}</cols>
  <sheetData>${rowsXml}</sheetData>
</worksheet>`;
}

function drainageCellXml(value, columnIndex, rowNumber, style) {
  const reference = `${xlsxColumnName(columnIndex + 1)}${rowNumber}`;
  const styleAttribute = style ? ` s="${style}"` : "";
  if (typeof value === "number" && Number.isFinite(value)) {
    return `<c r="${reference}"${styleAttribute} t="n"><v>${value}</v></c>`;
  }
  return `<c r="${reference}"${styleAttribute} t="inlineStr"><is><t xml:space="preserve">${xlsxXmlEscape(String(value ?? ""))}</t></is></c>`;
}

function xlsxColumnName(index) {
  let value = index;
  let result = "";
  while (value > 0) {
    value -= 1;
    result = String.fromCharCode(65 + (value % 26)) + result;
    value = Math.floor(value / 26);
  }
  return result;
}

function xlsxXmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function drainageWorkbookStyles() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="3">
    <font><sz val="11"/><name val="Aptos"/><family val="2"/></font>
    <font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Aptos"/><family val="2"/></font>
    <font><b/><color rgb="FF163B31"/><sz val="15"/><name val="Aptos Display"/><family val="2"/></font>
  </fonts>
  <fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1F6F59"/><bgColor indexed="64"/></patternFill></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="3">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"><alignment vertical="top" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"><alignment vertical="center"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;
}

function renderReport() {
  const renders = [renderReportInfo, renderReportMap, renderReportPhotos, renderReportContent, renderReportReview];
  return renders[state.step]();
}

function reportStreets() {
  return String(state.report.streets || "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((street) => street.trim())
    .filter(Boolean);
}

function reportRecommendations() {
  return String(state.report.recommendations || "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((item) => item.replace(/^[•\-–—\s]+/, "").replace(/[.;]+$/, "").trim())
    .filter(Boolean);
}

function technicalOpinionTitle() {
  const neighborhood = state.report.neighborhood.trim();
  return neighborhood
    ? `PARECER TÉCNICO DE VISTORIA – BAIRRO ${neighborhood.toLocaleUpperCase("pt-BR")}`
    : "PARECER TÉCNICO DE VISTORIA";
}

function technicalOpinionIntroduction() {
  const r = state.report;
  const neighborhood = r.neighborhood.trim() || "[bairro]";
  const company = r.responsibleCompany.trim() || "[empresa responsável]";
  const intervention = r.intervention.trim() || "[serviço executado]";
  return [
    `O presente Parecer Técnico de Vistoria tem por objetivo registrar e mapear as vias do bairro ${neighborhood} que receberam intervenções da ${company} para ${intervention}, identificando os pontos que apresentam pendências de acabamento após a execução dos serviços.`,
    `Durante a vistoria foram observadas não conformidades nos trechos inspecionados, conforme as constatações técnicas e as evidências fotográficas apresentadas neste documento.`,
    "Este documento visa subsidiar as providências necessárias para a correção dos trechos apontados, com a devida recomposição do pavimento e restauração das condições adequadas de uso das vias públicas.",
  ];
}

function renderReportInfo() {
  const r = state.report;
  return `${pageHeading("Etapa 1", "Identifique o parecer", "Informe o local, a data e a intervenção que será analisada.")}
  <section class="panel">
    ${panelHeader("Dados da vistoria", "O título e a abertura do parecer serão montados automaticamente no padrão do modelo atual.")}
    <div class="field-grid three">
      <label class="field"><span>Cidade *</span><input type="text" data-bind="report.city" value="${e(r.city)}" placeholder="Ex.: Bertioga" /></label>
      <label class="field"><span>Data da vistoria *</span><input type="date" data-bind="report.date" value="${e(r.date)}" /></label>
      <label class="field"><span>Bairro *</span><input type="text" data-bind="report.neighborhood" value="${e(r.neighborhood)}" placeholder="Ex.: São Lourenço" /></label>
    </div>
  </section>
  <section class="panel">
    ${panelHeader("Intervenção fiscalizada", "Esses dados alimentam a introdução sem atribuir fatos que não tenham sido informados.")}
    <div class="field-grid">
      <label class="field"><span>Empresa responsável *</span><input type="text" data-bind="report.responsibleCompany" value="${e(r.responsibleCompany)}" placeholder="Ex.: SABESP" /></label>
      <label class="field"><span>Serviço ou intervenção *</span><input type="text" data-bind="report.intervention" value="${e(r.intervention)}" placeholder="Ex.: implantação de rede de água e esgoto" /></label>
    </div>
  </section>
  <div class="notice"><span aria-hidden="true">✓</span><span><strong>Modelo oficial preservado.</strong> Cabeçalho, rodapé, margens, fonte, paginação e bloco de assinaturas virão do parecer técnico de referência.</span></div>`;
}

function renderSingleImageUpload(kind, file, title, help, id = "") {
  if (file) {
    return `<div class="selected-file">
      <img src="${e(file.url)}" alt="Prévia de ${e(file.file.name)}" />
      <div class="selected-file-copy"><strong>${e(file.file.name)}</strong><small>${formatBytes(file.file.size)}</small></div>
      <button class="icon-button" type="button" data-action="remove-file" data-kind="${e(kind)}" data-id="${e(id)}" aria-label="Remover imagem">×</button>
    </div>`;
  }
  return `<label class="upload-box" data-upload-kind="${e(kind)}">
    <input type="file" accept="image/jpeg,image/png,image/bmp,image/gif,image/webp" data-file="${e(kind)}" data-id="${e(id)}" />
    <span class="upload-symbol" aria-hidden="true">+</span>
    <span class="upload-copy"><strong>${e(title)}</strong><span>${e(help)}</span></span>
  </label>`;
}

function renderReportMap() {
  const r = state.report;
  const streets = reportStreets();
  return `${pageHeading("Etapa 2", "Mapeie as vias vistoriadas", "Anexe o mapa e informe uma via por linha, na ordem em que deverão aparecer no parecer.")}
  <section class="panel">
    ${panelHeader("Mapa das vias vistoriadas", "Use uma imagem legível, de preferência com as vias destacadas.")}
    <div class="field stacked">
      <span class="field-label">Imagem do mapa *</span>
      ${renderSingleImageUpload("report-map", r.map, "Adicionar mapa", "JPEG, PNG, BMP, GIF ou WebP • até 20 MB")}
    </div>
    <label class="field stacked"><span>Legenda do mapa</span><input type="text" maxlength="300" data-bind="report.mapCaption" value="${e(r.mapCaption)}" placeholder="Ex.: Ruas vistoriadas destacadas em amarelo." /></label>
  </section>
  <section class="panel">
    ${panelHeader("Relação de vias", "Cada linha será inserida como um item da lista no documento final.")}
    <label class="field stacked"><span>Vias vistoriadas *</span><textarea data-bind="report.streets" maxlength="4000" placeholder="Rua Um&#10;Rua Dois&#10;Avenida Principal">${e(r.streets)}</textarea><span class="text-counter"><span>Uma via por linha</span><span>${streets.length} via(s)</span></span></label>
  </section>`;
}

function renderReportPhotos() {
  const r = state.report;
  const missing = r.photos.filter((photo) => !photo.description.trim()).length;
  return `${pageHeading("Etapa 3", "Organize as evidências", "Adicione as fotografias e informe o local e a condição observada em cada registro.")}
  <section class="panel">
    ${panelHeader("Adicionar fotografias", "Selecione várias imagens de uma vez ou arraste os arquivos para esta área.")}
    <label class="upload-box" data-drop="report-photos">
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
      <textarea data-photo-description="${e(photo.id)}" maxlength="700" placeholder="Ex.: Rua Um, altura do nº 100: recomposição irregular, com desnível e material de base exposto.">${e(photo.description)}</textarea>
    </div>
    <div class="photo-card-actions">
      <button class="icon-button" type="button" data-action="analyze-photo" data-id="${e(photo.id)}" aria-label="Descrever com IA" title="Descrever com IA">✦</button>
      <button class="icon-button" type="button" data-action="remove-photo" data-id="${e(photo.id)}" aria-label="Remover fotografia" title="Remover">×</button>
    </div>
  </article>`;
}

function renderReportContent() {
  const r = state.report;
  return `${pageHeading("Etapa 4", "Conclua o parecer", "Registre apenas as constatações verificadas, os impactos observados e as providências recomendadas.")}
  <section class="panel">
    ${panelHeader("Considerações finais", "Os três campos abaixo seguem a ordem do parecer técnico atual.")}
    <label class="field stacked"><span>Constatações técnicas *</span><textarea data-bind="report.findings" maxlength="5000" placeholder="Descreva as não conformidades verificadas, os materiais e os trechos afetados…">${e(r.findings)}</textarea><span class="text-counter"><span>Use somente fatos observados na vistoria</span><span>${r.findings.length}/5000</span></span></label>
    <label class="field stacked"><span>Impactos e riscos *</span><textarea data-bind="report.impacts" maxlength="3500" placeholder="Informe os efeitos sobre segurança, tráfego, mobilidade, drenagem ou conservação do pavimento…">${e(r.impacts)}</textarea><span class="text-counter"><span>Não atribua causa ou responsabilidade sem evidência</span><span>${r.impacts.length}/3500</span></span></label>
    <label class="field stacked"><span>Providências recomendadas *</span><textarea data-bind="report.recommendations" maxlength="3500">${e(r.recommendations)}</textarea><span class="text-counter"><span>Uma providência por linha</span><span>${reportRecommendations().length} item(ns)</span></span></label>
  </section>
  <section class="panel">
    ${panelHeader("Assinaturas do parecer", "Você pode marcar quantas pessoas forem necessárias. No Word, elas serão organizadas em duas colunas.", `<button class="button button-secondary" type="button" data-action="open-signatures">Cadastrar ou editar assinaturas</button>`)}
    ${renderReportSignatureChoices()}
    <div class="selected-signature-list">
      ${r.responsibles.length ? r.responsibles.map((signature, index) => `<article class="selected-signature-card">
        <span class="signatory-index">${String(index + 1).padStart(2, "0")}</span>
        <div class="signature-profile-copy"><strong>${e(signature.name)}</strong><em>${e(signature.role)}</em></div>
        <button class="icon-button" type="button" data-action="remove-report-signature" data-index="${index}" aria-label="Remover assinatura de ${e(signature.name)}" title="Remover">×</button>
      </article>`).join("") : `<div class="signature-profile-state"><strong>Nenhuma assinatura selecionada</strong><span>Marque uma ou mais pessoas na lista acima.</span></div>`}
    </div>
  </section>
  <section class="panel">
    ${panelHeader("Formato do anexo fotográfico", "As fotografias serão inseridas depois das assinaturas, em páginas próprias.")}
    <div class="choice-grid">
      <label class="choice-card"><input type="radio" name="photosPerPage" data-bind="report.onePerPage" value="true" ${r.onePerPage ? "checked" : ""} /><span><strong>Uma foto por página</strong><small>Maior legibilidade e espaço para a legenda técnica.</small></span></label>
      <label class="choice-card"><input type="radio" name="photosPerPage" data-bind="report.onePerPage" value="false" ${!r.onePerPage ? "checked" : ""} /><span><strong>Duas fotos por página</strong><small>Formato mais compacto para vistorias com muitas imagens.</small></span></label>
    </div>
  </section>`;
}

function renderReportReview() {
  const r = state.report;
  const described = r.photos.filter((photo) => photo.description.trim()).length;
  const streets = reportStreets();
  const recommendations = reportRecommendations();
  return `${pageHeading("Etapa 5", "Revise antes de gerar", "Confira os dados que serão aplicados ao modelo oficial. O Word será baixado no dispositivo.")}
  <div class="summary-grid">
    ${summaryCard("Documento", "Parecer técnico", formatDate(r.date))}
    ${summaryCard("Vias vistoriadas", String(streets.length), r.neighborhood)}
    ${summaryCard("Evidências", `${r.photos.length} foto(s)`, `${described} com descrição`)}
  </div>
  <section class="panel">
    <div class="review-block"><h3>Título</h3><p>${e(technicalOpinionTitle())}</p></div>
    <div class="review-block"><h3>Introdução</h3><p>${e(technicalOpinionIntroduction()[0])}</p></div>
    <div class="review-block"><h3>Vias</h3><p>${streets.map(e).join(" • ")}</p></div>
    <div class="review-block"><h3>Constatações</h3><p>${e(r.findings)}</p></div>
    <div class="review-block"><h3>Providências</h3><p>${recommendations.map(e).join(" • ")}</p></div>
    <div class="review-block"><h3>Responsáveis</h3><div class="review-signatures">${r.responsibles.map((signature) => signaturePreview(signature)).join("")}</div></div>
  </section>
  <div class="notice"><span aria-hidden="true">✓</span><span><strong>Geração local.</strong> Os campos, o mapa e as fotografias serão inseridos no Word no próprio navegador. Depois, somente o arquivo final será salvo no histórico da sua conta.</span></div>`;
}

function summaryCard(label, value, detail) {
  return `<article class="summary-card"><span>${e(label)}</span><strong>${e(value)}</strong><small>${e(detail)}</small></article>`;
}

function renderEtp() {
  return [
    renderEtpIdentification,
    renderEtpPlanning,
    renderEtpSolution,
    renderEtpResults,
    renderEtpRisks,
    renderEtpReview,
  ][state.step]();
}

function etpRequirements() {
  return String(state.etp.requirements || "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((item) => item.replace(/^\s*\d+(?:\.\d+)*\s*[-.)]?\s*/, "").trim())
    .filter(Boolean);
}

function renderEtpIdentification() {
  const d = state.etp;
  return `${pageHeading("Etapa 1", "Identifique o ETP", "Informe o objeto, o processo e a unidade responsável pelo estudo.")}
  <section class="panel">
    ${panelHeader("Informações básicas", "Esses dados abrem o documento e identificam a contratação.")}
    <label class="field stacked"><span>Objeto da contratação *</span><input type="text" maxlength="240" data-bind="etp.object" value="${e(d.object)}" placeholder="Ex.: Reforma e revitalização do Portal Dezenove de Maio" /></label>
    <div class="field-grid">
      <label class="field"><span>Nº do processo administrativo *</span><input type="text" maxlength="80" data-bind="etp.processNumber" value="${e(d.processNumber)}" placeholder="Ex.: 12595/2025" /></label>
      <label class="field"><span>Unidade requisitante *</span><input type="text" maxlength="240" data-bind="etp.requestingUnit" value="${e(d.requestingUnit)}" placeholder="Ex.: Setor de Planejamento Financeiro" /></label>
    </div>
    <div class="field-grid">
      <label class="field"><span>Cidade *</span><input type="text" maxlength="100" data-bind="etp.city" value="${e(d.city)}" /></label>
      <label class="field"><span>Data *</span><input type="date" data-bind="etp.date" value="${e(d.date)}" /></label>
    </div>
  </section>
  <div class="notice"><span aria-hidden="true">✓</span><span><strong>Modelo do ETP preservado.</strong> O arquivo final manterá o brasão, o cabeçalho, o rodapé, as margens, a paginação e a tipografia do documento anexado.</span></div>`;
}

function renderEtpPlanning() {
  const d = state.etp;
  return `${pageHeading("Etapa 2", "Descreva a necessidade e o planejamento", "Preencha a introdução e as três primeiras seções do ETP.")}
  <section class="panel etp-section-panel">
    ${panelHeader("Introdução", "Apresente de forma objetiva a contratação proposta.")}
    <label class="field stacked"><span>Texto da introdução *</span><textarea maxlength="6000" data-bind="etp.introduction" placeholder="Contextualize a contratação, o objeto e sua finalidade.">${e(d.introduction)}</textarea></label>
  </section>
  <section class="panel etp-section-panel">
    ${panelHeader("1 — Descrição da necessidade", "Explique o problema, a condição atual e a necessidade pública a ser atendida.")}
    <label class="field stacked"><span>Descrição da necessidade *</span><textarea maxlength="10000" data-bind="etp.needDescription">${e(d.needDescription)}</textarea></label>
  </section>
  <section class="panel etp-section-panel">
    ${panelHeader("2 — Previsão no Plano de Contratações Anual", "Registre a previsão no PCA e, quando houver, a origem dos recursos.")}
    <label class="field stacked"><span>Previsão no PCA *</span><textarea maxlength="6000" data-bind="etp.annualPlan">${e(d.annualPlan)}</textarea></label>
    <label class="field stacked"><span>Dotação ou fonte orçamentária</span><textarea maxlength="3000" data-bind="etp.budgetAllocation" placeholder="Informe a dotação, os vínculos ou a origem dos recursos, se aplicável.">${e(d.budgetAllocation)}</textarea></label>
  </section>
  <section class="panel etp-section-panel">
    ${panelHeader("3 — Requisitos da contratação", "Informe um requisito por linha; o Word numerará automaticamente como 3.1, 3.2 e assim por diante.")}
    <label class="field stacked"><span>Requisitos *</span><textarea maxlength="10000" data-bind="etp.requirements" placeholder="Lei e normas aplicáveis&#10;Qualificação técnica necessária&#10;Condições de execução">${e(d.requirements)}</textarea><span class="text-counter"><span>Um requisito por linha</span><span>${etpRequirements().length} requisito(s)</span></span></label>
  </section>`;
}

function renderEtpSolution() {
  const d = state.etp;
  return `${pageHeading("Etapa 3", "Registre quantidades, mercado e solução", "Preencha as seções 4 a 8 conforme os estudos e anexos disponíveis.")}
  <section class="panel etp-section-panel">
    ${panelHeader("4 — Estimativa das quantidades", "Indique os quantitativos, a memória de cálculo ou a referência ao anexo correspondente.")}
    <label class="field stacked"><span>Estimativa das quantidades *</span><textarea maxlength="7000" data-bind="etp.quantityEstimate">${e(d.quantityEstimate)}</textarea></label>
  </section>
  <section class="panel etp-section-panel">
    ${panelHeader("5 — Levantamento de mercado", "Descreva as alternativas pesquisadas e as fontes oficiais ou técnicas consultadas.")}
    <label class="field stacked"><span>Levantamento de mercado *</span><textarea maxlength="9000" data-bind="etp.marketSurvey">${e(d.marketSurvey)}</textarea></label>
  </section>
  <section class="panel etp-section-panel">
    ${panelHeader("6 — Estimativa do valor da contratação", "Informe o valor estimado e a base de cálculo, inclusive por extenso quando necessário.")}
    <label class="field stacked"><span>Estimativa de valor *</span><textarea maxlength="5000" data-bind="etp.estimatedValue" placeholder="Ex.: Conforme planilha de custos em anexo, o valor estimado é de R$…">${e(d.estimatedValue)}</textarea></label>
  </section>
  <section class="panel etp-section-panel">
    ${panelHeader("7 — Descrição da solução como um todo", "Explique a solução escolhida, seu escopo e as condições essenciais de execução.")}
    <label class="field stacked"><span>Descrição da solução *</span><textarea maxlength="9000" data-bind="etp.solutionDescription">${e(d.solutionDescription)}</textarea></label>
  </section>
  <section class="panel etp-section-panel">
    ${panelHeader("8 — Justificativa para parcelamento ou não", "Fundamente a decisão de parcelar ou executar o objeto de forma integrada.")}
    <label class="field stacked"><span>Justificativa *</span><textarea maxlength="7000" data-bind="etp.parcelingJustification">${e(d.parcelingJustification)}</textarea></label>
  </section>`;
}

function renderEtpResults() {
  const d = state.etp;
  return `${pageHeading("Etapa 4", "Detalhe resultados, providências e impactos", "Preencha as seções 9 a 13 com as informações verificadas para a contratação.")}
  <section class="panel etp-section-panel">
    ${panelHeader("9 — Demonstrativo dos resultados pretendidos", "Registre os resultados esperados e, se aplicável, as dimensões social e operacional.")}
    <label class="field stacked"><span>Resultados pretendidos *</span><textarea maxlength="9000" data-bind="etp.expectedResults">${e(d.expectedResults)}</textarea></label>
    <div class="field-grid">
      <label class="field stacked"><span>Apreciação social</span><textarea maxlength="5000" data-bind="etp.socialAssessment">${e(d.socialAssessment)}</textarea></label>
      <label class="field stacked"><span>Qualificação operacional</span><textarea maxlength="5000" data-bind="etp.operationalQualification">${e(d.operationalQualification)}</textarea></label>
    </div>
  </section>
  <section class="panel etp-section-panel">
    ${panelHeader("10 — Providências prévias ao contrato", "Informe as providências administrativas ou técnicas necessárias, ou registre que não se aplica.")}
    <label class="field stacked"><span>Providências prévias *</span><textarea maxlength="5000" data-bind="etp.priorMeasures">${e(d.priorMeasures)}</textarea></label>
  </section>
  <section class="panel etp-section-panel">
    ${panelHeader("11 — Contratações correlatas ou interdependentes", "Relacione outras contratações vinculadas, ou registre que não se aplica.")}
    <label class="field stacked"><span>Contratações correlatas *</span><textarea maxlength="5000" data-bind="etp.relatedContracts">${e(d.relatedContracts)}</textarea></label>
  </section>
  <section class="panel etp-section-panel">
    ${panelHeader("12 — Impactos ambientais", "Identifique impactos e medidas de prevenção, mitigação e destinação de resíduos.")}
    <label class="field stacked"><span>Impactos ambientais *</span><textarea maxlength="10000" data-bind="etp.environmentalImpacts">${e(d.environmentalImpacts)}</textarea></label>
  </section>
  <section class="panel etp-section-panel">
    ${panelHeader("13 — Licença, autorização ou manifestação", "Informe as licenças e autorizações necessárias, ou registre que não se aplica.")}
    <label class="field stacked"><span>Licenças e autorizações *</span><textarea maxlength="5000" data-bind="etp.licenses">${e(d.licenses)}</textarea></label>
  </section>`;
}

function renderEtpRisk(risk, index) {
  const options = (value) => ["", "Baixa", "Média", "Alta"].map((option) =>
    `<option value="${e(option)}" ${value === option ? "selected" : ""}>${e(option || "Selecione")}</option>`
  ).join("");
  return `<article class="etp-risk-card" data-etp-risk-id="${e(risk.id)}">
    <div class="etp-risk-heading"><div><span>Risco ${index + 1}</span><strong>${e(risk.title || "Novo risco")}</strong></div><button class="icon-button" type="button" data-action="remove-etp-risk" data-id="${e(risk.id)}" aria-label="Remover risco ${index + 1}" ${state.etp.risks.length === 1 ? "disabled" : ""}>×</button></div>
    <label class="field stacked"><span>Risco *</span><input type="text" maxlength="240" data-bind="etp.risks.${index}.title" value="${e(risk.title)}" placeholder="Ex.: Viabilidade técnica e operacional" /></label>
    <div class="field-grid">
      <label class="field"><span>Probabilidade *</span><select data-bind="etp.risks.${index}.probability">${options(risk.probability)}</select></label>
      <label class="field"><span>Impacto *</span><select data-bind="etp.risks.${index}.impact">${options(risk.impact)}</select></label>
    </div>
    <label class="field stacked"><span>Dano *</span><textarea maxlength="3000" data-bind="etp.risks.${index}.damage">${e(risk.damage)}</textarea></label>
    <div class="field-grid">
      <label class="field stacked"><span>Ação preventiva *</span><textarea maxlength="3000" data-bind="etp.risks.${index}.preventiveAction">${e(risk.preventiveAction)}</textarea></label>
      <label class="field stacked"><span>Ação de contingência *</span><textarea maxlength="3000" data-bind="etp.risks.${index}.contingencyAction">${e(risk.contingencyAction)}</textarea></label>
    </div>
  </article>`;
}

function renderEtpRisks() {
  const d = state.etp;
  return `${pageHeading("Etapa 5", "Mapeie os riscos e responsáveis", "Registre os riscos da contratação e selecione quem assinará o estudo.")}
  <section class="panel">
    ${panelHeader("14 — Gerenciamento de riscos", "Cada risco será apresentado em uma tabela de seis linhas, como no ETP de referência.", `<button class="button button-secondary" type="button" data-action="add-etp-risk">Adicionar risco</button>`)}
    <div class="etp-risk-list">${d.risks.map(renderEtpRisk).join("")}</div>
  </section>
  <section class="panel">
    ${panelHeader("Assinaturas do ETP", "Selecione uma ou mais pessoas responsáveis pelo documento.", `<button class="button button-secondary" type="button" data-action="open-signatures">Cadastrar ou editar assinaturas</button>`)}
    ${renderEtpSignatureChoices()}
    <div class="selected-signature-list">
      ${d.responsibles.length ? d.responsibles.map((signature, index) => `<article class="selected-signature-card">
        <span class="signatory-index">${String(index + 1).padStart(2, "0")}</span>
        <div class="signature-profile-copy"><strong>${e(signature.name)}</strong><em>${e(signature.role)}</em></div>
        <button class="icon-button" type="button" data-action="remove-etp-signature" data-index="${index}" aria-label="Remover assinatura de ${e(signature.name)}" title="Remover">×</button>
      </article>`).join("") : `<div class="signature-profile-state"><strong>Nenhuma assinatura selecionada</strong><span>Marque uma ou mais pessoas na lista acima.</span></div>`}
    </div>
  </section>`;
}

function renderEtpReview() {
  const d = state.etp;
  return `${pageHeading("Etapa 6", "Revise antes de gerar", "Confira a identificação, as 14 seções, os riscos e as assinaturas.")}
  <div class="summary-grid">
    ${summaryCard("Documento", "ETP", d.processNumber)}
    ${summaryCard("Seções técnicas", "14", d.object)}
    ${summaryCard("Riscos", String(d.risks.length), `${d.responsibles.length} responsável(is)`) }
  </div>
  <section class="panel">
    <div class="review-block"><h3>Objeto</h3><p>${e(d.object)}</p></div>
    <div class="review-block"><h3>Unidade requisitante</h3><p>${e(d.requestingUnit)}</p></div>
    <div class="review-block"><h3>Descrição da necessidade</h3><p>${e(d.needDescription)}</p></div>
    <div class="review-block"><h3>Solução</h3><p>${e(d.solutionDescription)}</p></div>
    <div class="review-block"><h3>Resultados pretendidos</h3><p>${e(d.expectedResults)}</p></div>
    <div class="review-block"><h3>Riscos</h3><p>${d.risks.map((risk, index) => `${index + 1}. ${e(risk.title)}`).join(" • ")}</p></div>
    <div class="review-block"><h3>Responsáveis</h3><div class="review-signatures">${d.responsibles.map((signature) => signaturePreview(signature)).join("")}</div></div>
  </section>
  <div class="notice"><span aria-hidden="true">✓</span><span><strong>Formatação oficial preservada.</strong> O Word será criado a partir do ETP anexado, com o mesmo timbre, rodapé, margens, paginação, tabelas e assinatura.</span></div>`;
}

function renderTr() {
  return [renderTrIdentification, renderTrConditions, renderTrQualification, renderTrManagement, renderTrReview][state.step]();
}

function renderTrIdentification() {
  const d = state.tr;
  return `${pageHeading("Etapa 1", "Identifique o Termo de Referência", "Os campos abaixo correspondem aos primeiros trechos em vermelho do modelo anexado.")}
  <section class="panel">
    ${panelHeader("Objeto e local", "O texto preto, os títulos e a numeração permanecerão exatamente como estão no documento-base.")}
    <label class="field stacked"><span>Objeto da contratação *</span><input type="text" maxlength="300" data-bind="tr.object" value="${e(d.object)}" placeholder="Ex.: REFORMA DO PORTAL DEZENOVE DE MAIO" /></label>
    <label class="field stacked"><span>Localidade *</span><input type="text" maxlength="300" data-bind="tr.location" value="${e(d.location)}" placeholder="Ex.: Avenida Dezenove de Maio – Centro – Bertioga / SP" /></label>
  </section>
  <section class="panel">
    ${panelHeader("Área de intervenção", "A imagem ocupará o lugar indicado em vermelho como ANEXAR IMAGEM.")}
    <div class="field stacked"><span class="field-label">Imagem da área de intervenção *</span>${renderSingleImageUpload("tr-image", d.interventionImage, "Adicionar imagem", "JPEG, PNG, BMP, GIF ou WebP • até 20 MB")}</div>
  </section>
  <div class="notice"><span aria-hidden="true">✓</span><span><strong>Modelo oficial preservado.</strong> O brasão, o cabeçalho, as margens, os tópicos, o texto normativo e a paginação virão do TR anexado.</span></div>`;
}

function renderTrConditions() {
  const d = state.tr;
  return `${pageHeading("Etapa 2", "Preencha as condições gerais", "Informe somente os valores que aparecem em vermelho no modelo.")}
  <section class="panel">
    ${panelHeader("Prazos da contratação", "O mesmo prazo será aplicado à vigência e à execução, mantendo as frases originais.")}
    <div class="field-grid">
      <label class="field"><span>Prazo em número *</span><input type="text" maxlength="20" data-bind="tr.durationNumber" value="${e(d.durationNumber)}" placeholder="Ex.: 6" /></label>
      <label class="field"><span>Prazo por extenso *</span><input type="text" maxlength="80" data-bind="tr.durationWords" value="${e(d.durationWords)}" placeholder="Ex.: seis" /></label>
    </div>
  </section>
  <section class="panel">
    ${panelHeader("Valor e licitação", "Escreva o valor por extenso sem parênteses; o documento os acrescentará automaticamente.")}
    <div class="field-grid">
      <label class="field"><span>Valor estimado *</span><input type="text" maxlength="60" data-bind="tr.estimatedCost" value="${e(d.estimatedCost)}" placeholder="Ex.: 376.238,37" /></label>
      <label class="field"><span>Modalidade *</span><input type="text" maxlength="120" data-bind="tr.bidMode" value="${e(d.bidMode)}" placeholder="Ex.: Concorrência" /></label>
    </div>
    <label class="field stacked"><span>Valor por extenso *</span><textarea maxlength="500" data-bind="tr.estimatedCostWords" placeholder="Ex.: trezentos e setenta e seis mil, duzentos e trinta e oito reais e trinta e sete centavos">${e(d.estimatedCostWords)}</textarea></label>
    <label class="field stacked"><span>Referência de preços *</span><input type="text" maxlength="400" data-bind="tr.priceReference" value="${e(d.priceReference)}" placeholder="Ex.: CDHU 202 ONERADO e SINAPI 05-2026 – ONERADA." /></label>
  </section>`;
}

function renderTrQualification() {
  const d = state.tr;
  return `${pageHeading("Etapa 3", "Revise a qualificação técnica", "Cada campo corresponde a um parágrafo vermelho das páginas 5 e 6 do modelo.")}
  <section class="panel tr-section-panel">
    ${panelHeader("Definição das parcelas relevantes", "Adapte os critérios e serviços à contratação atual.")}
    <label class="field stacked"><span>Critérios de relevância *</span><textarea maxlength="5000" data-bind="tr.relevanceCriteria">${e(d.relevanceCriteria)}</textarea></label>
    <label class="field stacked"><span>Serviço acessório não selecionado *</span><textarea maxlength="5000" data-bind="tr.accessoryService">${e(d.accessoryService)}</textarea></label>
    <label class="field stacked"><span>Serviços de maior relevância *</span><textarea maxlength="5000" data-bind="tr.relevantServices">${e(d.relevantServices)}</textarea></label>
  </section>
  <section class="panel tr-section-panel">
    ${panelHeader("Qualificação técnico-operacional", "Mantenha a numeração interna no próprio texto quando ela for necessária.")}
    <label class="field stacked"><span>Exigência técnico-operacional *</span><textarea maxlength="7000" data-bind="tr.operationalQualification">${e(d.operationalQualification)}</textarea></label>
    <div class="field-grid">
      <label class="field stacked"><span>Serviço relevante 1 *</span><textarea maxlength="1500" data-bind="tr.relevantService1">${e(d.relevantService1)}</textarea></label>
      <label class="field stacked"><span>Serviço relevante 2 *</span><textarea maxlength="1500" data-bind="tr.relevantService2">${e(d.relevantService2)}</textarea></label>
    </div>
  </section>
  <section class="panel tr-section-panel">
    ${panelHeader("Qualificação técnico-profissional", "Todos estes textos continuarão nos mesmos tópicos e com a mesma formatação do TR.")}
    <label class="field stacked"><span>Qualificação profissional *</span><textarea maxlength="5000" data-bind="tr.professionalQualification">${e(d.professionalQualification)}</textarea></label>
    <label class="field stacked"><span>Profissionais habilitados *</span><textarea maxlength="4000" data-bind="tr.eligibleProfessionals">${e(d.eligibleProfessionals)}</textarea></label>
    <label class="field stacked"><span>Somatório de atestados *</span><textarea maxlength="4000" data-bind="tr.certificateAggregation">${e(d.certificateAggregation)}</textarea></label>
    <label class="field stacked"><span>Compatibilidade dos conselhos *</span><textarea maxlength="4000" data-bind="tr.councilCompatibility">${e(d.councilCompatibility)}</textarea></label>
    <label class="field stacked"><span>Vínculo do detentor do acervo *</span><textarea maxlength="4000" data-bind="tr.professionalBond">${e(d.professionalBond)}</textarea></label>
  </section>`;
}

function renderTrManagement() {
  const d = state.tr;
  return `${pageHeading("Etapa 4", "Informe gestão e assinatura", "Complete os últimos trechos em vermelho do documento.")}
  <section class="panel">
    ${panelHeader("Gestor e fiscais", "O texto será inserido depois das palavras “pelo gestor”, exatamente no item 8.5.")}
    <label class="field stacked"><span>Identificação do gestor e dos fiscais *</span><textarea maxlength="2500" data-bind="tr.management" placeholder="Ex.: Nome – cargo – reg. 0000 e pelo fiscal Eng. Nome – reg. 0000 da Secretaria…">${e(d.management)}</textarea></label>
  </section>
  <section class="panel">
    ${panelHeader("Emissão e assinatura", "Escolha uma assinatura já cadastrada; nome e cargo ocuparão os dois últimos campos vermelhos.", `<button class="button button-secondary" type="button" data-action="open-signatures">Configurar assinaturas</button>`)}
    <div class="field-grid">
      <label class="field"><span>Cidade *</span><input type="text" maxlength="100" data-bind="tr.city" value="${e(d.city)}" /></label>
      <label class="field"><span>Data *</span><input type="date" data-bind="tr.date" value="${e(d.date)}" /></label>
    </div>
    <label class="field signature-select-field"><span>Pessoa que vai assinar *</span><select data-signature-target="tr" ${state.signatures.loading ? "disabled" : ""}>${signatureSelectOptions(d.signerProfileId, "Selecione uma pessoa")}</select></label>
    ${signaturePreview({ name: d.signerName, role: d.signerRole }, "Nenhuma assinatura selecionada")}
  </section>`;
}

function renderTrReview() {
  const d = state.tr;
  return `${pageHeading("Etapa 5", "Revise o Termo de Referência", "Confira os dados variáveis antes de gerar o Word.")}
  <div class="summary-grid">
    ${summaryCard("Documento", "Termo de Referência", d.object)}
    ${summaryCard("Vigência e execução", `${d.durationNumber} (${d.durationWords}) meses`, d.bidMode)}
    ${summaryCard("Valor estimado", `R$ ${d.estimatedCost}`, d.priceReference)}
  </div>
  <section class="panel review-panel">
    <div class="review-block"><h3>Localidade</h3><p>${e(d.location)}</p></div>
    <div class="review-block"><h3>Imagem da área</h3><p>${e(d.interventionImage?.file?.name || "Nenhuma imagem anexada")}</p></div>
    <div class="review-block"><h3>Gestor e fiscais</h3><p>${e(d.management)}</p></div>
    <div class="review-block"><h3>Assinatura</h3>${signaturePreview({ name: d.signerName, role: d.signerRole })}</div>
  </section>
  <div class="notice"><span aria-hidden="true">✓</span><span><strong>Formatação do anexo preservada.</strong> O arquivo final manterá o mesmo cabeçalho, os tópicos, o texto preto, as cores, as margens e a paginação do modelo de TR.</span></div>`;
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
  const drainage = state.flow === "drainage";
  return `<section class="panel progress-card">
    <div class="progress-orbit"><div class="progress-mark">D</div></div>
    <h2>${drainage ? "Preparando a planilha" : "Preparando o documento"}</h2>
    <p id="progressMessage">${e(state.generation.message || "Organizando o conteúdo…")}</p>
    <div class="progress-line"><span id="progressBar" style="width:${state.generation.progress}%"></span></div>
  </section>`;
}

function renderSuccess() {
  if (state.flow === "drainage") {
    return `<section class="panel success-card drainage-success-card">
      <div class="success-mark">✓</div>
      <h2>Quantitativo criado</h2>
      <p>A planilha Excel com sete abas foi gerada com os valores calculados, adotados e a memória de cada serviço.</p>
      <div class="success-actions">
        <button class="button button-secondary" type="button" data-action="home">Voltar ao início</button>
        <button class="button button-secondary" type="button" data-action="new-document">Novo quantitativo</button>
        <button class="button button-primary" type="button" data-action="download-again">Baixar novamente</button>
      </div>
    </section>`;
  }
  const documentLabel = state.flow === "report"
    ? "O parecer técnico"
    : state.flow === "etp"
      ? "O Estudo Técnico Preliminar"
    : state.flow === "tr"
      ? "O Termo de Referência"
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
  const cardKey = flow === "correspondence" ? kind : flow;
  if (!canAccessHomeCard(cardKey)) {
    showToast("Este card não está liberado para a sua conta.");
    return;
  }
  state.admin.open = false;
  state.history.open = false;
  state.processes.open = false;
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
  pushNavigationState();
  focusMain();
}

function goHome() {
  state.flow = null;
  state.admin.open = false;
  state.history.open = false;
  state.processes.open = false;
  state.kanban.open = false;
  state.step = 0;
  state.validationFields = [];
  state.generation.running = false;
  render();
  pushNavigationState();
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
    pushNavigationState();
    focusMain();
    return;
  }
  if (state.flow === "drainage") generateDrainageSpreadsheet();
  else if (state.flow === "report") generateReport();
  else if (state.flow === "etp") generateEtp();
  else if (state.flow === "tr") generateTr();
  else if (state.flow === "cota") generateCota();
  else if (isNoticeFlow()) generateNotification();
  else generateCorrespondence();
}

function previousStep() {
  if (window.history.state?.[APP_HISTORY_KEY]) {
    window.history.back();
    return;
  }
  if (state.step === 0) goHome();
  else {
    state.step -= 1;
    state.validationFields = [];
    render();
    focusMain();
  }
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

function validateEtpStep() {
  const d = state.etp;
  const showMissing = (title, text, fields) => {
    showFieldValidationMessage({ title, text, fields: fields.filter(Boolean) });
    return false;
  };
  if (state.step === 0 && (!d.object.trim() || !d.processNumber.trim() || !d.requestingUnit.trim() || !d.city.trim() || !d.date)) {
    return showMissing("Complete a identificação", "Informe o objeto, o processo, a unidade requisitante, a cidade e a data.", [
      !d.object.trim() && '[data-bind="etp.object"]',
      !d.processNumber.trim() && '[data-bind="etp.processNumber"]',
      !d.requestingUnit.trim() && '[data-bind="etp.requestingUnit"]',
      !d.city.trim() && '[data-bind="etp.city"]',
      !d.date && '[data-bind="etp.date"]',
    ]);
  }
  if (state.step === 1 && (!d.introduction.trim() || !d.needDescription.trim() || !d.annualPlan.trim() || !etpRequirements().length)) {
    return showMissing("Complete a necessidade e o planejamento", "Preencha a introdução, a descrição da necessidade, a previsão no PCA e pelo menos um requisito.", [
      !d.introduction.trim() && '[data-bind="etp.introduction"]',
      !d.needDescription.trim() && '[data-bind="etp.needDescription"]',
      !d.annualPlan.trim() && '[data-bind="etp.annualPlan"]',
      !etpRequirements().length && '[data-bind="etp.requirements"]',
    ]);
  }
  if (state.step === 2 && (!d.quantityEstimate.trim() || !d.marketSurvey.trim() || !d.estimatedValue.trim() || !d.solutionDescription.trim() || !d.parcelingJustification.trim())) {
    return showMissing("Complete o estudo da solução", "Preencha as estimativas, o levantamento de mercado, a solução e a justificativa de parcelamento.", [
      !d.quantityEstimate.trim() && '[data-bind="etp.quantityEstimate"]',
      !d.marketSurvey.trim() && '[data-bind="etp.marketSurvey"]',
      !d.estimatedValue.trim() && '[data-bind="etp.estimatedValue"]',
      !d.solutionDescription.trim() && '[data-bind="etp.solutionDescription"]',
      !d.parcelingJustification.trim() && '[data-bind="etp.parcelingJustification"]',
    ]);
  }
  if (state.step === 3 && (!d.expectedResults.trim() || !d.priorMeasures.trim() || !d.relatedContracts.trim() || !d.environmentalImpacts.trim() || !d.licenses.trim())) {
    return showMissing("Complete os resultados e impactos", "Preencha os resultados pretendidos, as providências, as contratações relacionadas, os impactos ambientais e as licenças.", [
      !d.expectedResults.trim() && '[data-bind="etp.expectedResults"]',
      !d.priorMeasures.trim() && '[data-bind="etp.priorMeasures"]',
      !d.relatedContracts.trim() && '[data-bind="etp.relatedContracts"]',
      !d.environmentalImpacts.trim() && '[data-bind="etp.environmentalImpacts"]',
      !d.licenses.trim() && '[data-bind="etp.licenses"]',
    ]);
  }
  if (state.step === 4) {
    const invalidRiskIndexes = d.risks.map((risk, index) => ({ risk, index })).filter(({ risk }) =>
      !risk.title.trim() || !risk.probability || !risk.impact || !risk.damage.trim() || !risk.preventiveAction.trim() || !risk.contingencyAction.trim()
    );
    if (invalidRiskIndexes.length || !d.responsibles.length) {
      const riskFields = invalidRiskIndexes.flatMap(({ risk, index }) => [
        !risk.title.trim() && `[data-bind="etp.risks.${index}.title"]`,
        !risk.probability && `[data-bind="etp.risks.${index}.probability"]`,
        !risk.impact && `[data-bind="etp.risks.${index}.impact"]`,
        !risk.damage.trim() && `[data-bind="etp.risks.${index}.damage"]`,
        !risk.preventiveAction.trim() && `[data-bind="etp.risks.${index}.preventiveAction"]`,
        !risk.contingencyAction.trim() && `[data-bind="etp.risks.${index}.contingencyAction"]`,
      ].filter(Boolean));
      return showMissing("Complete os riscos e as assinaturas", "Preencha todos os campos de cada risco e selecione pelo menos uma pessoa responsável pelo ETP.", [
        ...riskFields,
        !d.responsibles.length && '[data-etp-signature-group]',
      ]);
    }
  }
  return true;
}

function validateTrStep() {
  const d = state.tr;
  const showMissing = (title, text, fields) => {
    showFieldValidationMessage({ title, text, fields: fields.filter(Boolean) });
    return false;
  };
  if (state.step === 0 && (!d.object.trim() || !d.location.trim() || !d.interventionImage)) {
    return showMissing("Complete a identificação do TR", "Informe o objeto, a localidade e anexe a imagem da área de intervenção.", [
      !d.object.trim() && '[data-bind="tr.object"]',
      !d.location.trim() && '[data-bind="tr.location"]',
      !d.interventionImage && '[data-upload-kind="tr-image"]',
    ]);
  }
  if (state.step === 1 && (!d.durationNumber.trim() || !d.durationWords.trim() || !d.estimatedCost.trim() || !d.estimatedCostWords.trim() || !d.priceReference.trim() || !d.bidMode.trim())) {
    return showMissing("Complete as condições gerais", "Informe prazo, valor, referência de preços e modalidade da licitação.", [
      !d.durationNumber.trim() && '[data-bind="tr.durationNumber"]',
      !d.durationWords.trim() && '[data-bind="tr.durationWords"]',
      !d.estimatedCost.trim() && '[data-bind="tr.estimatedCost"]',
      !d.estimatedCostWords.trim() && '[data-bind="tr.estimatedCostWords"]',
      !d.priceReference.trim() && '[data-bind="tr.priceReference"]',
      !d.bidMode.trim() && '[data-bind="tr.bidMode"]',
    ]);
  }
  if (state.step === 2) {
    const qualificationFields = [
      ["relevanceCriteria", d.relevanceCriteria],
      ["accessoryService", d.accessoryService],
      ["relevantServices", d.relevantServices],
      ["operationalQualification", d.operationalQualification],
      ["relevantService1", d.relevantService1],
      ["relevantService2", d.relevantService2],
      ["professionalQualification", d.professionalQualification],
      ["eligibleProfessionals", d.eligibleProfessionals],
      ["certificateAggregation", d.certificateAggregation],
      ["councilCompatibility", d.councilCompatibility],
      ["professionalBond", d.professionalBond],
    ];
    const missing = qualificationFields.filter(([, value]) => !value.trim());
    if (missing.length) {
      return showMissing("Complete a qualificação técnica", "Revise e mantenha conteúdo em todos os parágrafos variáveis das páginas 5 e 6.", missing.map(([key]) => `[data-bind="tr.${key}"]`));
    }
  }
  if (state.step === 3 && (!d.management.trim() || !d.city.trim() || !d.date || !d.signerName.trim() || !d.signerRole.trim())) {
    return showMissing("Complete gestão e assinatura", "Informe o gestor e os fiscais, a data e a pessoa que assinará o Termo de Referência.", [
      !d.management.trim() && '[data-bind="tr.management"]',
      !d.city.trim() && '[data-bind="tr.city"]',
      !d.date && '[data-bind="tr.date"]',
      (!d.signerName.trim() || !d.signerRole.trim()) && '[data-signature-target="tr"]',
    ]);
  }
  return true;
}

function validateCurrentStep() {
  clearValidationHighlights();
  if (state.flow === "drainage") return validateDrainageStep();
  if (state.flow === "etp") return validateEtpStep();
  if (state.flow === "tr") return validateTrStep();
  if (state.flow === "report") {
    const r = state.report;
    if (state.step === 0) {
      if (!r.city.trim() || !r.date || !r.neighborhood.trim() || !r.responsibleCompany.trim() || !r.intervention.trim()) {
        showFieldValidationMessage({
          title: "Complete a identificação",
          text: "Informe a cidade, a data, o bairro, a empresa responsável e a intervenção fiscalizada.",
          fields: [
            !r.city.trim() && '[data-bind="report.city"]',
            !r.date && '[data-bind="report.date"]',
            !r.neighborhood.trim() && '[data-bind="report.neighborhood"]',
            !r.responsibleCompany.trim() && '[data-bind="report.responsibleCompany"]',
            !r.intervention.trim() && '[data-bind="report.intervention"]',
          ],
        });
        return false;
      }
    }
    if (state.step === 1) {
      if (!r.map || !reportStreets().length) {
        showFieldValidationMessage({
          title: "Complete o mapa e as vias",
          text: "Anexe o mapa da vistoria e informe pelo menos uma via.",
          fields: [
            !r.map && '[data-upload-kind="report-map"]',
            !reportStreets().length && '[data-bind="report.streets"]',
          ],
        });
        return false;
      }
    }
    if (state.step === 2) {
      if (!r.photos.length) {
        showFieldValidationMessage({
          title: "Adicione as fotografias",
          text: "Selecione pelo menos uma evidência fotográfica para o anexo do parecer.",
          fields: ['[data-drop="report-photos"]'],
        });
        return false;
      }
      const photosWithoutDescription = r.photos.filter((photo) => !photo.description.trim());
      if (photosWithoutDescription.length) {
        showFieldValidationMessage({
          title: "Descreva todas as fotografias",
          text: "Informe o local e a condição observada em cada evidência, ou remova a fotografia.",
          fields: photosWithoutDescription.map((photo) => `[data-photo-description="${photo.id}"]`),
        });
        return false;
      }
    }
    if (state.step === 3) {
      if (!r.findings.trim() || !r.impacts.trim() || !reportRecommendations().length) {
        showFieldValidationMessage({
          title: "Complete as considerações finais",
          text: "Informe as constatações, os impactos e pelo menos uma providência recomendada.",
          fields: [
            !r.findings.trim() && '[data-bind="report.findings"]',
            !r.impacts.trim() && '[data-bind="report.impacts"]',
            !reportRecommendations().length && '[data-bind="report.recommendations"]',
          ],
        });
        return false;
      }
      if (!r.responsibles.length) {
        showFieldValidationMessage({
          title: "Selecione as assinaturas",
          text: "Marque pelo menos uma pessoa. Você pode incluir quantos responsáveis forem necessários.",
          fields: ['[data-report-signature-group]'],
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

function validateDrainageStep() {
  const drainage = state.drainage;
  if (state.step === 0) {
    const invalidFields = [
      !String(drainage.project.name || "").trim() && '[data-bind="drainage.project.name"]',
      !String(drainage.project.neighborhood || "").trim() && '[data-bind="drainage.project.neighborhood"]',
      drainageNumber(drainage.project.extension) <= 0 && '[data-bind="drainage.project.extension"]',
      drainageNumber(drainage.project.roadWidth) <= 0 && '[data-bind="drainage.project.roadWidth"]',
      !String(drainage.project.responsible || "").trim() && '[data-bind="drainage.project.responsible"]',
      !String(drainage.project.date || "").trim() && '[data-bind="drainage.project.date"]',
      (drainageNumber(drainage.project.standardLoss) < 0 || drainageNumber(drainage.project.standardLoss) > 100) && '[data-bind="drainage.project.standardLoss"]',
    ].filter(Boolean);
    if (invalidFields.length) {
      showFieldValidationMessage({
        title: "Complete os dados da obra",
        text: "Informe obra, bairro, extensão, largura, responsável, data e uma perda entre 0% e 100%.",
        fields: invalidFields,
      });
      return false;
    }
  }
  if (state.step === 1 && !drainageActiveServiceCount()) {
    showFieldValidationMessage({
      title: "Selecione um serviço",
      text: "Ative pelo menos um serviço para montar o quantitativo.",
      fields: ["[data-drainage-service-grid]"],
    });
    return false;
  }
  if (state.step === 2) {
    const positivePaths = [];
    const percentagePaths = [];
    if (drainage.services.bl) {
      positivePaths.push(...drainageStructurePositivePaths("bl"));
      percentagePaths.push("drainage.bl.loss");
    }
    if (drainage.services.pv) {
      positivePaths.push(...drainageStructurePositivePaths("pv"));
      percentagePaths.push("drainage.pv.loss");
    }
    if (drainage.services.pipes) {
      drainage.pipes.forEach((pipe, index) => {
        positivePaths.push(`drainage.pipes.${index}.extension`, `drainage.pipes.${index}.commercialLength`);
        percentagePaths.push(`drainage.pipes.${index}.loss`);
        if (!String(pipe.diameter || "").trim()) positivePaths.push(`drainage.pipes.${index}.diameter`);
      });
    }
    if (drainage.services.pavement) {
      positivePaths.push("drainage.pavement.length", "drainage.pavement.width", "drainage.pavement.effectiveArea", "drainage.pavement.bedThicknessCm", "drainage.pavement.baseThicknessCm", "drainage.pavement.interlockingCoefficient");
    }
    if (drainage.services.gutter) {
      positivePaths.push("drainage.gutter.length", "drainage.gutter.width", "drainage.gutter.thickness");
      percentagePaths.push("drainage.gutter.loss");
    }
    const invalidFields = [
      ...positivePaths.filter((path) => path.endsWith(".diameter")
        ? !String(drainageValueAtPath(path) || "").trim()
        : drainageNumber(drainageValueAtPath(path)) <= 0),
      ...percentagePaths.filter((path) => {
        const value = drainageNumber(drainageValueAtPath(path));
        return value < 0 || value > 100;
      }),
    ].map((path) => `[data-bind="${path}"]`);
    if (invalidFields.length) {
      showFieldValidationMessage({
        title: "Revise os parâmetros",
        text: "Preencha dimensões e quantidades maiores que zero e mantenha as perdas entre 0% e 100%.",
        fields: invalidFields,
      });
      return false;
    }
  }
  if (state.step === 3) {
    const results = calculateDrainageResults().rows;
    const invalid = results.filter((row) => drainageAdoptedValue(row) < 0);
    if (!results.length || invalid.length) {
      showFieldValidationMessage({
        title: "Revise os quantitativos adotados",
        text: "Os valores adotados precisam ser iguais ou maiores que zero.",
        fields: invalid.map((row) => `[data-drainage-adopted="${row.id}"]`),
      });
      return false;
    }
  }
  return true;
}

function drainageStructurePositivePaths(key) {
  return [
    "quantity", "internalLength", "internalWidth", "height", "wallThickness",
    "blockWidthCm", "blockHeightCm", "blockLengthCm", "channelLengthCm", "channelRows",
  ].map((field) => `drainage.${key}.${field}`);
}

function drainageValueAtPath(path) {
  return path.split(".").reduce((value, key) => value?.[key], state);
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
  if (["report.findings", "report.impacts"].includes(target.dataset.bind)) {
    const counter = target.parentElement.querySelector(".text-counter span:last-child");
    const limit = target.dataset.bind === "report.findings" ? 5000 : 3500;
    if (counter) counter.textContent = `${target.value.length}/${limit}`;
  }
  if (target.dataset.bind === "report.streets") {
    const counter = target.parentElement.querySelector(".text-counter span:last-child");
    if (counter) counter.textContent = `${reportStreets().length} via(s)`;
  }
  if (target.dataset.bind === "report.recommendations") {
    const counter = target.parentElement.querySelector(".text-counter span:last-child");
    if (counter) counter.textContent = `${reportRecommendations().length} item(ns)`;
  }
  if (target.dataset.bind === "etp.requirements") {
    const counter = target.parentElement.querySelector(".text-counter span:last-child");
    if (counter) counter.textContent = `${etpRequirements().length} requisito(s)`;
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

async function handleFiles(kind, files) {
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
  if (kind === "report-map") replaceImageRecord(state.report, "map", record);
  if (kind === "cota-context") replaceImageRecord(state.cota, "contextImage", record);
  if (kind === "tr-image") replaceImageRecord(state.tr, "interventionImage", record);
  render();
}

function replaceImageRecord(owner, key, record) {
  if (owner[key]?.url) URL.revokeObjectURL(owner[key].url);
  owner[key] = record;
}

function removeFile(kind) {
  if (kind === "report-map") replaceImageRecord(state.report, "map", null);
  if (kind === "cota-context") replaceImageRecord(state.cota, "contextImage", null);
  if (kind === "tr-image") replaceImageRecord(state.tr, "interventionImage", null);
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
      pushNavigationState();
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
    if (advanceOnSuccess) pushNavigationState();
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
  state.generation = { running: true, progress: 8, message: "Organizando o parecer técnico…" };
  render();
  try {
    const blob = await buildReportDocument((progress, message) => setGenerationProgress(progress, message));
    const filename = `parecer-tecnico-${slugify(state.report.neighborhood, "vistoria")}.docx`;
    await finishDownload(blob, filename, "Parecer técnico");
    state.report.complete = true;
    state.generation.running = false;
    render();
    pushNavigationState();
  } catch (error) {
    state.generation.running = false;
    render();
    showMessage({ title: "Não foi possível gerar o parecer", text: error.message, kind: "error" });
  }
}

async function generateEtp() {
  if (!validateCurrentStep()) return;
  if (!window.docx) {
    showMessage({ title: "Gerador indisponível", text: "O componente de criação do Word não foi carregado. Atualize a página e tente novamente.", kind: "error" });
    return;
  }
  state.generation = { running: true, progress: 8, message: "Organizando as seções do ETP…" };
  render();
  try {
    const blob = await buildEtpDocument((progress, message) => setGenerationProgress(progress, message));
    const suffix = state.etp.processNumber || state.etp.object;
    const filename = `etp-${slugify(suffix, "estudo-tecnico-preliminar")}.docx`;
    await finishDownload(blob, filename, "Estudo Técnico Preliminar");
    state.etp.complete = true;
    state.generation.running = false;
    render();
    pushNavigationState();
  } catch (error) {
    state.generation.running = false;
    render();
    showMessage({ title: "Não foi possível gerar o ETP", text: error.message, kind: "error" });
  }
}

async function generateTr() {
  if (!validateCurrentStep()) return;
  if (!window.docx) {
    showMessage({ title: "Gerador indisponível", text: "O componente de criação do Word não foi carregado. Atualize a página e tente novamente.", kind: "error" });
    return;
  }
  state.generation = { running: true, progress: 8, message: "Aplicando os campos ao Termo de Referência…" };
  render();
  try {
    const blob = await buildTrDocument((progress, message) => setGenerationProgress(progress, message));
    const filename = `termo-de-referencia-${slugify(state.tr.object, "tr")}.docx`;
    await finishDownload(blob, filename, "Termo de Referência");
    state.tr.complete = true;
    state.generation.running = false;
    render();
    pushNavigationState();
  } catch (error) {
    state.generation.running = false;
    render();
    showMessage({ title: "Não foi possível gerar o Termo de Referência", text: error.message, kind: "error" });
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
    pushNavigationState();
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
    pushNavigationState();
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
    pushNavigationState();
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
    patchDocument, PatchType, Paragraph, Table, TableRow, TableCell, WidthType,
    AlignmentType, VerticalAlign, HeightRule, PageBreak,
  } = window.docx;
  const r = state.report;
  if (typeof patchDocument !== "function" || !PatchType) {
    throw new Error("O componente de preenchimento do modelo Word não está disponível.");
  }

  onProgress(15, "Carregando o modelo oficial do parecer…");
  const template = await loadTechnicalOpinionTemplate();
  const children = [];
  children.push(new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { after: 0, line: 360 },
    children: [technicalRun(r.city.trim() + ", " + formatDateLong(r.date))],
  }));
  children.push(technicalBlankParagraph(), technicalBlankParagraph(), technicalBlankParagraph());
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 0, line: 360 },
    children: [technicalRun(technicalOpinionTitle(), { bold: true })],
  }));
  children.push(technicalBlankParagraph(), technicalBlankParagraph());
  children.push(technicalHeading("INTRODUÇÃO"));
  children.push(technicalBlankParagraph());
  technicalOpinionIntroduction().forEach((text) => children.push(technicalBodyParagraph(text)));
  children.push(technicalBlankParagraph());
  children.push(technicalHeading("MAPA DAS VIAS VISTORIADAS"));
  children.push(technicalBlankParagraph());
  children.push(technicalBodyParagraph(
    "Conforme imagem abaixo, apresentam-se destacadas as vias percorridas durante a vistoria no bairro " +
    r.neighborhood.trim() + ". O mapeamento tem por finalidade registrar o perímetro vistoriado como um todo e, a partir dele, " +
    "identificar quais ruas receberam intervenções da " + r.responsibleCompany.trim() + " relacionadas à " +
    r.intervention.trim() + ", bem como apontar os trechos que apresentam não conformidades e pendências de recomposição e acabamento após os serviços executados."
  ));
  onProgress(27, "Preparando o mapa da vistoria…");
  const mapRun = await imageRunFor(r.map.file, 560, 430, "Mapa das vias vistoriadas");
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 100, after: 40 },
    children: [mapRun],
  }));
  children.push(technicalMapCaption(r.mapCaption || ("Ruas mapeadas no bairro " + r.neighborhood.trim() + ".")));
  children.push(technicalBlankParagraph());
  children.push(technicalBodyParagraph(
    "Após percorrer o bairro " + r.neighborhood.trim() + ", foram identificadas as seguintes vias que precisam de acabamento após a execução dos serviços realizados pela " + r.responsibleCompany.trim() + ":"
  ));
  reportStreets().forEach((street) => children.push(technicalListParagraph(street)));
  children.push(technicalBlankParagraph());
  children.push(technicalBodyParagraph(
    "As imagens que comprovam as situações verificadas durante a fiscalização constam no Anexo Fotográfico deste documento, para fins de registro e evidência."
  ));
  children.push(technicalBlankParagraph(), technicalBlankParagraph());
  children.push(technicalHeading("CONSIDERAÇÕES FINAIS:"));
  children.push(technicalBlankParagraph());
  technicalParagraphs(r.findings).forEach((paragraph) => children.push(paragraph));
  technicalParagraphs(r.impacts).forEach((paragraph) => children.push(paragraph));
  children.push(technicalBodyParagraph("Diante do exposto, recomenda-se que sejam adotadas providências corretivas abrangendo:"));
  const recommendations = reportRecommendations();
  recommendations.forEach((recommendation, index) => {
    const suffix = index === recommendations.length - 1 ? "." : ";";
    children.push(technicalListParagraph(recommendation.replace(/[.;]+$/, "") + suffix));
  });
  children.push(technicalBlankParagraph());
  children.push(technicalBodyParagraph(
    "Por fim, este Parecer Técnico tem caráter de registro e subsídio técnico, ficando as evidências fotográficas anexas como comprovação das condições observadas em campo na data da vistoria."
  ));
  children.push(technicalBlankParagraph(), technicalBlankParagraph());
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 0, line: 360 },
    children: [technicalRun("Atenciosamente:")],
  }));
  children.push(technicalSignatureTable(r.responsibles));
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(technicalHeading("ANEXO FOTOGRÁFICO"));
  children.push(technicalBlankParagraph());

  const perPage = r.onePerPage ? 1 : 2;
  const groups = [];
  for (let index = 0; index < r.photos.length; index += perPage) groups.push(r.photos.slice(index, index + perPage));
  for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
    const rows = [];
    for (let photoIndex = 0; photoIndex < groups[groupIndex].length; photoIndex += 1) {
      const photo = groups[groupIndex][photoIndex];
      const photoNumber = groupIndex * perPage + photoIndex + 1;
      const completed = groupIndex * perPage + rows.length + 1;
      onProgress(38 + Math.round((completed / r.photos.length) * 52), "Inserindo fotografia " + completed + " de " + r.photos.length + "…");
      const run = await imageRunFor(photo.file, 560, r.onePerPage ? 620 : 285, "Foto " + photoNumber);
      rows.push(new TableRow({
        cantSplit: true,
        height: { value: r.onePerPage ? 9800 : 4850, rule: HeightRule.ATLEAST },
        children: [new TableCell({
          width: { size: 100, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 80, bottom: 80, left: 80, right: 80 },
          borders: noBorders(),
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [run] }),
            technicalPhotoCaption(photoNumber, photo.description),
          ],
        })],
      }));
    }
    children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: noBorders(), rows }));
    if (groupIndex < groups.length - 1) children.push(new Paragraph({ children: [new PageBreak()] }));
  }

  onProgress(93, "Aplicando o conteúdo ao modelo oficial…");
  const blob = await patchDocument({
    outputType: "blob",
    data: template,
    patches: {
      technical_opinion_content: {
        type: PatchType.DOCUMENT,
        children,
      },
    },
    keepOriginalStyles: true,
    recursive: false,
  });
  onProgress(100, "Parecer técnico concluído.");
  return blob;
}

function technicalRun(text, options = {}) {
  const { TextRun } = window.docx;
  return new TextRun({
    text: String(text || ""),
    font: "Arial",
    size: options.size || 24,
    bold: Boolean(options.bold),
    italics: Boolean(options.italics),
    language: { value: "pt-BR" },
  });
}

function technicalBlankParagraph() {
  const { Paragraph } = window.docx;
  return new Paragraph({ spacing: { before: 0, after: 0, line: 360 }, children: [] });
}

function technicalHeading(text) {
  const { Paragraph, AlignmentType } = window.docx;
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    keepNext: true,
    indent: { left: 720 },
    spacing: { before: 0, after: 0, line: 360 },
    children: [technicalRun(text, { bold: true })],
  });
}

function technicalBodyParagraph(text) {
  const { Paragraph, AlignmentType } = window.docx;
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: 425, firstLine: 1735 },
    spacing: { before: 0, after: 0, line: 360 },
    children: [technicalRun(String(text || "").trim())],
  });
}

function technicalParagraphs(text) {
  return String(text || "")
    .replace(/\r\n?/g, "\n")
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => technicalBodyParagraph(paragraph));
}

function technicalListParagraph(text) {
  const { Paragraph, AlignmentType } = window.docx;
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: 1060, hanging: 360 },
    spacing: { before: 0, after: 0, line: 360 },
    children: [technicalRun("• "), technicalRun(text)],
  });
}

function technicalMapCaption(text) {
  const { Paragraph, AlignmentType } = window.docx;
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 0, line: 300 },
    children: [technicalRun("Foto – " + String(text || "").trim(), { size: 20 })],
  });
}

function technicalPhotoCaption(number, description) {
  const { Paragraph, AlignmentType } = window.docx;
  const prefix = "Foto " + String(number).padStart(2, "0") + " – ";
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 0, after: 0, line: 300 },
    children: [
      technicalRun(prefix, { bold: true, size: 20 }),
      technicalRun(String(description || "").trim(), { size: 20 }),
    ],
  });
}

function technicalSignatureTable(signatures) {
  const { Paragraph, Table, TableRow, TableCell, WidthType, TableLayoutType, AlignmentType, VerticalAlign } = window.docx;
  const tableWidth = 9000;
  const columnWidth = tableWidth / 2;
  const cells = signatures.map((signature) => new TableCell({
    width: { size: columnWidth, type: WidthType.DXA },
    margins: { top: 620, bottom: 180, left: 120, right: 120 },
    verticalAlign: VerticalAlign.BOTTOM,
    borders: noBorders(),
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0, line: 300 }, children: [technicalRun("_______________________________")] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0, line: 300 }, children: [technicalRun(signature.name, { bold: true })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0, line: 300 }, children: [technicalRun(signature.role)] }),
    ],
  }));
  const rows = [];
  for (let index = 0; index < cells.length; index += 2) {
    const pair = cells.slice(index, index + 2);
    if (pair.length === 1) {
      pair.push(new TableCell({ width: { size: columnWidth, type: WidthType.DXA }, borders: noBorders(), children: [new Paragraph("")] }));
    }
    rows.push(new TableRow({ cantSplit: true, children: pair }));
  }
  return new Table({
    width: { size: tableWidth, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths: [columnWidth, columnWidth],
    borders: noBorders(),
    rows,
  });
}

async function loadTechnicalOpinionTemplate() {
  if (!technicalOpinionTemplatePromise) {
    technicalOpinionTemplatePromise = fetch(TECHNICAL_OPINION_TEMPLATE_URL)
      .then((response) => {
        if (!response.ok) throw new Error("O modelo oficial do parecer técnico não pôde ser carregado.");
        return response.arrayBuffer();
      })
      .catch((error) => {
        technicalOpinionTemplatePromise = null;
        throw error;
      });
  }
  const data = await technicalOpinionTemplatePromise;
  return data.slice(0);
}

function etpRun(text, options = {}) {
  const { TextRun } = window.docx;
  return new TextRun({
    text: String(text || ""),
    font: "Arial",
    size: options.size || 24,
    bold: Boolean(options.bold),
    italics: Boolean(options.italics),
    language: { value: "pt-BR" },
  });
}

function etpParagraph(text, options = {}) {
  const { Paragraph, AlignmentType } = window.docx;
  const alignment = options.center
    ? AlignmentType.CENTER
    : options.right
      ? AlignmentType.RIGHT
      : options.left
        ? AlignmentType.LEFT
        : AlignmentType.JUSTIFIED;
  return new Paragraph({
    alignment,
    keepNext: Boolean(options.keepNext),
    spacing: { before: options.before || 0, after: options.after || 0, line: 360 },
    children: [etpRun(String(text || "").trim(), { bold: options.bold })],
  });
}

function etpBlankParagraph() {
  const { Paragraph } = window.docx;
  return new Paragraph({ spacing: { before: 0, after: 0, line: 360 }, children: [] });
}

function etpTextParagraphs(text) {
  return String(text || "")
    .replace(/\r\n?/g, "\n")
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => etpParagraph(paragraph));
}

function etpHeading(text) {
  return etpParagraph(text, { left: true, bold: true, keepNext: true, before: 180 });
}

function etpLabeledParagraph(label, text) {
  const { Paragraph, AlignmentType } = window.docx;
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 0, after: 0, line: 360 },
    children: [etpRun(`${label}: `, { bold: true }), etpRun(String(text || "").trim())],
  });
}

function etpHeaderTitle() {
  return `ETP – ${state.etp.object.trim().toLocaleUpperCase("pt-BR")}`;
}

function etpRiskTable(risk, index) {
  const {
    Table, TableRow, TableCell, WidthType, TableLayoutType,
    Paragraph, AlignmentType, BorderStyle, VerticalAlign,
  } = window.docx;
  const borders = {
    top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  };
  const widths = [2547, 5947];
  const cell = (text, width) => new TableCell({
    width: { size: width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    borders,
    children: [new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 0, after: 0, line: 360 },
      children: [etpRun(text)],
    })],
  });
  const rows = [
    [`Risco ${index + 1}`, risk.title],
    ["Probabilidade", risk.probability],
    ["Impacto", risk.impact],
    ["Dano", risk.damage],
    ["Ação preventiva", risk.preventiveAction],
    ["Ação de contingência", risk.contingencyAction],
  ].map(([label, value]) => new TableRow({
    cantSplit: true,
    children: [cell(label, widths[0]), cell(value, widths[1])],
  }));
  return new Table({
    width: { size: 8494, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths: widths,
    borders,
    rows,
  });
}

function etpSignatureParagraphs(signatures) {
  const paragraphs = [];
  signatures.forEach((signature, index) => {
    paragraphs.push(etpParagraph(signature.name, { center: true, before: index === 0 ? 900 : 540 }));
    paragraphs.push(etpParagraph(signature.role, { center: true }));
  });
  return paragraphs;
}

async function loadEtpTemplate() {
  if (!etpTemplatePromise) {
    etpTemplatePromise = fetch(ETP_TEMPLATE_URL)
      .then((response) => {
        if (!response.ok) throw new Error("O modelo oficial do ETP não pôde ser carregado.");
        return response.arrayBuffer();
      })
      .catch((error) => {
        etpTemplatePromise = null;
        throw error;
      });
  }
  const data = await etpTemplatePromise;
  return data.slice(0);
}

async function buildEtpDocument(onProgress) {
  const { patchDocument, PatchType } = window.docx;
  const d = state.etp;
  if (typeof patchDocument !== "function" || !PatchType) {
    throw new Error("O componente de preenchimento do modelo Word não está disponível.");
  }

  onProgress(18, "Carregando o modelo oficial do ETP…");
  const template = await loadEtpTemplate();
  const children = [
    etpParagraph("ESTUDO TÉCNICO PRELIMINAR - ETP", { center: true, bold: true, keepNext: true }),
    etpParagraph("Lei Federal 14.133/21", { center: true, bold: true, keepNext: true }),
    etpParagraph("REFERENCIAL - OBRAS", { center: true, bold: true }),
    etpBlankParagraph(),
    etpHeading("Informações Básicas"),
    etpLabeledParagraph("Nº do Processo Administrativo", d.processNumber),
    etpLabeledParagraph("Unidade requisitante", d.requestingUnit),
    etpBlankParagraph(),
    etpHeading("INTRODUÇÃO"),
    ...etpTextParagraphs(d.introduction),
    etpBlankParagraph(),
    etpHeading("1 - DESCRIÇÃO DA NECESSIDADE"),
    ...etpTextParagraphs(d.needDescription),
    etpBlankParagraph(),
    etpHeading("2 - PREVISÃO NO PLANO DE CONTRATAÇÕES ANUAL"),
    ...etpTextParagraphs(d.annualPlan),
  ];

  if (d.budgetAllocation.trim()) {
    children.push(etpLabeledParagraph("Dotação ou fonte orçamentária", d.budgetAllocation));
  }
  children.push(etpBlankParagraph(), etpHeading("3 - REQUISITOS DA CONTRATAÇÃO"));
  etpRequirements().forEach((requirement, index) => children.push(etpParagraph(`3.${index + 1} - ${requirement}`)));
  children.push(
    etpBlankParagraph(),
    etpHeading("4 - ESTIMATIVA DAS QUANTIDADES"),
    ...etpTextParagraphs(d.quantityEstimate),
    etpBlankParagraph(),
    etpHeading("5 - LEVANTAMENTO DE MERCADO"),
    ...etpTextParagraphs(d.marketSurvey),
    etpBlankParagraph(),
    etpHeading("6 - ESTIMATIVA DO VALOR DA CONTRATAÇÃO"),
    ...etpTextParagraphs(d.estimatedValue),
    etpBlankParagraph(),
    etpHeading("7 - DESCRIÇÃO DA SOLUÇÃO COMO UM TODO"),
    ...etpTextParagraphs(d.solutionDescription),
    etpBlankParagraph(),
    etpHeading("8 - JUSTIFICATIVA PARA PARCELAMENTO OU NÃO DA SOLUÇÃO"),
    ...etpTextParagraphs(d.parcelingJustification),
    etpBlankParagraph(),
    etpHeading("9 - DEMONSTRATIVO DOS RESULTADOS PRETENDIDOS"),
    ...etpTextParagraphs(d.expectedResults),
  );
  if (d.socialAssessment.trim()) children.push(etpLabeledParagraph("Apreciação social", d.socialAssessment));
  if (d.operationalQualification.trim()) children.push(etpLabeledParagraph("Qualificação operacional", d.operationalQualification));
  children.push(
    etpBlankParagraph(),
    etpHeading("10 - PROVIDÊNCIAS PRÉVIAS AO CONTRATO"),
    ...etpTextParagraphs(d.priorMeasures),
    etpBlankParagraph(),
    etpHeading("11 - CONTRATAÇÕES CORRELATAS/INTERDEPENDENTES"),
    ...etpTextParagraphs(d.relatedContracts),
    etpBlankParagraph(),
    etpHeading("12 - IMPACTOS AMBIENTAIS"),
    ...etpTextParagraphs(d.environmentalImpacts),
    etpBlankParagraph(),
    etpHeading("13 - LICENÇA/AUTORIZAÇÃO/MANIFESTAÇÃO DE ÓRGÃOS DO GOVERNO"),
    ...etpTextParagraphs(d.licenses),
    etpBlankParagraph(),
    etpHeading("14 - GERENCIAMENTO DE RISCOS"),
    etpParagraph("Os riscos do processo de contratação estão apresentados nas tabelas a seguir, com as respectivas medidas preventivas e ações de contingência."),
    etpBlankParagraph(),
  );

  d.risks.forEach((risk, index) => {
    onProgress(42 + Math.round(((index + 1) / d.risks.length) * 32), `Formatando risco ${index + 1} de ${d.risks.length}…`);
    children.push(etpRiskTable(risk, index));
    children.push(etpBlankParagraph());
  });
  children.push(etpParagraph(`${d.city.trim()}, ${formatDateLong(d.date)}.`, { left: true, before: 180 }));
  children.push(...etpSignatureParagraphs(d.responsibles));

  onProgress(88, "Aplicando o conteúdo ao timbre e à paginação do modelo…");
  const blob = await patchDocument({
    outputType: "blob",
    data: template,
    patches: {
      etp_content: {
        type: PatchType.DOCUMENT,
        children,
      },
      etp_header_title: {
        type: PatchType.PARAGRAPH,
        children: [etpRun(etpHeaderTitle())],
      },
    },
    keepOriginalStyles: true,
    recursive: true,
  });
  onProgress(100, "ETP concluído.");
  return blob;
}

async function loadTrTemplate() {
  if (!trTemplatePromise) {
    trTemplatePromise = fetch(TR_TEMPLATE_URL)
      .then((response) => {
        if (!response.ok) throw new Error("O modelo oficial do Termo de Referência não pôde ser carregado.");
        return response.arrayBuffer();
      })
      .catch((error) => {
        trTemplatePromise = null;
        throw error;
      });
  }
  const data = await trTemplatePromise;
  return data.slice(0);
}

function trFieldText(value) {
  return String(value || "").replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
}

function trBullet(value) {
  return `• ${trFieldText(value).replace(/^[•\-–—]\s*/, "")}`;
}

function trXmlEscape(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function trRegexEscape(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceTrPlaceholder(xml, key, value, options = {}) {
  const token = `{{${key}}}`;
  const pattern = new RegExp(`(<w:t\\b)([^>]*>)${trRegexEscape(token)}(<\\/w:t>)`, "g");
  let count = 0;
  const replacement = `${trFieldText(value)}${options.trailingSpace ? " " : ""}`;
  const output = xml.replace(pattern, (_match, start, attributes, end) => {
    count += 1;
    const opening = /xml:space=/.test(attributes)
      ? `${start}${attributes}`
      : `${start}${attributes.slice(0, -1)} xml:space="preserve">`;
    return `${opening}${trXmlEscape(replacement)}${end}`;
  });
  if (!count) throw new Error(`O campo ${key} não foi encontrado no modelo do Termo de Referência.`);
  return output;
}

async function prepareTrImage(file, maxWidth = 520, maxHeight = 280) {
  const image = await loadImage(file);
  const ratio = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight, 1);
  const width = Math.max(1, Math.round(image.naturalWidth * ratio));
  const height = Math.max(1, Math.round(image.naturalHeight * ratio));
  const sourceRatio = Math.min(1, 2200 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * sourceRatio));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * sourceRatio));
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(image.src);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  if (!blob) throw new Error(`Não foi possível preparar a imagem ${file.name}.`);
  return { data: new Uint8Array(await blob.arrayBuffer()), width, height };
}

function trImageDrawingXml(relationshipId, width, height) {
  const cx = Math.round(width * 9525);
  const cy = Math.round(height * 9525);
  return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="9001" name="Área de intervenção" descr="Área de intervenção"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="tr-intervention.jpg"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${relationshipId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
}

async function buildTrDocument(onProgress) {
  const d = state.tr;
  if (!window.JSZip) throw new Error("O componente de preenchimento do modelo Word não está disponível.");
  if (!d.interventionImage?.file) throw new Error("Anexe a imagem da área de intervenção.");

  onProgress(20, "Carregando o modelo oficial do Termo de Referência…");
  const template = await loadTrTemplate();
  const zip = await window.JSZip.loadAsync(template);
  let documentXml = await zip.file("word/document.xml").async("string");
  onProgress(42, "Preparando a imagem da área de intervenção…");
  const image = await prepareTrImage(d.interventionImage.file);
  const duration = `${trFieldText(d.durationNumber)} (${trFieldText(d.durationWords)}) meses`;
  const replacements = {
    tr_object: d.object,
    tr_location: `Localidade: ${d.location}`,
    tr_contract_term: `de ${duration}`,
    tr_estimated_cost: `R$ ${d.estimatedCost} (${d.estimatedCostWords})`,
    tr_price_reference: d.priceReference,
    tr_bid_mode: d.bidMode,
    tr_relevance_criteria: d.relevanceCriteria,
    tr_accessory_service: d.accessoryService,
    tr_relevant_services: d.relevantServices,
    tr_operational_qualification: d.operationalQualification,
    tr_relevant_service_1: trBullet(d.relevantService1),
    tr_relevant_service_2: trBullet(d.relevantService2),
    tr_professional_qualification: d.professionalQualification,
    tr_eligible_professionals: d.eligibleProfessionals,
    tr_certificate_aggregation: d.certificateAggregation,
    tr_council_compatibility: d.councilCompatibility,
    tr_professional_bond: d.professionalBond,
    tr_execution_term: `O prazo para a execução dos serviços será de ${duration}`,
    tr_management: d.management,
    tr_date: `${d.city}, ${formatDateLong(d.date)}.`,
    tr_signer_name: d.signerName,
    tr_signer_role: d.signerRole,
  };
  Object.entries(replacements).forEach(([key, value]) => {
    documentXml = replaceTrPlaceholder(documentXml, key, value, {
      trailingSpace: ["tr_contract_term", "tr_estimated_cost"].includes(key),
    });
  });

  const imageRelationshipId = "rIdTrInterventionImage";
  const imageRunPattern = /<w:r\b[^>]*>(?:(?!<\/w:r>)[\s\S])*?\{\{tr_image\}\}(?:(?!<\/w:r>)[\s\S])*?<\/w:r>/;
  if (!imageRunPattern.test(documentXml)) throw new Error("O campo de imagem não foi encontrado no modelo do Termo de Referência.");
  documentXml = documentXml.replace(imageRunPattern, trImageDrawingXml(imageRelationshipId, image.width, image.height));
  zip.file("word/document.xml", documentXml);
  zip.file("word/media/tr-intervention.jpg", image.data);

  let relationshipsXml = await zip.file("word/_rels/document.xml.rels").async("string");
  relationshipsXml = relationshipsXml.replace(
    "</Relationships>",
    `<Relationship Id="${imageRelationshipId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/tr-intervention.jpg"/></Relationships>`,
  );
  zip.file("word/_rels/document.xml.rels", relationshipsXml);

  let contentTypesXml = await zip.file("[Content_Types].xml").async("string");
  if (!/Extension="jpe?g"/i.test(contentTypesXml)) {
    contentTypesXml = contentTypesXml.replace(
      "</Types>",
      '<Default Extension="jpg" ContentType="image/jpeg"/></Types>',
    );
    zip.file("[Content_Types].xml", contentTypesXml);
  }

  onProgress(76, "Mantendo o cabeçalho, os tópicos e o texto original…");
  const blob = await zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    compression: "DEFLATE",
  });
  onProgress(100, "Termo de Referência concluído.");
  return blob;
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
  if (state.flow === "drainage") {
    state.drainage = createDrainageState();
    localStorage.removeItem("docflow-drainage-draft");
  } else if (state.flow === "report") {
    state.report.photos.forEach((photo) => URL.revokeObjectURL(photo.url));
    if (state.report.map?.url) URL.revokeObjectURL(state.report.map.url);
    state.report = createReportState(readStorage("docflow-preferences", {}));
  } else if (state.flow === "etp") {
    state.etp = createEtpState(readStorage("docflow-preferences", {}));
  } else if (state.flow === "tr") {
    if (state.tr.interventionImage?.url) URL.revokeObjectURL(state.tr.interventionImage.url);
    state.tr = createTrState(readStorage("docflow-preferences", {}));
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
  pushNavigationState();
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
  if (action === "show-processes") return showProcesses();
  if (action === "refresh-processes") return loadProcesses();
  if (action === "add-process-guide") return openProcessGuideDialog();
  if (action === "edit-process-guide") return openProcessGuideDialog(target.dataset.id);
  if (action === "delete-process-guide") return confirmProcessGuideDeletion(target.dataset.id);
  if (action === "close-process-guide") return closeProcessGuideDialog();
  if (action === "refresh-admin") return loadAdminUsers();
  if (action === "approve-admin-user") return setAdminUserStatus(target.dataset.id, "approved");
  if (action === "reject-admin-user") return confirmAdminUserRejection(target.dataset.id);
  if (action === "delete-admin-user") return confirmAdminUserDeletion(target.dataset.id);
  if (action === "show-history") return showDocumentHistory();
  if (action === "show-kanban") return showKanban();
  if (action === "refresh-kanban") return loadKanban();
  if (action === "add-kanban-board") return openKanbanBoardDialog();
  if (action === "edit-kanban-board") return openKanbanBoardDialog(state.kanban.activeBoardId);
  if (action === "select-kanban-board") return selectKanbanBoard(target.dataset.id);
  if (action === "open-kanban-history") return openKanbanHistoryDialog(target.dataset.id);
  if (action === "close-kanban-history") return closeKanbanHistoryDialog();
  if (action === "close-kanban-board") return closeKanbanBoardDialog();
  if (action === "delete-kanban-board") return confirmKanbanBoardDeletion();
  if (action === "add-kanban-card") return openKanbanCardDialog();
  if (action === "edit-kanban-card") return openKanbanCardDialog(target.dataset.id);
  if (action === "delete-kanban-card") return confirmKanbanCardDeletion(target.dataset.id);
  if (action === "delete-kanban-attachment") return confirmKanbanAttachmentDeletion(target.dataset.id);
  if (action === "close-kanban-card") return closeKanbanCardDialog();
  if (action === "toggle-notifications") return toggleNotificationPopover();
  if (action === "close-notifications") return closeNotificationPopover();
  if (action === "open-kanban-notification") return openKanbanNotification(target.dataset.id, target.dataset.boardId, target.dataset.cardId);
  if (action === "toggle-notification-expansion") return toggleNotificationExpansion();
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
  if (action === "start-etp") return startFlow("etp");
  if (action === "start-tr") return startFlow("tr");
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
      pushNavigationState();
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
  if (action === "remove-etp-signature") {
    state.etp.responsibles.splice(Number(target.dataset.index), 1);
    render();
    return;
  }
  if (action === "add-etp-risk") {
    state.etp.risks.push(createEtpRisk());
    render();
    return;
  }
  if (action === "remove-etp-risk") {
    if (state.etp.risks.length > 1) {
      state.etp.risks = state.etp.risks.filter((risk) => risk.id !== target.dataset.id);
      render();
    }
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
  if (action === "print-drainage-memory") return printDrainageMemory();
  if (action === "download-drainage-excel") return generateDrainageSpreadsheet();
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
  const homeSearch = document.querySelector("#homeDocumentSearch");
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k" && homeSearch) {
    event.preventDefault();
    homeSearch.focus();
    return;
  }
  if (event.key === "Escape" && event.target === homeSearch && homeSearch.value) {
    homeSearch.value = "";
    homeSearchQuery = "";
    filterHomeDocuments();
    return;
  }
  if (!["Enter", " "].includes(event.key)) return;
  const target = event.target.closest("[role='button'][data-action]");
  if (!target || target.tagName === "BUTTON") return;
  event.preventDefault();
  handleAction(target.dataset.action, target);
});

document.addEventListener("input", (event) => {
  const target = event.target;
  if (target.id === "homeDocumentSearch") {
    homeSearchQuery = target.value;
    filterHomeDocuments();
    return;
  }
  clearValidationHighlight(target);
  if (target.dataset.drainageAdopted) {
    state.drainage.adopted[target.dataset.drainageAdopted] = target.value;
    state.drainage.complete = false;
    scheduleSave();
    return;
  }
  if (target === elements.kanbanCardStartDate || target === elements.kanbanCardDurationDays) {
    renderKanbanSchedulePreview();
  }
  if (target.dataset.richEditor) {
    updateRichEditorState(target);
    return;
  }
  if (target.dataset.bind) {
    setPath(target.dataset.bind, getBoundValue(target));
    if (target.dataset.bind.startsWith("drainage.")) {
      state.drainage.complete = false;
      if (target.dataset.bind === "drainage.project.standardLoss") {
        state.drainage.bl.loss = target.value;
        state.drainage.pv.loss = target.value;
        state.drainage.gutter.loss = target.value;
      }
      target.closest(".drainage-service-choice")?.classList.toggle("is-selected", Boolean(target.checked));
    }
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
});

document.addEventListener("change", (event) => {
  const target = event.target;
  clearValidationHighlight(target);
  if (target.dataset.adminCardKey && target.dataset.adminCardUser) {
    void setAdminUserCardAccess(
      target.dataset.adminCardUser,
      target.dataset.adminCardKey,
      target.checked,
    );
    return;
  }
  if (target === elements.kanbanAttachmentInput) {
    void uploadKanbanAttachments(target.files);
    return;
  }
  if (target.dataset.reportSignatureChoice !== undefined) {
    const profileId = target.dataset.reportSignatureChoice;
    const profile = state.signatures.items.find((item) => item.id === profileId);
    if (target.checked && profile) {
      applySignatureProfile({ type: "report" }, profile);
    } else if (!target.checked) {
      state.report.responsibles = state.report.responsibles.filter((item) => item.profileId !== profileId);
    }
    render();
    return;
  }
  if (target.dataset.etpSignatureChoice !== undefined) {
    const profileId = target.dataset.etpSignatureChoice;
    const profile = state.signatures.items.find((item) => item.id === profileId);
    if (target.checked && profile) {
      applySignatureProfile({ type: "etp" }, profile);
    } else if (!target.checked) {
      state.etp.responsibles = state.etp.responsibles.filter((item) => item.profileId !== profileId);
    }
    render();
    return;
  }
  if (target.dataset.kanbanStatus !== undefined) {
    moveKanbanCard(target.dataset.id, target.value);
    return;
  }
  if (target.dataset.kanbanPriority !== undefined) {
    changeKanbanCardPriority(target.dataset.id, target.value);
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
  if (!card || !state.kanban.board?.canEdit) {
    event.preventDefault();
    return;
  }
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

elements.kanbanBoardForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await saveKanbanBoard();
});

elements.processGuideForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await saveProcessGuide();
});

elements.processGuideDialog.addEventListener("click", (event) => {
  if (event.target === elements.processGuideDialog) closeProcessGuideDialog();
});

elements.kanbanBoardDialog.addEventListener("click", (event) => {
  if (event.target === elements.kanbanBoardDialog) closeKanbanBoardDialog();
});

elements.renameDialog.addEventListener("click", (event) => {
  if (event.target === elements.renameDialog) closeHistoryRename();
});

window.addEventListener("popstate", (event) => {
  const route = event.state?.[APP_HISTORY_KEY];
  if (route) applyNavigationRoute(route);
});

window.addEventListener("beforeunload", () => {
  stopNotificationPolling();
  state.report.photos.forEach((photo) => URL.revokeObjectURL(photo.url));
  if (state.report.map?.url) URL.revokeObjectURL(state.report.map.url);
  if (state.tr.interventionImage?.url) URL.revokeObjectURL(state.tr.interventionImage.url);
  state.notification.photos.forEach((photo) => URL.revokeObjectURL(photo.url));
  state.warning.photos.forEach((photo) => URL.revokeObjectURL(photo.url));
  if (state.lastDownload?.url) URL.revokeObjectURL(state.lastDownload.url);
  state.history.pdfCache.forEach((cached) => cached.url && URL.revokeObjectURL(cached.url));
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && state.auth.user) {
    void loadKanbanNotifications({ silent: true });
    void refreshCurrentCardAccess();
  }
});

bootstrapAuth();
