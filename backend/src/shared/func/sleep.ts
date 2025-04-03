/**
 * Resolves is a specified number of milliseconds.
 * @param ms Milliseconds to wait
 */
export const sleep = (ms: number): Promise<void> => new Promise((res) => setTimeout(res, ms));
