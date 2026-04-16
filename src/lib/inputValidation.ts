export function onlyDigits(value: string): string {
  return (value || "").replace(/\D/g, "");
}

export function maskCpf(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  const p1 = d.slice(0, 3);
  const p2 = d.slice(3, 6);
  const p3 = d.slice(6, 9);
  const p4 = d.slice(9, 11);
  if (d.length <= 3) return p1;
  if (d.length <= 6) return `${p1}.${p2}`;
  if (d.length <= 9) return `${p1}.${p2}.${p3}`;
  return `${p1}.${p2}.${p3}-${p4}`;
}

export function normalizeCpf(value: string): string {
  return onlyDigits(value).slice(0, 11);
}

export function isValidCpf(value: string): boolean {
  const cpf = normalizeCpf(value);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;

  const calcDigit = (base: string, factor: number) => {
    let total = 0;
    for (const ch of base) {
      total += Number(ch) * factor;
      factor -= 1;
    }
    const mod = total % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const d1 = calcDigit(cpf.slice(0, 9), 10);
  const d2 = calcDigit(cpf.slice(0, 9) + String(d1), 11);
  return cpf === cpf.slice(0, 9) + String(d1) + String(d2);
}

export function normalizePhoneBR(value: string): string {
  // Expect DDD + number e.g. 16999999999 (11 digits)
  return onlyDigits(value).slice(0, 11);
}

export function maskPhone(value: string): string {
  const d = normalizePhoneBR(value);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function isValidPhoneBR(value: string): boolean {
  const d = normalizePhoneBR(value);
  // Accept 10 (landline) or 11 (mobile) digits, but default expected is 11
  return d.length === 11;
}

export function isValidEmail(value: string): boolean {
  const v = String(value || "").trim();
  if (!v) return false;
  // Pragmatic email validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

