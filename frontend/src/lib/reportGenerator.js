import { jsPDF } from "jspdf";

const RISK_HEX = {
  none: [59, 72, 84],
  low: [122, 155, 126],
  elevated: [217, 164, 85],
  high: [228, 137, 122],
  critical: [212, 85, 66],
};

export function generateReport(entry) {
  const { result, raw, sensitivity, savedAt } = entry;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = 56;

  // ---- header ----
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("TrapShield", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Case report · generated ${new Date(savedAt).toLocaleString()}`, margin, y + 16);
  doc.setTextColor(0);
  y += 40;
  doc.setDrawColor(230);
  doc.line(margin, y, pageWidth - margin, y);
  y += 28;

  // ---- risk summary ----
  const riskColor = RISK_HEX[result.overallRisk] || RISK_HEX.none;
  doc.setFillColor(...riskColor);
  doc.circle(margin + 22, y + 14, 22, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(result.overallRisk.toUpperCase(), margin + 22, y + 17, { align: "center" });
  doc.setTextColor(0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Manipulation Journey summary", margin + 60, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text(
    `${result.messageCount} messages examined  ·  score ${result.totalScore}  ·  sensitivity ${sensitivity.toFixed(1)}  ·  trend: ${result.trend}`,
    margin + 60,
    y + 22
  );
  doc.setTextColor(0);
  y += 56;

  // ---- journey chart (hand-drawn line, no external image needed) ----
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Manipulation journey", margin, y);
  y += 14;

  const chartX = margin;
  const chartW = pageWidth - margin * 2;
  const chartH = 90;
  const maxScore = Math.max(1, ...result.messages.map((m) => m.cumulative));
  const points = result.messages.map((m, i) => {
    const x = chartX + (i / Math.max(1, result.messages.length - 1)) * chartW;
    const yy = y + chartH - (m.cumulative / maxScore) * chartH;
    return [x, yy];
  });

  doc.setDrawColor(220);
  doc.rect(chartX, y, chartW, chartH);
  doc.setDrawColor(...RISK_HEX.high);
  doc.setLineWidth(1.4);
  for (let i = 0; i < points.length - 1; i++) {
    doc.line(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
  }
  result.messages.forEach((m, i) => {
    if (m.flags.length > 0) {
      doc.setFillColor(...RISK_HEX.high);
      doc.circle(points[i][0], points[i][1], 2.4, "F");
    }
  });
  doc.setLineWidth(1);
  y += chartH + 26;

  // ---- patterns detected ----
  const cats = Object.entries(result.categoryTally || {});
  if (cats.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Patterns detected", margin, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    cats.forEach(([, cat]) => {
      if (y > 760) {
        doc.addPage();
        y = 56;
      }
      doc.setFont("helvetica", "bold");
      doc.text(`${cat.label} (×${cat.count})`, margin, y);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(cat.explain, pageWidth - margin * 2 - 10);
      doc.setTextColor(100);
      doc.text(lines, margin, y + 12);
      doc.setTextColor(0);
      y += 12 + lines.length * 11 + 8;
    });
    y += 8;
  }

  // ---- annotated conversation ----
  if (y > 700) {
    doc.addPage();
    y = 56;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Annotated conversation", margin, y);
  y += 16;
  doc.setFontSize(9.5);

  result.messages.forEach((m) => {
    if (y > 770) {
      doc.addPage();
      y = 56;
    }
    doc.setFont("helvetica", "bold");
    doc.setTextColor(m.flags.length ? RISK_HEX.high[0] : 130, m.flags.length ? RISK_HEX.high[1] : 130, m.flags.length ? RISK_HEX.high[2] : 130);
    doc.text(m.sender.toUpperCase(), margin, y);
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(m.text, pageWidth - margin * 2 - 90);
    doc.text(lines, margin + 80, y);
    y += Math.max(12, lines.length * 12);
    if (m.flags.length > 0) {
      doc.setFontSize(8);
      doc.setTextColor(...RISK_HEX.high);
      doc.text(m.flags.map((f) => f.label).join("  ·  "), margin + 80, y);
      doc.setTextColor(0);
      doc.setFontSize(9.5);
      y += 12;
    }
    y += 4;
  });

  // ---- guidance ----
  if (result.guidance?.length) {
    if (y > 700) {
      doc.addPage();
      y = 56;
    }
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Safety guidance", margin, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    result.guidance.forEach((tip) => {
      if (y > 770) {
        doc.addPage();
        y = 56;
      }
      const lines = doc.splitTextToSize(`•  ${tip}`, pageWidth - margin * 2);
      doc.text(lines, margin, y);
      y += lines.length * 12 + 6;
    });
  }

  // ---- footer disclaimer on every page ----
  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(7.5);
    doc.setTextColor(150);
    doc.text(
      "Generated by TrapShield · not a substitute for professional advice · Childline India: 1098",
      margin,
      810
    );
    doc.setTextColor(0);
  }

  const filename = `trapshield-report-${new Date(savedAt).toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
