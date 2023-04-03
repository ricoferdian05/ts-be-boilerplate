/**
 * @returns current time in Unix epoch timestamp format (seconds)
 */
function getCurrentUnixTimestamp(): number {
  return Math.ceil(new Date().getTime() / 1000);
}

export { getCurrentUnixTimestamp };
