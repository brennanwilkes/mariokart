export declare const argsort: (arr: number[]) => number[];
/**
 * Returns an array of size 'size' filled with ascending numbers from starting with 'startAt'
 *
 * @param size the size of the generated array
 * @param startAt the starting index
 * @returns array filled with ascending numbers
 */
export declare function range(size: number, startAt?: number): number[];
/**
 * Checks if the absolute diff between a and b is smaller than maxDiff
 *
 * @param a first value
 * @param b second value
 * @param maxDiff maximum Difference (inclusive). Defaults to 1e-5
 */
export declare function close(a: number, b: number, maxDiff?: number): boolean;
/**
 * Checks if every value in array a is close to the value in array b
 *
 * @param a first array
 * @param b second array
 * @param maxDiff maximum Difference. Defaults to 1e-5
 */
export declare function allClose(a: number[], b: number[], maxDiff?: number): boolean;
