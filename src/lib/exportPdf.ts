import jsPDF from "jspdf";

interface AnalysisData {
  fragmentId?: string;
  region?: string;
  site?: string;
  scriptType?: string;
  diplomatic?: { content: string; confidence: number; note?: string };
  normalized?: { content: string; confidence: number };
  expanded?: { content: string; confidence: number; highlight?: string };
  translation?: { ar?: string; fr?: string; en?: string };
  translationSources?: string[];
  aiCommentary?: string;
  references?: string[];
  confidenceHeatmap?: {
    highConfidence?: string;
    mediumConfidence?: string;
    lowConfidence?: string;
  };
  resolvedSource?: "EDCS" | "AI" | "AI+EDCS" | string;
  matchConfidence?: number | null;
  verifiedMatch?: boolean;
  matchedSources?: Array<{
    latin: string;
    location?: string;
    region?: string;
    period?: string;
    source: string;
    sourceRef?: string;
    sourceUrl?: string;
    similarity: number;
  }>;
}

export async function exportAnalysisPdf(analysis: AnalysisData, imageUrl: string | null) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentW = pageW - margin * 2;
  let y = margin;

  // Colors
  const gold: [number, number, number] = [207, 167, 75];
  const dark: [number, number, number] = [13, 17, 23];
  const white: [number, number, number] = [230, 237, 243];
  const gray: [number, number, number] = [139, 148, 158];

  // Background
  doc.setFillColor(...dark);
  doc.rect(0, 0, pageW, doc.internal.pageSize.getHeight(), "F");

  // Header
  doc.setTextColor(...gold);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("EPIGRAPHI DZ", margin, y + 8);
  doc.setFontSize(8);
  doc.setTextColor(...gray);
  doc.text("ANALYSIS REPORT", margin, y + 14);
  doc.text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), pageW - margin, y + 14, { align: "right" });

  // Gold line
  y += 20;
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // Image
  if (imageUrl) {
    try {
      const img = await loadImage(imageUrl);
      const imgH = Math.min(80, (contentW * img.height) / img.width);
      // Gold frame around image
      doc.setDrawColor(...gold);
      doc.setLineWidth(0.6);
      doc.roundedRect(margin - 0.5, y - 0.5, contentW + 1, imgH + 1, 2, 2, "S");
      doc.addImage(img.dataUrl, "JPEG", margin, y, contentW, imgH);
      // Caption
      y += imgH + 3;
      doc.setFontSize(7);
      doc.setTextColor(...gray);
      doc.setFont("helvetica", "italic");
      doc.text(`Inscription image — ${analysis.site ?? "Unknown site"}`, margin, y);
      y += 5;
    } catch {
      // skip image
    }
  }

  // Fragment info
  const drawLabel = (label: string, value: string) => {
    doc.setFontSize(8);
    doc.setTextColor(...gray);
    doc.setFont("helvetica", "normal");
    doc.text(label, margin, y);
    doc.setFontSize(11);
    doc.setTextColor(...white);
    doc.setFont("helvetica", "bold");
    doc.text(value, margin + 35, y);
    y += 6;
  };

  drawLabel("Fragment ID:", analysis.fragmentId ?? "—");
  drawLabel("Site:", analysis.site ?? "—");
  drawLabel("Region:", analysis.region ?? "—");
  drawLabel("Script:", analysis.scriptType ?? "—");
  y += 4;

  // Source / Trust banner
  if (analysis.resolvedSource) {
    if (y > 250) { addPage(doc, dark); y = margin; }
    const isEdcs = analysis.resolvedSource === "EDCS";
    const isHybrid = analysis.resolvedSource === "AI+EDCS";
    const bannerColor: [number, number, number] = isEdcs
      ? [76, 175, 80]
      : isHybrid
      ? [207, 167, 75]
      : [255, 152, 0];
    doc.setFillColor(20, 25, 35);
    doc.setDrawColor(...bannerColor);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, contentW, 14, 2, 2, "FD");
    doc.setFontSize(8);
    doc.setTextColor(...gray);
    doc.setFont("helvetica", "normal");
    doc.text("TRANSLATION SOURCE", margin + 4, y + 5);
    doc.setFontSize(11);
    doc.setTextColor(...bannerColor);
    doc.setFont("helvetica", "bold");
    const label = isEdcs
      ? "Verified — EDCS / CIL Corpus"
      : isHybrid
      ? "Hybrid — Corpus Match + AI"
      : "AI Generated";
    doc.text(label, margin + 4, y + 11);
    if (analysis.matchConfidence != null) {
      doc.setFontSize(11);
      doc.text(`${Math.round(analysis.matchConfidence * 100)}% match`, pageW - margin - 4, y + 9, { align: "right" });
    }
    y += 18;
  }

  // Layers
  const layers = [
    { title: "01 — DIPLOMATIC", content: analysis.diplomatic?.content, confidence: analysis.diplomatic?.confidence },
    { title: "02 — NORMALIZED", content: analysis.normalized?.content, confidence: analysis.normalized?.confidence },
    { title: "03 — EXPANDED", content: analysis.expanded?.content, confidence: analysis.expanded?.confidence },
    { title: "04 — TRANSLATION (AR)", content: analysis.translation?.ar },
    { title: "04 — TRANSLATION (FR)", content: analysis.translation?.fr },
    { title: "04 — TRANSLATION (EN)", content: analysis.translation?.en },
  ];

  for (const layer of layers) {
    if (!layer.content) continue;
    if (y > 260) { addPage(doc, dark); y = margin; }

    doc.setFontSize(9);
    doc.setTextColor(...gold);
    doc.setFont("helvetica", "bold");
    doc.text(layer.title, margin, y);
    if (layer.confidence != null) {
      doc.setTextColor(layer.confidence >= 90 ? 76 : 207, layer.confidence >= 90 ? 175 : 167, layer.confidence >= 90 ? 80 : 75);
      doc.text(`${layer.confidence}%`, pageW - margin, y, { align: "right" });
    }
    y += 5;

    // Content box
    doc.setFillColor(20, 25, 35);
    const lines = doc.setFontSize(10).setFont("helvetica", "normal").splitTextToSize(layer.content, contentW - 10);
    const boxH = lines.length * 5 + 8;
    doc.roundedRect(margin, y, contentW, boxH, 2, 2, "F");
    doc.setTextColor(...white);
    doc.text(lines, margin + 5, y + 6);
    y += boxH + 6;
  }

  // AI Commentary
  if (analysis.aiCommentary) {
    if (y > 240) { addPage(doc, dark); y = margin; }
    doc.setFontSize(9);
    doc.setTextColor(...gold);
    doc.setFont("helvetica", "bold");
    doc.text("AI COMMENTARY", margin, y);
    y += 5;
    doc.setFillColor(20, 25, 35);
    const lines = doc.setFontSize(10).setFont("helvetica", "normal").splitTextToSize(analysis.aiCommentary, contentW - 10);
    const boxH = lines.length * 5 + 8;
    doc.roundedRect(margin, y, contentW, boxH, 2, 2, "F");
    doc.setTextColor(...white);
    doc.text(lines, margin + 5, y + 6);
    y += boxH + 6;
  }

  // References
  if (analysis.references && analysis.references.length > 0) {
    if (y > 250) { addPage(doc, dark); y = margin; }
    doc.setFontSize(9);
    doc.setTextColor(...gold);
    doc.setFont("helvetica", "bold");
    doc.text("ACADEMIC REFERENCES", margin, y);
    y += 6;
    for (const ref of analysis.references) {
      if (y > 275) { addPage(doc, dark); y = margin; }
      doc.setFontSize(9);
      doc.setTextColor(...gray);
      doc.setFont("helvetica", "normal");
      doc.text(`• ${ref}`, margin + 2, y);
      y += 5;
    }
  }

  // Matched corpus inscriptions (EDCS)
  if (analysis.matchedSources && analysis.matchedSources.length > 0) {
    if (y > 240) { addPage(doc, dark); y = margin; }
    y += 2;
    doc.setFontSize(9);
    doc.setTextColor(...gold);
    doc.setFont("helvetica", "bold");
    doc.text("MATCHED INSCRIPTIONS — EDCS CORPUS", margin, y);
    y += 6;
    for (const m of analysis.matchedSources) {
      const latinLines = doc.setFontSize(9).setFont("helvetica", "normal").splitTextToSize(m.latin, contentW - 22);
      const metaParts = [
        m.location ? `Loc: ${m.location}` : null,
        m.period ? `Period: ${m.period}` : null,
        m.sourceRef ? `${m.source}: ${m.sourceRef}` : null,
      ].filter(Boolean) as string[];
      const metaLines = metaParts.length
        ? doc.setFontSize(8).splitTextToSize(metaParts.join("  •  "), contentW - 22)
        : [];
      const urlLines = m.sourceUrl
        ? doc.setFontSize(7).splitTextToSize(m.sourceUrl, contentW - 22)
        : [];
      const boxH = latinLines.length * 4.5 + metaLines.length * 4 + urlLines.length * 3.5 + 8;
      if (y + boxH > 282) { addPage(doc, dark); y = margin; }
      doc.setFillColor(20, 25, 35);
      doc.roundedRect(margin, y, contentW, boxH, 2, 2, "F");
      // similarity badge
      const pct = Math.round(m.similarity * 100);
      doc.setFillColor(...gold);
      doc.roundedRect(pageW - margin - 16, y + 2, 14, 6, 1, 1, "F");
      doc.setFontSize(7);
      doc.setTextColor(...dark);
      doc.setFont("helvetica", "bold");
      doc.text(`${pct}%`, pageW - margin - 9, y + 6, { align: "center" });
      // Latin text
      doc.setFontSize(9);
      doc.setTextColor(...white);
      doc.setFont("courier", "normal");
      doc.text(latinLines, margin + 4, y + 6);
      let ty = y + 6 + latinLines.length * 4.5;
      // Meta
      if (metaLines.length) {
        doc.setFontSize(8);
        doc.setTextColor(...gray);
        doc.setFont("helvetica", "normal");
        doc.text(metaLines, margin + 4, ty + 1);
        ty += metaLines.length * 4;
      }
      // URL
      if (urlLines.length) {
        doc.setFontSize(7);
        doc.setTextColor(...gold);
        doc.text(urlLines, margin + 4, ty + 2);
      }
      y += boxH + 3;
    }
  }

  // Translation sources tags
  if (analysis.translationSources && analysis.translationSources.length > 0) {
    if (y > 270) { addPage(doc, dark); y = margin; }
    y += 2;
    doc.setFontSize(9);
    doc.setTextColor(...gold);
    doc.setFont("helvetica", "bold");
    doc.text("TRANSLATION SOURCES", margin, y);
    y += 5;
    doc.setFontSize(8);
    doc.setTextColor(...white);
    doc.setFont("helvetica", "normal");
    const srcText = analysis.translationSources.join("  •  ");
    const srcLines = doc.splitTextToSize(srcText, contentW - 4);
    doc.text(srcLines, margin + 2, y + 4);
    y += srcLines.length * 4 + 4;
  }

  // Footer
  const pageH = doc.internal.pageSize.getHeight();
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.3);
  doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
  doc.setFontSize(7);
  doc.setTextColor(...gray);
  doc.text("Generated by EPIGRAPHI DZ — AI Archaeological Analysis Platform", margin, pageH - 8);

  doc.save(`epigraphi-${analysis.fragmentId ?? "report"}.pdf`);
}

function addPage(doc: jsPDF, dark: [number, number, number]) {
  doc.addPage();
  doc.setFillColor(...dark);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), "F");
}

function loadImage(url: string): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.min(img.width, 800);
      canvas.height = (canvas.width * img.height) / img.width;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve({ dataUrl: canvas.toDataURL("image/jpeg", 0.8), width: canvas.width, height: canvas.height });
    };
    img.onerror = reject;
    img.src = url;
  });
}
