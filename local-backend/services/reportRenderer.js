const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const TTS_SCRIPT = path.join(__dirname, '../scripts/tts_generator.py');
const CHART_SCRIPT = path.join(__dirname, '../scripts/chart_generator.py');

function runPython(scriptPath, args) {
  return new Promise((resolve, reject) => {
    const py = spawn('python', [scriptPath, ...args]);
    let stdout = '';
    let stderr = '';
    py.stdout.on('data', (data) => { stdout += data.toString(); });
    py.stderr.on('data', (data) => { stderr += data.toString(); });
    py.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python script exited ${code}: ${stderr || stdout}`));
      } else {
        try {
          resolve(JSON.parse(stdout));
        } catch (e) {
          resolve({ raw: stdout, error: e.message });
        }
      }
    });
  });
}

class ReportRenderer {
  constructor(config = {}) {
    this.outputDir = config.outputDir || path.join(__dirname, '../data/reports');
    this.templatesPath = config.templatesPath || path.join(__dirname, '../config/report_templates.json');
    fs.mkdirSync(this.outputDir, { recursive: true });
  }

  async render(report, format, options = {}) {
    switch (format) {
      case 'markdown':
        return this.toMarkdown(report, options);
      case 'html':
        return this.toHTML(report, options);
      case 'audio':
        return this.toAudio(report, options);
      case 'excel':
        return this.toExcel(report, options);
      case 'pdf':
        return this.toPDF(report, options);
      case 'json':
        return this.toJSON(report, options);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  toMarkdown(report, options = {}) {
    const parts = report.parts || {};
    let md = `# ${report.template || 'Báo cáo thị trường'} — ${report.date || new Date().toISOString().split('T')[0]}\n\n`;
    md += `**Market Regime**: ${report.market_regime || 'N/A'} (độ tin cậy: ${Math.round((report.regime_confidence || 0) * 100)}%)\n\n`;
    md += `**Ngành tiêu điểm**: ${(report.focus_sectors || []).map(s => s.sector).join(', ') || 'N/A'}\n\n`;
    md += `---\n\n`;

    for (const [key, part] of Object.entries(parts)) {
      if (part && part.content) {
        md += `${part.content}\n\n---\n\n`;
      }
    }

    md += `## Tổng hợp nguồn\n\n`;
    md += `- Tổng nguồn: ${report.validation_summary?.total_sources || 0}\n`;
    md += `- Đã xác thực: ${report.validation_summary?.validated || 0}\n`;
    md += `- Lỗi: ${report.validation_summary?.failed || 0}\n\n`;

    md += `*Báo cáo được tạo bởi VNStock AI v3.0*\n`;

    const outputPath = path.join(this.outputDir, `${report.report_id || 'report'}.md`);
    fs.writeFileSync(outputPath, md, 'utf-8');
    return { format: 'markdown', path: outputPath, content: md };
  }

  toHTML(report, options = {}) {
    const parts = report.parts || {};
    let html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${report.template || 'Báo cáo'} — ${report.date || ''}</title>
<style>
body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; background: #f5f5f5; color: #333; }
.header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 12px; margin-bottom: 24px; }
.header h1 { margin: 0; font-size: 24px; }
.badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-right: 8px; }
.badge-uptrend { background: #4caf50; color: white; }
.badge-downtrend { background: #f44336; color: white; }
.badge-sideway { background: #ff9800; color: white; }
.section { background: white; padding: 20px; border-radius: 12px; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.section h2 { margin-top: 0; color: #667eea; font-size: 18px; }
.table { width: 100%; border-collapse: collapse; margin-top: 12px; }
.table th, .table td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; }
.table th { background: #f8f9fa; font-weight: 600; }
.footer { text-align: center; color: #999; font-size: 12px; margin-top: 32px; }
</style>
</head>
<body>
<div class="header">
  <h1>${report.template || 'Báo cáo thị trường'}</h1>
  <p>Ngày: ${report.date || new Date().toLocaleDateString('vi-VN')}</p>
  <span class="badge badge-${(report.market_regime || '').split('_')[0]}">${report.market_regime || 'N/A'}</span>
  <span class="badge" style="background:#e0e0e0;color:#333;">Độ tin cậy: ${Math.round((report.regime_confidence || 0) * 100)}%</span>
</div>
`;

    for (const [key, part] of Object.entries(parts)) {
      if (part && part.content) {
        // Convert markdown-like content to HTML
        const contentHtml = part.content
          .replace(/## (.*)/g, '<h2>$1</h2>')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\n/g, '<br>')
          .replace(/- (.*?)<br>/g, '<li>$1</li>');
        html += `<div class="section">${contentHtml}</div>\n`;
      }
    }

    html += `<div class="footer">
  <p>VNStock AI v3.0 | Tổng nguồn: ${report.validation_summary?.total_sources || 0} | Đã xác thực: ${report.validation_summary?.validated || 0}</p>
</div>
</body>
</html>`;

    const outputPath = path.join(this.outputDir, `${report.report_id || 'report'}.html`);
    fs.writeFileSync(outputPath, html, 'utf-8');
    return { format: 'html', path: outputPath, content: html };
  }

  async toAudio(report, options = {}) {
    const md = this.toMarkdown(report, { ...options, _noWrite: true });
    const text = md.content || JSON.stringify(report);
    const outputPath = path.join(this.outputDir, `${report.report_id || 'report'}.mp3`);

    try {
      const result = await runPython(TTS_SCRIPT, ['generate', text.substring(0, 5000), outputPath, options.ttsMethod || 'google_cloud']);
      return { format: 'audio', path: result.output_path || outputPath, ...result };
    } catch (err) {
      return { format: 'audio', error: err.message, path: outputPath };
    }
  }

  toExcel(report, options = {}) {
    // Simple CSV-based Excel generation (can be enhanced with xlsx library)
    const parts = report.parts || {};
    const watchlist = parts.part4_watchlist;
    let csv = 'Mã CP,Xu hướng,Sức mạnh,Hành động\n';

    // Extract watchlist rows from markdown table
    if (watchlist && watchlist.content) {
      const lines = watchlist.content.split('\n');
      for (const line of lines) {
        if (line.startsWith('|') && !line.includes('---') && !line.includes('Mã CP')) {
          const cells = line.split('|').filter(c => c.trim()).map(c => c.trim());
          if (cells.length >= 4) {
            csv += `${cells[0]},${cells[1]},${cells[2]},${cells[3]}\n`;
          }
        }
      }
    }

    const outputPath = path.join(this.outputDir, `${report.report_id || 'report'}.csv`);
    fs.writeFileSync(outputPath, csv, 'utf-8');
    return { format: 'excel', path: outputPath, note: 'CSV format (upgrade to xlsx library for full Excel support)' };
  }

  async toPDF(report, options = {}) {
    // PDF generation via HTML -> puppeteer or wkhtmltopdf
    const htmlResult = this.toHTML(report, { ...options, _noWrite: true });
    const outputPath = path.join(this.outputDir, `${report.report_id || 'report'}.pdf`);

    // Placeholder: requires puppeteer or wkhtmltopdf
    return {
      format: 'pdf',
      path: outputPath,
      note: 'PDF generation requires puppeteer or wkhtmltopdf. Use HTML output as intermediate.',
      htmlPath: htmlResult.path
    };
  }

  toJSON(report, options = {}) {
    const outputPath = path.join(this.outputDir, `${report.report_id || 'report'}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
    return { format: 'json', path: outputPath };
  }

  async renderAll(report, options = {}) {
    const formats = options.formats || ['markdown', 'html', 'json'];
    const results = {};
    for (const fmt of formats) {
      try {
        results[fmt] = await this.render(report, fmt, options);
      } catch (err) {
        results[fmt] = { error: err.message, format: fmt };
      }
    }
    return results;
  }
}

module.exports = { ReportRenderer };
