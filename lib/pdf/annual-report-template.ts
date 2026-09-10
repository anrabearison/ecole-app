export interface AnnualReportData {
  schoolName: string
  schoolAddress?: string
  schoolLogoBase64?: string
  schoolYear: string
  studentFirstName: string
  studentLastName: string
  className: string
  periodAverages: Array<{ periodName: string; average: number }>
  annualAverage: number
  decision: string
  observations?: string
}

export function renderAnnualReportHtml(data: AnnualReportData): string {
  const logoHtml = data.schoolLogoBase64
    ? `<img src="${data.schoolLogoBase64}" alt="Logo École" class="school-logo" />`
    : `<div class="school-logo-placeholder">${data.schoolName.charAt(0)}</div>`

  const periodRows = data.periodAverages
    .map(
      (p) => `
    <tr>
      <td>${escapeHtml(p.periodName)}</td>
      <td class="text-right font-bold">${p.average.toFixed(2)} / 20</td>
    </tr>
  `
    )
    .join("")

  const isPromoted = data.decision.toLowerCase().includes("admis") || data.decision.toLowerCase().includes("promoted")

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Bulletin Annuel - ${escapeHtml(data.studentLastName)} ${escapeHtml(data.studentFirstName)}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background-color: #ffffff;
      padding: 24px;
      font-size: 13px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .school-logo {
      max-width: 80px;
      max-height: 80px;
      object-fit: contain;
      border-radius: 8px;
    }
    .school-logo-placeholder {
      width: 64px;
      height: 64px;
      background-color: #2563eb;
      color: #ffffff;
      font-size: 28px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
    }
    .school-info h1 {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
    }
    .school-info p {
      font-size: 12px;
      color: #64748b;
    }
    .header-right {
      text-align: right;
    }
    .badge-annual {
      display: inline-block;
      background-color: #f3e8ff;
      color: #7e22ce;
      border: 1px solid #d8b4fe;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .school-year {
      font-size: 12px;
      color: #475569;
      font-weight: 500;
    }
    .title-banner {
      background: linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%);
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 8px;
      text-align: center;
      margin-bottom: 20px;
    }
    .title-banner h2 {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .student-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 20px;
      margin-bottom: 24px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    .info-group label {
      font-size: 11px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 600;
      display: block;
      margin-bottom: 2px;
    }
    .info-group span {
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
    }
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 10px;
      padding-bottom: 4px;
      border-bottom: 1px solid #cbd5e1;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    th {
      background-color: #f1f5f9;
      color: #334155;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      text-align: left;
      padding: 10px 14px;
      border-bottom: 2px solid #cbd5e1;
    }
    td {
      padding: 10px 14px;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
    }
    tr:nth-child(even) {
      background-color: #f8fafc;
    }
    .text-right {
      text-align: right;
    }
    .font-bold {
      font-weight: 600;
    }
    .deliberation-box {
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      ${
        isPromoted
          ? "background-color: #f0fdf4; border: 1px solid #bbf7d0;"
          : "background-color: #fef2f2; border: 1px solid #fecaca;"
      }
    }
    .deliberation-info .label {
      font-size: 12px;
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .deliberation-info .average-value {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
    }
    .decision-badge {
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 700;
      ${
        isPromoted
          ? "background-color: #16a34a; color: #ffffff;"
          : "background-color: #dc2626; color: #ffffff;"
      }
    }
    .observations-box {
      background-color: #fffbeb;
      border: 1px solid #fef3c7;
      border-left: 4px solid #f59e0b;
      border-radius: 6px;
      padding: 14px 18px;
      margin-bottom: 24px;
    }
    .observations-box h4 {
      font-size: 12px;
      text-transform: uppercase;
      color: #b45309;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .observations-box p {
      font-style: italic;
      color: #78350f;
      font-size: 13px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      ${logoHtml}
      <div class="school-info">
        <h1>${escapeHtml(data.schoolName)}</h1>
        ${data.schoolAddress ? `<p>${escapeHtml(data.schoolAddress)}</p>` : ""}
      </div>
    </div>
    <div class="header-right">
      <div class="badge-annual">Bulletin Annuel</div>
      <div class="school-year">Année scolaire : ${escapeHtml(data.schoolYear)}</div>
    </div>
  </div>

  <div class="title-banner">
    <h2>Bulletin Annuel de Délibération</h2>
  </div>

  <div class="student-card">
    <div class="info-group">
      <label>Nom & Prénom</label>
      <span>${escapeHtml(data.studentLastName)} ${escapeHtml(data.studentFirstName)}</span>
    </div>
    <div class="info-group">
      <label>Classe</label>
      <span>${escapeHtml(data.className)}</span>
    </div>
    <div class="info-group">
      <label>Année Scolaire</label>
      <span>${escapeHtml(data.schoolYear)}</span>
    </div>
  </div>

  <div class="section-title">Moyennes par Période</div>
  <table>
    <thead>
      <tr>
        <th>Période</th>
        <th class="text-right" style="width: 160px;">Moyenne Périodique</th>
      </tr>
    </thead>
    <tbody>
      ${periodRows}
    </tbody>
  </table>

  <div class="deliberation-box">
    <div class="deliberation-info">
      <div class="label">Moyenne Annuelle de Délibération</div>
      <div class="average-value">${data.annualAverage.toFixed(2)} / 20</div>
    </div>
    <div class="decision-badge">
      ${escapeHtml(data.decision)}
    </div>
  </div>

  ${
    data.observations
      ? `
  <div class="observations-box">
    <h4>Observations du Conseil de Classe</h4>
    <p>"${escapeHtml(data.observations)}"</p>
  </div>
  `
      : ""
  }

  <div class="footer">
    Document annuel généré automatiquement par Sekoly • ${new Date().toLocaleDateString("fr-FR")}
  </div>
</body>
</html>
  `
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
