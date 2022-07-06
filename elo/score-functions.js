"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExponentialScoreFuntion = exports.sumReducer = void 0;
var utils_1 = require("./utils");
var sumReducer = function (previousValue, currentValue) { return previousValue + currentValue; };
exports.sumReducer = sumReducer;
/**
 * With the linear score function the "points" awarded scale linearly from first place
 * through last place. For example, improving from 2nd to 1st place has the same sized
 * benefit as improving from 5th to 4th place.
 *
 * @param n number of players
 * @returns array of the points to assign to each place (summing to 1)
 */
var linearScoreFunction = function (n) {
    return (0, utils_1.range)(n, 1).map(function (p) { return (n - p) / ((n * (n - 1)) / 2); });
};
/**
 * With an exponential score function with base > 1, more points are awarded to the top
 * finishers and the point distribution is flatter at the bottom. For example, improving
 * from 2nd to 1st place is more valuable than improving from 5th place to 4th place. A
 * larger base value means the scores will be more weighted towards the top finishers.
 *
 * @param n number of players
 * @param base base for the exponential score function (> 1)
 * @returns array of the points to assign to each place (summing to 1)
 */
var exponentialScoreFunction = function (n, base) {
    if (base < 1)
        throw new Error("Base must be >= 1");
    var out = (0, utils_1.range)(n, 1).map(function (p) { return Math.pow(base, n - p) - 1; });
    var sum = out.reduce(exports.sumReducer);
    return out.map(function (p) { return p / sum; });
};
function createExponentialScoreFuntion(base) {
    return base !== 1 ? function (n) { return exponentialScoreFunction(n, base); } : linearScoreFunction;
}
exports.createExponentialScoreFuntion = createExponentialScoreFuntion;
