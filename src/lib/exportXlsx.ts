import * as XLSX from 'xlsx';

export const exportToXlsx = (headers: string[], rows: any[][], filename: string) => {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  
  // Auto-width columns
  const colWidths = headers.map((h, i) => {
    const maxLen = Math.max(h.length, ...rows.map(r => String(r[i] || '').length));
    return { wch: Math.min(maxLen + 2, 50) };
  });
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Dados');
  XLSX.writeFile(wb, filename);
};
