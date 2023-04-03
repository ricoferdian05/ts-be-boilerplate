/**
 * Escapes any characters that would have special meaning in a regular expression.
 */
export function escapeRegex(regexString: string): string {
  return regexString.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

/**
 * Format phone number to firebase format, the default is indonesia +62.
 *
 * - Adding +62 in prefix when the first character is 0.
 *
 * - Adding + in prefix when the first character is not 0.
 *
 * @param phone a string phone number
 * @returns string
 * @example
 *
 * const firebasePhoneNumberFormat = phoneNumberFirebaseFormat("0812345");
 * // "+62812345"
 *
 * * const firebasePhoneNumberFormat = phoneNumberFirebaseFormat("61812345");
 * // "+61812345"
 *
 */
export function phoneNumberFirebaseFormat(phone: string): string {
  if (phone.charAt(0) === '0') return phone.replace('0', '+62');

  return `+${phone}`;
}
