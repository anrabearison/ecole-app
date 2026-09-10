export interface ReportCardData {
  schoolName: string
  schoolAddress?: string
  schoolLogoBase64?: string
  schoolYear: string
  periodName: string
  studentFirstName: string
  studentLastName: string
  className: string
  subjects: Array<{
    name: string
    coefficient: number
    average: number
  }>
  generalAverage: number
  classRank: number
  totalStudents: number
  appreciation?: string
}

export function renderReportCardHtml(data: ReportCardData): string {
  const logoHtml = data.schoolLogoBase64
    ? `<img src="${data.schoolLogoBase64}" alt="Logo École" class="school-logo" />`
    : `<div class="school-logo-placeholder">${data.schoolName.charAt(0)}</div>`

  const subjectsRows = data.subjects
    .map(
      (s) => `
    <tr>
      <td>${escapeHtml(s.name)}</td>
      <td class="text-center">${s.coefficient}</td>
      <td class="text-right font-bold">${s.average.toFixed(2)} / 20</td>
    </tr>
  `
    )
    .join("")

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Bulletin de Notes - ${escapeHtml(data.studentLastName)} ${escapeHtml(data.studentFirstName)}</title>
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
    .badge-period {
      display: inline-block;
      background-color: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
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
      background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
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
    .text-center {
      text-align: center;
    }
    .text-right {
      text-align: right;
    }
    .font-bold {
      font-weight: 600;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .summary-box {
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }
    .summary-box.average {
      background-color: #eff6ff;
      border: 1px solid #bfdbfe;
    }
    .summary-box.rank {
      background-color: #f0fdf4;
      border: 1px solid #bbf7d0;
    }
    .summary-box .label {
      font-size: 12px;
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .summary-box .value {
      font-size: 22px;
      font-weight: 800;
    }
    .summary-box.average .value {
      color: #1d4ed8;
    }
    .summary-box.rank .value {
      color: #15803d;
    }
    .appreciation-box {
      background-color: #fffbeb;
      border: 1px solid #fef3c7;
      border-left: 4px solid #f59e0b;
      border-radius: 6px;
      padding: 14px 18px;
      margin-bottom: 24px;
    }
    .appreciation-box h4 {
      font-size: 12px;
      text-transform: uppercase;
      color: #b45309;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .appreciation-box p {
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
      <div class="badge-period">${escapeHtml(data.periodName)}</div>
      <div class="school-year">Année scolaire : ${escapeHtml(data.schoolYear)}</div>
    </div>
  </div>

  <div class="title-banner">
    <h2>Bulletin de Notes Trimestriel</h2>
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

  <div class="section-title">Résultats par Matière</div>
  <table>
    <thead>
      <tr>
        <th>Matière</th>
        <th class="text-center" style="width: 100px;">Coefficient</th>
        <th class="text-right" style="width: 140px;">Moyenne</th>
      </tr>
    </thead>
    <tbody>
      ${subjectsRows}
    </tbody>
  </table>

  <div class="summary-grid">
    <div class="summary-box average">
      <div class="label">Moyenne Générale</div>
      <div class="value">${data.generalAverage.toFixed(2)} / 20</div>
    </div>
    <div class="summary-box rank">
      <div class="label">Classement</div>
      <div class="value">${data.classRank}<sup>e</sup> / ${data.totalStudents}</div>
    </div>
  </div>

  ${
    data.appreciation
      ? `
  <div class="appreciation-box">
    <h4>Appréciation Générale</h4>
    <p>"${escapeHtml(data.appreciation)}"</p>
  </div>
  `
      : ""
  }

  <div class="footer">
    Bulletin généré automatiquement par Sekoly • ${new Date().toLocaleDateString("fr-FR")}
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
