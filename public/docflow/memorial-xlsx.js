(function initializeMemorialSpreadsheetReader(global) {
  "use strict";

  function decodeXml(value) {
    return String(value || "")
      .replace(/&#(x?[0-9a-f]+);/gi, (_match, code) => {
        const base = code[0].toLowerCase() === "x" ? 16 : 10;
        const numeric = Number.parseInt(base === 16 ? code.slice(1) : code, base);
        return Number.isFinite(numeric) ? String.fromCodePoint(numeric) : "";
      })
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, "&");
  }

  function attribute(xml, name) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return decodeXml(xml.match(new RegExp(`(?:^|\\s)${escaped}="([^"]*)"`))?.[1] || "");
  }

  function columnIndex(reference) {
    const letters = String(reference || "").match(/^[A-Z]+/i)?.[0]?.toUpperCase() || "";
    let result = 0;
    for (const letter of letters) result = result * 26 + letter.charCodeAt(0) - 64;
    return Math.max(0, result - 1);
  }

  function textNodes(xml) {
    return [...String(xml || "").matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
      .map((match) => decodeXml(match[1]))
      .join("");
  }

  function parseSharedStrings(xml) {
    if (!xml) return [];
    return [...xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((match) => textNodes(match[1]));
  }

  function normalizeNumeric(value) {
    const text = String(value || "");
    if (!/^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(text)) return text;
    const numeric = Number(text);
    if (!Number.isFinite(numeric)) return text;
    return String(Number(numeric.toPrecision(15)));
  }

  function parseSheetRows(xml, sharedStrings) {
    const rows = [];
    for (const rowMatch of String(xml || "").matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)) {
      const rowNumber = Number(attribute(rowMatch[1], "r")) || rows.length + 1;
      const row = [];
      const populatedCells = rowMatch[2].replace(/<c\b[^>]*\/>/g, "");
      for (const cellMatch of populatedCells.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
        const attrs = cellMatch[1];
        const body = cellMatch[2];
        const reference = attribute(attrs, "r");
        const type = attribute(attrs, "t");
        const raw = body.match(/<v\b[^>]*>([\s\S]*?)<\/v>/)?.[1] || "";
        let value = "";
        if (type === "s") value = sharedStrings[Number(raw)] || "";
        else if (type === "inlineStr") value = textNodes(body);
        else if (type === "b") value = raw === "1" ? "TRUE" : "FALSE";
        else if (type !== "e") value = type ? decodeXml(raw) : normalizeNumeric(decodeXml(raw));
        row[columnIndex(reference)] = String(value || "").trim();
      }
      rows[rowNumber - 1] = row;
    }
    return rows;
  }

  function normalizePath(value) {
    const parts = String(value || "").replace(/^\//, "").split("/");
    const normalized = [];
    for (const part of parts) {
      if (!part || part === ".") continue;
      if (part === "..") normalized.pop();
      else normalized.push(part);
    }
    return normalized.join("/");
  }

  async function workbookSheets(file) {
    if (!global.JSZip) throw new Error("O leitor de planilhas XLSX não está disponível.");
    const zip = await global.JSZip.loadAsync(await file.arrayBuffer());
    const workbookPart = zip.file("xl/workbook.xml");
    const relationshipsPart = zip.file("xl/_rels/workbook.xml.rels");
    if (!workbookPart || !relationshipsPart) throw new Error("A estrutura interna da planilha XLSX não foi reconhecida.");

    const [workbookXml, relationshipsXml, sharedStringsXml] = await Promise.all([
      workbookPart.async("string"),
      relationshipsPart.async("string"),
      zip.file("xl/sharedStrings.xml")?.async("string") || Promise.resolve(""),
    ]);
    const sharedStrings = parseSharedStrings(sharedStringsXml);
    const targets = new Map();
    for (const match of relationshipsXml.matchAll(/<Relationship\b([^>]*?)(?:\/>|>[\s\S]*?<\/Relationship>)/g)) {
      targets.set(attribute(match[1], "Id"), attribute(match[1], "Target"));
    }

    const sheets = [];
    for (const match of workbookXml.matchAll(/<sheet\b([^>]*?)(?:\/>|>[\s\S]*?<\/sheet>)/g)) {
      const attrs = match[1];
      const name = attribute(attrs, "name");
      const target = targets.get(attribute(attrs, "r:id"));
      if (!target) continue;
      const path = normalizePath(target.startsWith("/") ? target : `xl/${target}`);
      const sheetPart = zip.file(path);
      if (!sheetPart) continue;
      sheets.push({ name, rows: parseSheetRows(await sheetPart.async("string"), sharedStrings) });
    }
    return sheets;
  }

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/gi, " ")
      .trim()
      .toLowerCase();
  }

  function cell(row, index) {
    return String(row?.[index] || "").replace(/\s+/g, " ").trim();
  }

  function findHeader(rows) {
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex] || [];
      const labels = row.map(normalize);
      const find = (pattern) => labels.findIndex((label) => pattern.test(label));
      const columns = {
        item: find(/^item$/),
        reference: find(/^ref(?:erencia)?$/),
        code: find(/^(?:cod|codigo)$/),
        description: find(/^descricao(?: dos servicos| de servicos)?$/),
        unit: find(/^unid(?:ade)?$/),
        quantity: find(/^quant(?:idade)?$/),
        calculation: find(/^memoria de calculo$/),
      };
      if (columns.item >= 0 && columns.code >= 0 && columns.description >= 0 && columns.unit >= 0 && columns.quantity >= 0) {
        return { rowIndex, columns, labels: row.map((value) => cell([value], 0)) };
      }
    }
    return null;
  }

  function nextRowValue(row, startIndex) {
    for (let index = startIndex + 1; index < row.length; index += 1) {
      const value = cell(row, index);
      if (value) return value;
    }
    return "";
  }

  function findProjectMetadata(sheets) {
    let projectName = "";
    let projectLocation = "";
    for (const sheet of sheets) {
      for (const row of sheet.rows) {
        for (let index = 0; index < (row || []).length; index += 1) {
          const value = cell(row, index);
          const normalized = normalize(value);
          if (!projectName && /^obra(?:\s|$)/.test(normalized)) {
            projectName = value.replace(/^\s*obra\s*:\s*/i, "").trim() || nextRowValue(row, index);
          }
          if (!projectLocation && /^local(?:\s|$)/.test(normalized)) {
            projectLocation = value.replace(/^\s*local\s*:\s*/i, "").trim() || nextRowValue(row, index);
          }
        }
      }
    }
    return { projectName, projectLocation };
  }

  function isGroupNumber(value) {
    const numeric = Number(String(value || "").replace(/[^0-9.-]/g, ""));
    return Number.isInteger(numeric) && numeric > 0 && numeric % 100 === 0;
  }

  function isIgnoredHeading(description) {
    const value = normalize(description);
    return !value
      || value.startsWith("total")
      || value.startsWith("bdi")
      || value.includes("planilha orcamentaria")
      || value.includes("descricao dos servicos");
  }

  function compactEvidenceRow(row, labels = [], maxLength = 520) {
    const parts = [];
    for (let index = 0; index < (row || []).length; index += 1) {
      const value = cell(row, index);
      if (!value) continue;
      const label = cell(labels, index);
      const text = label && normalize(label) !== normalize(value) ? `${label}: ${value}` : value;
      parts.push(text);
      if (parts.join(" | ").length >= maxLength) break;
    }
    return parts.join(" | ").slice(0, maxLength);
  }

  function workbookContextFromSheets(sheets, budgetSheetNames) {
    const lines = [];
    for (const sheet of sheets) {
      if (budgetSheetNames.has(sheet.name)) continue;
      const preferred = /mem[oó]ria|c[aá]lculo/i.test(sheet.name);
      let count = 0;
      for (let rowIndex = 0; rowIndex < sheet.rows.length; rowIndex += 1) {
        const rowText = compactEvidenceRow(sheet.rows[rowIndex], [], 320);
        if (!rowText) continue;
        lines.push(`Aba ${sheet.name}, linha ${rowIndex + 1}: ${rowText}`);
        count += 1;
        if (count >= (preferred ? 12 : 3) || lines.join("\n").length >= 2600) break;
      }
      if (lines.join("\n").length >= 2600) break;
    }
    return lines.join("\n").slice(0, 2600);
  }

  function attachWorkbookEvidence(items, sheets, budgetSheetNames) {
    for (const item of items) {
      const codeKey = normalize(item.referenceCode).replace(/\s+/g, "");
      const descriptionKey = normalize(item.description);
      const evidence = [];
      if (item.rowContext) evidence.push(`Linha orçamentária: ${item.rowContext}`);
      if (item.calculationContext) evidence.push(`Memória de cálculo da linha: ${item.calculationContext}`);

      for (const sheet of sheets) {
        for (let rowIndex = 0; rowIndex < sheet.rows.length; rowIndex += 1) {
          if (sheet.name === item.sheet && String(rowIndex + 1) === item.row) continue;
          const row = sheet.rows[rowIndex] || [];
          const normalizedCells = row.map((value) => normalize(value));
          const codeMatch = codeKey.length >= 4 && normalizedCells.some((value) => value.replace(/\s+/g, "") === codeKey);
          const descriptionMatch = descriptionKey.length >= 18 && normalizedCells.some((value) => value === descriptionKey || value.includes(descriptionKey));
          if (!codeMatch && !descriptionMatch) continue;
          const rowText = compactEvidenceRow(row, [], 480);
          if (rowText) evidence.push(`Aba ${sheet.name}, linha ${rowIndex + 1}: ${rowText}`);
          if (evidence.length >= 5) break;
        }
        if (evidence.length >= 5) break;
      }
      item.supportingContext = evidence.join("\n").slice(0, 2200);
    }
    return workbookContextFromSheets(sheets, budgetSheetNames);
  }

  function extractBudgetFromSheets(sheets) {
    const items = [];
    const metadata = findProjectMetadata(sheets);
    const budgetSheetNames = new Set();

    for (const sheet of sheets) {
      const header = findHeader(sheet.rows);
      if (!header) continue;
      budgetSheetNames.add(sheet.name);
      const { columns, labels } = header;
      let pendingSection = "";
      let pendingGroup = "";
      let pendingSubgroup = "";

      for (let rowIndex = header.rowIndex + 1; rowIndex < sheet.rows.length; rowIndex += 1) {
        const row = sheet.rows[rowIndex] || [];
        const itemNumber = cell(row, columns.item);
        const reference = columns.reference >= 0 ? cell(row, columns.reference) : "";
        const referenceCode = cell(row, columns.code);
        const description = cell(row, columns.description);
        const unit = cell(row, columns.unit);
        const quantity = cell(row, columns.quantity);
        const calculationContext = columns.calculation >= 0 ? cell(row, columns.calculation) : "";
        const isService = Boolean(referenceCode && description && (reference || unit || quantity));

        if (isService) {
          items.push({
            sequence: String(items.length + 1),
            itemNumber,
            referenceCode,
            description,
            unit,
            quantity,
            sheet: sheet.name,
            row: String(rowIndex + 1),
            sectionHeading: pendingSection,
            groupHeading: pendingGroup,
            subgroupHeading: pendingSubgroup,
            calculationContext,
            rowContext: compactEvidenceRow(row, labels),
            supportingContext: "",
          });
          pendingSection = "";
          pendingGroup = "";
          pendingSubgroup = "";
          continue;
        }

        if (isIgnoredHeading(description)) continue;
        if (/^[A-Z]$/i.test(itemNumber)) {
          pendingSection = `${itemNumber.toUpperCase()} - ${description}`;
          pendingGroup = "";
          pendingSubgroup = "";
        } else if (isGroupNumber(itemNumber)) {
          pendingGroup = `${itemNumber} ${description}`;
          pendingSubgroup = "";
        } else if (!itemNumber && !reference && !referenceCode) {
          pendingSubgroup = description;
        }
      }
    }

    const workbookContext = attachWorkbookEvidence(items, sheets, budgetSheetNames);
    return { ...metadata, workbookContext, items };
  }

  function parseDelimited(text, delimiter) {
    const rows = [];
    let row = [];
    let value = "";
    let quoted = false;
    const source = String(text || "").replace(/^\uFEFF/, "");
    for (let index = 0; index <= source.length; index += 1) {
      const character = source[index] || "\n";
      if (quoted) {
        if (character === '"' && source[index + 1] === '"') {
          value += '"';
          index += 1;
        } else if (character === '"') quoted = false;
        else value += character;
      } else if (character === '"') quoted = true;
      else if (character === delimiter) {
        row.push(value);
        value = "";
      } else if (character === "\n") {
        row.push(value.replace(/\r$/, ""));
        rows.push(row);
        row = [];
        value = "";
      } else value += character;
    }
    return rows;
  }

  function sheetsToIndexText(sheets, filename) {
    const lines = [
      `ARQUIVO-BASE: ${String(filename || "planilha")}`,
      "Conteúdo integral organizado por aba e linha para busca técnica.",
    ];
    for (const sheet of sheets) {
      lines.push("", `=== ABA: ${sheet.name} ===`);
      for (let rowIndex = 0; rowIndex < sheet.rows.length; rowIndex += 1) {
        const values = (sheet.rows[rowIndex] || [])
          .map((value) => String(value || "").replace(/[\t\r\n]+/g, " ").trim());
        if (values.some(Boolean)) lines.push(`Linha ${rowIndex + 1}: ${values.join("\t")}`);
      }
    }
    return lines.join("\n");
  }

  async function indexText(file) {
    const extension = String(file?.name || "").split(".").pop()?.toLowerCase();
    let sheets;
    if (extension === "xlsx") sheets = await workbookSheets(file);
    else if (extension === "csv" || extension === "tsv") {
      sheets = [{ name: file.name, rows: parseDelimited(await file.text(), extension === "tsv" ? "\t" : ",") }];
    } else throw new Error("A conversão para a base permanente está disponível para XLSX, CSV e TSV.");
    return sheetsToIndexText(sheets, file.name);
  }

  async function extract(file) {
    const extension = String(file?.name || "").split(".").pop()?.toLowerCase();
    let sheets;
    if (extension === "xlsx") sheets = await workbookSheets(file);
    else if (extension === "csv" || extension === "tsv") {
      sheets = [{ name: file.name, rows: parseDelimited(await file.text(), extension === "tsv" ? "\t" : ",") }];
    } else throw new Error("A leitura direta está disponível para XLSX, CSV e TSV.");
    const result = extractBudgetFromSheets(sheets);
    if (!result.items.length) throw new Error("Nenhum item de serviço foi localizado nas colunas Item, Ref., Cód., Descrição, Unid. e Quant.");
    return result;
  }

  global.DocflowMemorialXlsx = { extract, extractBudgetFromSheets, indexText };
})(typeof window !== "undefined" ? window : globalThis);
