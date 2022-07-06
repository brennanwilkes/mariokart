"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.allClose = exports.close = exports.range = exports.argsort = void 0;
/** set index to value */
var decor = function (v, i) { return [v, i]; };
/** leave only index */
var undecor = function (a) { return a[1]; };
var argsort = function (arr) { return arr.map(decor).sort().map(undecor); };
exports.argsort = argsort;
/**
 * Returns an array of size 'size' filled with ascending numbers from starting with 'startAt'
 *
 * @param size the size of the generated array
 * @param startAt the starting index
 * @returns array filled with ascending numbers
 */
function range(size, startAt) {
    if (startAt === void 0) { startAt = 0; }
    var r = __spreadArray([], __read(Array(size).keys()), false);
    if (startAt)
        return r.map(function (i) { return i + startAt; });
    return r;
}
exports.range = range;
/**
 * Checks if the absolute diff between a and b is smaller than maxDiff
 *
 * @param a first value
 * @param b second value
 * @param maxDiff maximum Difference (inclusive). Defaults to 1e-5
 */
function close(a, b, maxDiff) {
    if (maxDiff === void 0) { maxDiff = 1e-5; }
    return Math.abs(a - b) <= maxDiff;
}
exports.close = close;
/**
 * Checks if every value in array a is close to the value in array b
 *
 * @param a first array
 * @param b second array
 * @param maxDiff maximum Difference. Defaults to 1e-5
 */
function allClose(a, b, maxDiff) {
    if (maxDiff === void 0) { maxDiff = 1e-5; }
    if (a.length !== b.length)
        throw new Error("a and b must have the same length");
    for (var index = 0; index < a.length; index++) {
        if (!close(a[index], b[index], maxDiff))
            return false;
    }
    return true;
}
exports.allClose = allClose;
