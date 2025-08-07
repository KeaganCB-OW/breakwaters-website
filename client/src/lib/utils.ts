type ClassValue =
  | string
  | number
  | null
  | undefined
  | ClassValue[]
  | { [key: string]: any };

function parseClassValue(value: ClassValue, tokens: string[]): void {
  if (!value) return;
  if (typeof value === "string" || typeof value === "number") {
    const parts = String(value).trim().split(/\s+/);
    tokens.push(...parts);
  } else if (Array.isArray(value)) {
    value.forEach((v) => parseClassValue(v, tokens));
  } else if (typeof value === "object") {
    Object.entries(value).forEach(([key, v]) => {
      if (v) tokens.push(key);
    });
  }
}

export function cn(...inputs: ClassValue[]): string {
  const tokens: string[] = [];
  inputs.forEach((input) => parseClassValue(input, tokens));

  const prefixMap: Record<string, { index: number; token: string }> = {};
  tokens.forEach((token, index) => {
    const prefix = token.split("-")[0];
    prefixMap[prefix] = { index, token };
  });

  return Object.values(prefixMap)
    .sort((a, b) => a.index - b.index)
    .map((item) => item.token)
    .join(" ");
}

