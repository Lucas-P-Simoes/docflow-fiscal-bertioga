/* global PDFLib */

importScripts("./vendor/pdf-lib.min.js");

const PDF_LOAD_OPTIONS = {
  updateMetadata: false,
  parseSpeed: PDFLib.ParseSpeeds.Fastest,
  throwOnInvalidObject: false,
};

function postProgress(progress, message) {
  self.postMessage({ type: "progress", progress, message });
}

function readablePdfError(error, filename) {
  const detail = String(error?.message || error || "");
  const label = filename ? `O arquivo “${filename}”` : "Um dos arquivos";
  if (/encrypt|password|senha|protected/i.test(detail)) {
    return `${label} é protegido por senha. Remova a senha antes de tentar novamente.`;
  }
  if (/memory|allocation|array buffer|out of bounds|rangeerror/i.test(detail)) {
    return `${label} é grande demais para a memória disponível neste navegador. Feche outras abas ou divida a operação em partes menores.`;
  }
  if (/parse|header|xref|trailer|object|invalid|unexpected|failed to load/i.test(detail)) {
    return `${label} está corrompido ou usa uma estrutura de PDF que não pôde ser lida.`;
  }
  if (/PDF final|quantidade de páginas/i.test(detail)) {
    return "O PDF final não passou na verificação de integridade. Nenhum download foi liberado.";
  }
  return `${label} não pôde ser processado. Verifique se ele abre normalmente e não possui senha.`;
}

async function inspectFiles(files) {
  const results = [];
  for (let index = 0; index < files.length; index += 1) {
    const item = files[index];
    postProgress(22 + ((index + 1) / files.length) * 70, `Verificando ${index + 1} de ${files.length}: ${item.name}`);
    try {
      const source = await PDFLib.PDFDocument.load(new Uint8Array(item.bytes), PDF_LOAD_OPTIONS);
      const pageCount = source.getPageCount();
      if (!pageCount) throw new Error("PDF sem páginas");
      results.push({ index, name: item.name, pageCount });
    } catch (error) {
      results.push({ index, name: item.name, error: readablePdfError(error, item.name) });
    }
  }
  self.postMessage({ type: "complete", task: "inspect", results });
}

async function mergeFiles(files, expectedPageCount) {
  const merged = await PDFLib.PDFDocument.create();
  let currentFilename = "";

  try {
    for (let index = 0; index < files.length; index += 1) {
      const item = files[index];
      currentFilename = item.name;
      postProgress(22 + ((index + 1) / files.length) * 50, `Adicionando ${index + 1} de ${files.length}: ${item.name}`);
      const source = await PDFLib.PDFDocument.load(new Uint8Array(item.bytes), PDF_LOAD_OPTIONS);
      const pages = await merged.copyPages(source, source.getPageIndices());
      pages.forEach((page) => merged.addPage(page));
    }

    const mergedPageCount = merged.getPageCount();
    if (!mergedPageCount || mergedPageCount !== expectedPageCount) {
      throw new Error("A quantidade de páginas mudou durante a união");
    }

    currentFilename = "";
    postProgress(76, "Montando o arquivo PDF final…");
    const savedBytes = await merged.save({ useObjectStreams: false, addDefaultPage: false, objectsPerTick: 20 });
    const output = new Uint8Array(savedBytes.byteLength);
    output.set(savedBytes);

    postProgress(92, "Verificando a integridade e a quantidade de páginas…");
    const header = new TextDecoder().decode(output.slice(0, 8));
    const trailer = new TextDecoder().decode(output.slice(-2048));
    if (!header.startsWith("%PDF-") || !trailer.includes("%%EOF")) {
      throw new Error("O PDF final não possui uma estrutura completa");
    }

    const verified = await PDFLib.PDFDocument.load(output, PDF_LOAD_OPTIONS);
    const pageCount = verified.getPageCount();
    if (pageCount !== expectedPageCount) {
      throw new Error("O PDF final não preservou todas as páginas");
    }

    self.postMessage({ type: "complete", task: "merge", bytes: output.buffer, pageCount }, [output.buffer]);
  } catch (error) {
    throw new Error(readablePdfError(error, currentFilename));
  }
}

self.addEventListener("message", (event) => {
  const { type, files = [], expectedPageCount = 0 } = event.data || {};
  Promise.resolve(type === "inspect" ? inspectFiles(files) : mergeFiles(files, expectedPageCount)).catch((error) => {
    self.postMessage({
      type: "error",
      message: String(error?.message || "Não foi possível processar os PDFs."),
    });
  });
});
