
export const formatEventDates = (dates: string[]): string => {
  if (!dates || dates.length === 0) return "";
  
  // Sort dates
  const sortedDates = [...dates].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  
  // Use a fixed hour to avoid timezone issues when parsing YYYY-MM-DD
  const parsedDates = sortedDates.map(d => {
    const [year, month, day] = d.split('-').map(Number);
    return new Date(year, month - 1, day);
  });
  
  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  if (parsedDates.length === 1) {
    const d = parsedDates[0];
    return `${String(d.getDate()).padStart(2, '0')} de ${monthNames[d.getMonth()]} de ${d.getFullYear()}`;
  }

  // Check if all dates are in the same month and year
  const first = parsedDates[0];
  const last = parsedDates[parsedDates.length - 1];
  const sameMonth = parsedDates.every(d => d.getMonth() === first.getMonth() && d.getFullYear() === first.getFullYear());
  const sameYear = parsedDates.every(d => d.getFullYear() === first.getFullYear());

  if (sameMonth && sameYear) {
    const dayStrings = parsedDates.map(d => String(d.getDate()).padStart(2, '0'));
    // Join all but last with comma, then ' e ' for last
    const daysPart = dayStrings.length > 2 
      ? dayStrings.slice(0, -1).join(', ') + ' e ' + dayStrings.slice(-1)
      : dayStrings.join(' e ');
    return `${daysPart} de ${monthNames[first.getMonth()]} de ${first.getFullYear()}`;
  }

  if (sameYear) {
    // Different months, same year: "30 de Agosto e 01 de Setembro de 2026"
    const parts = parsedDates.map(d => `${String(d.getDate()).padStart(2, '0')} de ${monthNames[d.getMonth()]}`);
    const joined = parts.length > 2
      ? parts.slice(0, -1).join(', ') + ' e ' + parts.slice(-1)
      : parts.join(' e ');
    return `${joined} de ${first.getFullYear()}`;
  }

  // Different years (rare but possible)
  return parsedDates.map(d => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`).join(', ');
};

export const getEventStatus = (dates: string[]) => {
  if (!dates || dates.length === 0) return { isExpired: false, lastDate: null };
  
  const sortedDates = [...dates].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  const lastDateStr = sortedDates[sortedDates.length - 1];
  
  // Set expiration to the end of the last day (e.g. 23:59:59)
  const [year, month, day] = lastDateStr.split('-').map(Number);
  const expirationDate = new Date(year, month - 1, day, 23, 59, 59);
  
  const now = new Date();
  return {
    isExpired: now > expirationDate,
    lastDate: expirationDate
  };
};
