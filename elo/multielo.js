"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
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
exports.getExpectedScores = exports.getNewRatings = exports.MultiElo = exports.DEFAULT_S_VALUE = exports.DEFAULT_K_VALUE = exports.DEFAULT_D_VALUE = exports.DEFAULT_LOG_BASE_VALUE = void 0;
var score_functions_1 = require("./score-functions");
var utils_1 = require("./utils");
exports.DEFAULT_LOG_BASE_VALUE = 10;
exports.DEFAULT_D_VALUE = 400;
exports.DEFAULT_K_VALUE = 32;
exports.DEFAULT_S_VALUE = 1;
var MultiElo = /** @class */ (function () {
    function MultiElo(config) {
        if (config === void 0) { config = {}; }
        this.config = {
            logBase: exports.DEFAULT_LOG_BASE_VALUE,
            d: exports.DEFAULT_D_VALUE,
            k: exports.DEFAULT_K_VALUE,
            s: exports.DEFAULT_S_VALUE,
            verbose: false,
        };
        Object.assign(this.config, config);
        this.scoreFunction = (0, score_functions_1.createExponentialScoreFuntion)(this.config.s);
        this.console = this.config.verbose ? console : { log: function () { return null; } };
    }
    /**
     * Update ratings based on results. Takes an array of ratings before the matchup and returns an array with
     * the updated ratings. Provided array should be ordered by the actual results (first place finisher's
     * initial rating first, second place next, and so on).
     *
     * Example usage:
     * >>> elo.getNewRatings([1200, 1000])
     * [1207.68809835,  992.31190165]
     * >>> elo.getNewRatings([1200, 1000, 1100, 900])
     * [1212.01868209, 1012.15595083, 1087.84404917,  887.98131791]
     *
     * @param initialRatings array of ratings (float values) in order of actual results
     * @param resultOrder array where each value indicates the place the player in the same index of
     *                    initialRatings finished in. Lower is better. Identify ties by entering the same value for players
     *                    that tied. For example, [1, 2, 3] indicates that the first listed player won, the second listed player
     *                    finished 2nd, and the third listed player finished 3rd. [1, 2, 2] would indicate that the second
     *                    and third players tied for 2nd place. Defaults to [1,2,3...]
     * @returns array of updated ratings in same order as input
     */
    MultiElo.prototype.getNewRatings = function (initialRatings, resultOrder) {
        var n = initialRatings.length;
        resultOrder = resultOrder || (0, utils_1.range)(n, 0);
        var actualScores = this.getActualScores(n, resultOrder);
        var expectedScores = this.getExpectedScores(initialRatings);
        var scaleFactor = this.config.k * (n - 1);
        this.console.log("scaleFactor: " + scaleFactor);
        return initialRatings.map(function (m, i) { return m + scaleFactor * (actualScores[i] - expectedScores[i]); });
    };
    /**
     * Return the score to be awarded to the players based on the results.
     *
     * @param n number of players in the matchup
     * @param resultOrder list indicating order of finish. See getNewRatings docstring for more info
     * @return array of length n of scores to be assigned to firstplace, second place, and so on
     */
    MultiElo.prototype.getActualScores = function (n, resultOrder) {
        var e_1, _a;
        // calculate actual scores according to score function, then sort in order of finish
        resultOrder = resultOrder || (0, utils_1.range)(n, 0);
        var scores = this.scoreFunction(n);
        scores = (0, utils_1.argsort)((0, utils_1.argsort)(resultOrder)).map(function (i) { return scores[i]; });
        // if there are ties, average the scores of all tied players
        var distinctResults = new Set(resultOrder);
        if (distinctResults.size !== n) {
            var _loop_1 = function (place) {
                var idx = resultOrder.reduce(function (accumulator, value, index) {
                    if (value === +place)
                        accumulator.push(index);
                    return accumulator;
                }, []);
                var mean = idx.map(function (i) { return scores[i]; }).reduce(score_functions_1.sumReducer) / idx.length;
                idx.forEach(function (i) { return (scores[i] = mean); });
            };
            try {
                for (var distinctResults_1 = __values(distinctResults), distinctResults_1_1 = distinctResults_1.next(); !distinctResults_1_1.done; distinctResults_1_1 = distinctResults_1.next()) {
                    var place = distinctResults_1_1.value;
                    _loop_1(place);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (distinctResults_1_1 && !distinctResults_1_1.done && (_a = distinctResults_1.return)) _a.call(distinctResults_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
        this.console.log("resultOrder:", resultOrder);
        this.console.log("Calculated actual scores:", scores);
        this.validateActualScores(scores, resultOrder);
        return scores;
    };
    /**
     * Helper function for getActualScores. Runs multiple checks to validate the plausiblity of the new scores
     *
     * @param scores list of all player scores
     * @param resultOrder list indicating order of finish. See getNewRatings docstring for more info
     */
    MultiElo.prototype.validateActualScores = function (scores, resultOrder) {
        var scoreSum = scores.reduce(score_functions_1.sumReducer);
        if (!(0, utils_1.close)(1, scoreSum)) {
            throw new Error("Scoring function does not return scores summing to 1");
        }
        if (Math.min.apply(Math, __spreadArray([], __read(scores), false)) !== 0) {
            // tie for last place means minimum score doesn't have to be zero,
            // so only raise error if there isn't a tie for last
            var lastPlace_1 = Math.max.apply(Math, __spreadArray([], __read(resultOrder), false));
            if (resultOrder.filter(function (f) { return f === lastPlace_1; }).length === 1) {
                throw new Error("Scoring function does not return minimum value of 0");
            }
        }
        // TODO: implement check to make sure scores are monotonically decreasing
    };
    /**
     * Get the expected scores for all players given their ratings before the matchup.
     *
     * @param initialRatings array of ratings for each player in a matchup
     * @returns array of expected scores for all players
     */
    MultiElo.prototype.getExpectedScores = function (ratings) {
        var _this = this;
        this.console.log("Calculating expected scores for: ", ratings);
        // get all pairwise differences
        var diffMx = ratings.map(function (m) { return ratings.map(function (mn) { return mn - m; }); });
        this.console.log("DiffMx: ", diffMx);
        // get individual contributions to expected score using logistic function
        var logisticMx = diffMx.map(function (m, i) {
            return m.map(function (mn, j) { return (i === j ? 0 : 1 / (1 + Math.pow(_this.config.logBase, mn / _this.config.d))); });
        });
        this.console.log("LogisticMx: ", logisticMx);
        var n = ratings.length;
        // number of individual head-to-head matchups between n players
        var denom = (n * (n - 1)) / 2;
        var expectedScores = logisticMx.map(function (m) { return m.reduce(score_functions_1.sumReducer) / denom; });
        // this should be guaranteed, but check to make sure
        if (!(0, utils_1.close)(1, expectedScores.reduce(score_functions_1.sumReducer))) {
            throw new Error("Expected Scores do not sum to 1");
        }
        this.console.log("Calculated expected scores: ", expectedScores);
        return expectedScores;
    };
    MultiElo.getNewRatings = function (oldRatings, resultOrder) {
        return this.getInstance().getNewRatings(oldRatings, resultOrder);
    };
    MultiElo.getExpectedScores = function (ratings) {
        return this.getInstance().getExpectedScores(ratings);
    };
    MultiElo.getInstance = function () {
        if (!this.instance)
            this.instance = new MultiElo();
        return this.instance;
    };
    MultiElo.instance = null;
    return MultiElo;
}());
exports.MultiElo = MultiElo;
function getNewRatings(oldRatings, resultOrder) {
    return MultiElo.getNewRatings(oldRatings, resultOrder);
}
exports.getNewRatings = getNewRatings;
function getExpectedScores(ratings) {
    return MultiElo.getExpectedScores(ratings);
}
exports.getExpectedScores = getExpectedScores;
