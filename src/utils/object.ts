/**
 * Checks if a given object is an literal object
 * @example
 * // returns true
 * isLiteralObject({}));
 * @example
 * // returns false
 * isLiteralObject(undefined));
 * isLiteralObject(null));
 * isLiteralObject(true));
 * isLiteralObject(1));
 * isLiteralObject('str'));
 * isLiteralObject([]));
 * isLiteralObject(new Date));
 */
function isLiteralObject(object: Record<any, any>): boolean {
  return !!object && object.constructor === Object;
}

/**
 * Checks if a literal object is has any value
 */
function isObjectFilled(object: Record<any, any>): boolean {
  return (
    isLiteralObject(object) &&
    Object.keys(object).length > 0 &&
    Object.values(object).some((value) => typeof value !== 'undefined')
  );
}

/**
 * Creates a new literal object from a given literal object without keys with undefined value, including nested object value.
 * @param object target object
 * @returns new object without undefined value
 */
function removeUndefinedFromObject(object: Record<any, any>): Record<any, any> {
  if (object === null) return null;

  const newObject = {};
  Object.keys(object).forEach((key) => {
    if (isLiteralObject(object[key])) newObject[key] = removeUndefinedFromObject(object[key]);
    else if (typeof object[key] !== 'undefined') newObject[key] = object[key];
  });
  return newObject;
}

/**
 * This function converting Enum to an array of enum.
 * In typescript Enums are real objects that exist at runtime.
 * @param param is an Enum
 * @returns Array of enum
 */
const convertEnumToArray = <T>(param: object): T[] => {
  return Object.values(param) as T[];
};

export { isLiteralObject, isObjectFilled, removeUndefinedFromObject, convertEnumToArray };
