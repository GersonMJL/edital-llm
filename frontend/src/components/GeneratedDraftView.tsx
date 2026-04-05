import { PipelineResult } from "../services/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MarkdownIt from "markdown-it";

type Props = {
  result: PipelineResult;
};

type DraftSection = {
  content: string;
};

function normalizeMarkdownLine(line: string): string {
  return line
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/(```|`|\*\*|__|~~)/g, "")
    .replace(/^#{1,6}\s+/g, "")
    .trim();
}

function buildFileName() {
  const isoDate = new Date().toISOString().slice(0, 10);
  return `rascunho-projeto-${isoDate}`;
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

function renderInlineTokens(tokens: Array<{ type: string; content: string; children?: Array<{ type: string; content: string }> }>): Array<string | { text: string; bold?: boolean; italics?: boolean; code?: boolean }> {
  const result: Array<string | { text: string; bold?: boolean; italics?: boolean; code?: boolean }> = [];

  for (const token of tokens) {
    if (token.type === "text") {
      result.push(token.content);
      continue;
    }

    if (token.type === "code_inline") {
      result.push({ text: token.content, code: true });
      continue;
    }

    if (token.type === "strong_open" || token.type === "em_open") {
      const closeType = token.type === "strong_open" ? "strong_close" : "em_close";
      const childTokens = token.children ?? [];
      const nestedText = renderInlineTokens(childTokens).map((item) => (typeof item === "string" ? item : item.text)).join("");
      result.push({ text: nestedText, bold: token.type === "strong_open", italics: token.type === "em_open" });
      const closeIndex = childTokens.findIndex((child) => child.type === closeType);
      if (closeIndex >= 0) {
        continue;
      }
    }

    if (token.children && token.children.length > 0) {
      result.push(...renderInlineTokens(token.children));
      continue;
    }

    if (token.content) {
      result.push(token.content);
    }
  }

  return result;
}

function extractInlineText(token: { children?: Array<{ type: string; content: string }> }): string {
  const rendered = renderInlineTokens(token.children ?? []);
  return rendered.map((item) => (typeof item === "string" ? item : item.text)).join("").trim();
}

function markdownToPdfmakeContent(markdown: string): any[] {
  const md = new MarkdownIt({
    html: false,
    linkify: true,
    breaks: false,
  });
  const tokens = md.parse(markdown, {});
  const content: any[] = [];

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];

    if (token.type === "heading_open") {
      const inlineToken = tokens[i + 1];
      const level = Number(token.tag.replace("h", ""));
      const text = inlineToken ? extractInlineText(inlineToken as any) : "";
      const style = ("h" + level) as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
      content.push({ text, style });
      i += 2;
      continue;
    }

    if (token.type === "paragraph_open") {
      const inlineToken = tokens[i + 1];
      const inline = inlineToken?.children ? renderInlineTokens(inlineToken.children as any) : [];
      content.push({ text: inline.length > 0 ? inline : extractInlineText((inlineToken ?? {}) as any), style: "p" });
      i += 2;
      continue;
    }

    if (token.type === "bullet_list_open") {
      const items: any[] = [];
      let j = i + 1;

      while (j < tokens.length && tokens[j].type !== "bullet_list_close") {
        if (tokens[j].type === "list_item_open") {
          let itemText = "";
          let k = j + 1;
          while (k < tokens.length && tokens[k].type !== "list_item_close") {
            if (tokens[k].type === "inline") {
              itemText = extractInlineText(tokens[k] as any);
            }
            k += 1;
          }
          items.push(itemText);
          j = k;
        }
        j += 1;
      }

      content.push({ ul: items, style: "list" });
      i = j;
      continue;
    }

    if (token.type === "ordered_list_open") {
      const items: any[] = [];
      let j = i + 1;

      while (j < tokens.length && tokens[j].type !== "ordered_list_close") {
        if (tokens[j].type === "list_item_open") {
          let itemText = "";
          let k = j + 1;
          while (k < tokens.length && tokens[k].type !== "list_item_close") {
            if (tokens[k].type === "inline") {
              itemText = extractInlineText(tokens[k] as any);
            }
            k += 1;
          }
          items.push(itemText);
          j = k;
        }
        j += 1;
      }

      content.push({ ol: items, style: "list" });
      i = j;
      continue;
    }

    if (token.type === "fence" || token.type === "code_block") {
      content.push({ text: token.content.trimEnd(), style: "code" });
      continue;
    }

    if (token.type === "hr") {
      content.push({ canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: "#d6d1c5" }], margin: [0, 6, 0, 10] });
    }
  }

  return content;
}

export function GeneratedDraftView({ result }: Props) {
  const draft = result.rascunho;
  const sections: DraftSection[] = [
    { content: draft.introducao },
    { content: draft.justificativa },
    { content: draft.objetivos },
    { content: draft.metodologia },
    { content: draft.cronograma },
    { content: draft.orcamento },
  ];

  const markdownSections = sections.map((section) => section.content).join("\n\n");

  async function handleExportDocx(): Promise<void> {
    const { Document, HeadingLevel, Packer, Paragraph } = await import("docx");

    const children: InstanceType<typeof Paragraph>[] = [
      new Paragraph({ text: "Rascunho de Projeto", heading: HeadingLevel.TITLE }),
      new Paragraph(""),
    ];

    for (const section of sections) {
      for (const rawLine of section.content.split("\n")) {
        const line = normalizeMarkdownLine(rawLine);
        if (!line) {
          children.push(new Paragraph(""));
          continue;
        }

        if (/^[-*]\s+/.test(rawLine.trim())) {
          children.push(
            new Paragraph({
              text: normalizeMarkdownLine(rawLine.replace(/^[-*]\s+/, "")),
              bullet: { level: 0 },
            }),
          );
          continue;
        }

        children.push(new Paragraph(line));
      }

      children.push(new Paragraph(""));
    }

    const doc = new Document({
      sections: [{ children }],
    });

    const blob = await Packer.toBlob(doc);
    downloadBlob(blob, `${buildFileName()}.docx`);
  }

  async function handleExportPdf(): Promise<void> {
    const [pdfMakeModule, robotoFontsModule] = await Promise.all([
      import("pdfmake/build/pdfmake"),
      import("pdfmake/build/fonts/Roboto"),
    ]);

    const pdfMake = (pdfMakeModule as any).default ?? pdfMakeModule;
    const robotoContainer = (robotoFontsModule as any).default ?? robotoFontsModule;

    if (typeof pdfMake.addFontContainer === "function") {
      pdfMake.addFontContainer(robotoContainer);
    } else {
      pdfMake.vfs = robotoContainer.vfs ?? robotoContainer.pdfMake?.vfs ?? {};
      if (robotoContainer.fonts) {
        pdfMake.fonts = robotoContainer.fonts;
      }
    }

    const docDefinition = {
      pageSize: "A4",
      pageMargins: [36, 36, 36, 36],
      content: [
        { text: "Rascunho de Projeto", style: "title" },
        ...markdownToPdfmakeContent(markdownSections),
      ],
      styles: {
        title: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
        h1: { fontSize: 18, bold: true, margin: [0, 10, 0, 6] },
        h2: { fontSize: 16, bold: true, margin: [0, 9, 0, 5] },
        h3: { fontSize: 14, bold: true, margin: [0, 8, 0, 4] },
        h4: { fontSize: 13, bold: true, margin: [0, 7, 0, 4] },
        h5: { fontSize: 12, bold: true, margin: [0, 6, 0, 3] },
        h6: { fontSize: 11, bold: true, margin: [0, 6, 0, 3] },
        p: { fontSize: 11, margin: [0, 2, 0, 6] },
        list: { fontSize: 11, margin: [0, 2, 0, 8] },
        code: { fontSize: 10, margin: [0, 4, 0, 8], color: "#333333" },
      },
      defaultStyle: {
        fontSize: 11,
      },
    };

    pdfMake.createPdf(docDefinition).download(`${buildFileName()}.pdf`);
  }

  return (
    <section className="card">
      <h2>3. Rascunho gerado</h2>
      <div className="draft-actions">
        <button type="button" onClick={handleExportDocx}>
          Exportar DOCX
        </button>
        <button type="button" onClick={handleExportPdf}>
          Exportar PDF
        </button>
      </div>
      <article className="draft markdown-draft">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdownSections}</ReactMarkdown>
      </article>
    </section>
  );
}
