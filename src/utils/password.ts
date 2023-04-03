import { hash, compare } from 'bcrypt';

/**
 * Hashes password using bcrypt
 */
async function hashPassword(plainPassword: string, salt = 10): Promise<string> {
  return hash(plainPassword, salt);
}

/**
 * Checks if (plain) password matches with a hashed password
 */
async function isMatchingPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return compare(plainPassword, hashedPassword);
}

export { hashPassword, isMatchingPassword };
