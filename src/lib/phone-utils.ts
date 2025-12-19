
/**
 * Normalizes a phone string by removing non-digit characters.
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Generates valid variations of a Brazilian phone number
 * (with/without Country Code 55, with/without 9th digit)
 */
export function generatePhoneVariations(phone: string): string[] {
  const cleanPhone = normalizePhone(phone);
  const variations = new Set<string>();
  
  if (!cleanPhone) return [];

  variations.add(cleanPhone);

  // 1. Handle Country Code (55 for Brazil) aggressively
  // We don't check for specific lengths strictly to allow matching unusual formats
  if (cleanPhone.startsWith('55')) {
      variations.add(cleanPhone.slice(2));
  } else {
      variations.add('55' + cleanPhone);
  }

  // Helper to add 9th digit variations
  const add9thDigitVars = (p: string) => {
      // With DDI 55
      if (p.startsWith('55')) {
          // Expected formats with 55:
          // 13 digits: 55 + DDD + 9 + 8 digits -> Remove 9
          // 12 digits: 55 + DDD + 8 digits -> Add 9
          if (p.length === 13) {
              variations.add(p.slice(0, 4) + p.slice(5));
          } else if (p.length === 12) {
              variations.add(p.slice(0, 4) + '9' + p.slice(4));
          }
      } 
      // Without DDI 55
      else {
          // Expected formats without 55:
          // 11 digits: DDD + 9 + 8 digits -> Remove 9
          // 10 digits: DDD + 8 digits -> Add 9
          if (p.length === 11) {
              variations.add(p.slice(0, 2) + p.slice(3));
          } else if (p.length === 10) {
              variations.add(p.slice(0, 2) + '9' + p.slice(2));
          }
      }
  };

  // Apply 9th digit logic to existing variations (snapshot to avoid infinite loop)
  Array.from(variations).forEach(add9thDigitVars);

  return Array.from(variations);
}

/**
 * Checks if a stored phone matches a search term considering variations
 */
export function phoneMatches(storedPhone: string | null | undefined, searchTerm: string): boolean {
  if (!storedPhone) return false;
  if (!searchTerm) return false;

  const cleanSearch = normalizePhone(searchTerm);
  if (!cleanSearch) return false;

  const variations = generatePhoneVariations(storedPhone);
  
  return variations.some(v => v.includes(cleanSearch) || cleanSearch.includes(v));
}
