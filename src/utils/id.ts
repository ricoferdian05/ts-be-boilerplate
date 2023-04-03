import { Types } from 'mongoose';

/**
 * Generates an id with a prefix and padded number
 * @example ADM0001
 */
function formatId(prefix: string, number: number, minimumNumberLength: number = 4): string {
  return `${prefix}${String(number).padStart(minimumNumberLength, '0')}`;
}
/**
 * Generate worker's formattedId based on largest formatted id of a driver
 * @example IDN0001-WKR000001
 */
/**
 * Function that determine object id is valid or not
 * @param id ${string}
 * @returns boolean
 */
const isValidObjectId = (id: string): boolean => {
  return Types.ObjectId.isValid(id) && String(new Types.ObjectId(id)) === id;
};

export {
  isValidObjectId,
  formatId,
}
