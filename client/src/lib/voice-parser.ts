export interface ParsedTrip {
  amount?: number;
  wait?: number;
  type?: 'CC' | 'Particular';
  origin?: string;
  destination?: string;
}

export interface ParsedExpense {
  amount?: number;
  type?: 'Nafta' | 'Gas' | 'Otro';
  note?: string;
}

function normalizeText(text: string): string {
  return text.toLowerCase()
    .replace(/á/g, 'a')
    .replace(/é/g, 'e')
    .replace(/í/g, 'i')
    .replace(/ó/g, 'o')
    .replace(/ú/g, 'u')
    .replace(/ñ/g, 'n')
    .trim();
}

function extractAmount(text: string, excludeWaitPart: boolean = false): number | undefined {
  let normalized = normalizeText(text);
  
  if (excludeWaitPart) {
    normalized = normalized
      .replace(/(?:con\s+)?espera\s+(?:de\s+)?(\d+[\.,]?\d*)\s*(?:pesos?)?/gi, '')
      .replace(/(\d+[\.,]?\d*)\s*(?:pesos?\s+)?(?:de\s+)?espera/gi, '')
      .trim();
  }
  
  const decimalPatterns = [
    /(\d+)\s+(?:con|punto|coma)\s+(\d+)\s*(?:pesos?|centavos?)?/i,
    /(\d+)[\.,](\d+)\s*(?:pesos?)?/i,
  ];
  
  for (const pattern of decimalPatterns) {
    const match = normalized.match(pattern);
    if (match) {
      const intPart = parseInt(match[1]);
      let decPart = match[2];
      if (decPart.length === 1) decPart = decPart + '0';
      if (decPart.length > 2) decPart = decPart.substring(0, 2);
      const num = intPart + parseInt(decPart) / 100;
      if (!isNaN(num) && num > 0) {
        return Math.round(num * 100) / 100;
      }
    }
  }
  
  const patterns = [
    /(\d+)\s*(?:pesos?|pe(?:\s|$))/i,
    /(?:monto|importe|valor|viaje\s+(?:de|por))\s+(\d+)/i,
    /^(\d+)\s/,
    /(\d+)/,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      const num = parseInt(match[1]);
      if (!isNaN(num) && num > 0) {
        return num;
      }
    }
  }

  const wordNumbers: Record<string, number> = {
    'mil': 1000,
    'dos mil': 2000,
    'tres mil': 3000,
    'cuatro mil': 4000,
    'cinco mil': 5000,
    'diez mil': 10000,
    'cien': 100,
    'doscientos': 200,
    'trescientos': 300,
    'cuatrocientos': 400,
    'quinientos': 500,
  };

  for (const [word, value] of Object.entries(wordNumbers)) {
    if (normalized.includes(word)) {
      return value;
    }
  }

  return undefined;
}

function extractTripType(text: string): 'CC' | 'Particular' | undefined {
  const normalized = normalizeText(text);
  
  const ccKeywords = ['cuenta corriente', 'cta corriente', 'cta cte', 'cc', 'cuenta', 'corporativo', 'empresa', 'compania'];
  const particularKeywords = ['particular', 'privado', 'personal', 'calle'];

  for (const keyword of ccKeywords) {
    if (normalized.includes(keyword)) {
      return 'CC';
    }
  }

  for (const keyword of particularKeywords) {
    if (normalized.includes(keyword)) {
      return 'Particular';
    }
  }

  return undefined;
}

function extractOriginDestination(text: string): { origin?: string; destination?: string } {
  const normalized = text.toLowerCase();
  
  const patterns = [
    /desde\s+(.+?)\s+(?:hasta|a)\s+(.+?)(?:\s+(?:por|monto|$)|\.|,|$)/i,
    /de\s+(.+?)\s+(?:hasta|a)\s+(.+?)(?:\s+(?:por|monto|$)|\.|,|$)/i,
    /(?:origen|salida)\s+(.+?)\s+(?:destino|llegada)\s+(.+?)(?:\s|$)/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      return {
        origin: match[1].trim(),
        destination: match[2].trim(),
      };
    }
  }

  const hastaMatch = normalized.match(/hasta\s+(.+?)(?:\s+(?:por|monto|$)|\.|,|$)/i);
  if (hastaMatch) {
    return { destination: hastaMatch[1].trim() };
  }

  return {};
}

function extractExpenseType(text: string): 'Nafta' | 'Gas' | 'Otro' | undefined {
  const normalized = normalizeText(text);
  
  const naftaKeywords = ['nafta', 'combustible', 'gasolina', 'super', 'premium', 'cargar nafta'];
  const gasKeywords = ['gas', 'gnc', 'gnv', 'gas natural'];
  const otroKeywords = ['otro', 'otros', 'varios', 'peaje', 'estacionamiento', 'lavado'];

  for (const keyword of gasKeywords) {
    if (normalized.includes(keyword)) {
      return 'Gas';
    }
  }

  for (const keyword of naftaKeywords) {
    if (normalized.includes(keyword)) {
      return 'Nafta';
    }
  }

  for (const keyword of otroKeywords) {
    if (normalized.includes(keyword)) {
      return 'Otro';
    }
  }

  return undefined;
}

function extractWait(text: string): number | undefined {
  const normalized = normalizeText(text);
  
  const waitPatterns = [
    /espera\s+(?:de\s+)?(\d+[\.,]?\d*)/i,
    /(\d+[\.,]?\d*)\s+(?:de\s+)?espera/i,
  ];

  for (const pattern of waitPatterns) {
    const match = normalized.match(pattern);
    if (match) {
      const value = match[1].replace(',', '.');
      const num = parseFloat(value);
      if (!isNaN(num) && num > 0) {
        return num;
      }
    }
  }

  return undefined;
}

export function parseTripVoiceCommand(text: string): ParsedTrip {
  const wait = extractWait(text);
  const amount = extractAmount(text, true);
  const type = extractTripType(text);
  const { origin, destination } = extractOriginDestination(text);

  return {
    amount,
    wait,
    type,
    origin,
    destination,
  };
}

export function parseExpenseVoiceCommand(text: string): ParsedExpense {
  const amount = extractAmount(text);
  const type = extractExpenseType(text);

  return {
    amount,
    type,
  };
}

export function isLikelyTrip(text: string): boolean {
  const normalized = normalizeText(text);
  const tripKeywords = ['viaje', 'carrera', 'particular', 'cuenta corriente', 'cc', 'desde', 'hasta', 'origen', 'destino', 'pasajero'];
  return tripKeywords.some(k => normalized.includes(k));
}

export function isLikelyExpense(text: string): boolean {
  const normalized = normalizeText(text);
  const expenseKeywords = ['gasto', 'nafta', 'gas', 'gnc', 'combustible', 'cargar', 'peaje', 'estacionamiento'];
  return expenseKeywords.some(k => normalized.includes(k));
}
