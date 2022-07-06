export declare const DEFAULT_LOG_BASE_VALUE = 10;
export declare const DEFAULT_D_VALUE = 400;
export declare const DEFAULT_K_VALUE = 32;
export declare const DEFAULT_S_VALUE = 1;
export declare type MultiEloConfig = {
    logBase?: number;
    d?: number;
    k?: number;
    s?: number;
    verbose?: boolean;
};
export declare class MultiElo {
    private static instance;
    private scoreFunction;
    private console;
    private config;
    constructor(config?: MultiEloConfig);
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
    getNewRatings(initialRatings: number[], resultOrder?: number[]): number[];
    /**
     * Return the score to be awarded to the players based on the results.
     *
     * @param n number of players in the matchup
     * @param resultOrder list indicating order of finish. See getNewRatings docstring for more info
     * @return array of length n of scores to be assigned to firstplace, second place, and so on
     */
    private getActualScores;
    /**
     * Helper function for getActualScores. Runs multiple checks to validate the plausiblity of the new scores
     *
     * @param scores list of all player scores
     * @param resultOrder list indicating order of finish. See getNewRatings docstring for more info
     */
    private validateActualScores;
    /**
     * Get the expected scores for all players given their ratings before the matchup.
     *
     * @param initialRatings array of ratings for each player in a matchup
     * @returns array of expected scores for all players
     */
    getExpectedScores(ratings: number[]): number[];
    static getNewRatings(oldRatings: number[], resultOrder?: number[]): number[];
    static getExpectedScores(ratings: number[]): number[];
    private static getInstance;
}
export declare function getNewRatings(oldRatings: number[], resultOrder?: number[]): number[];
export declare function getExpectedScores(ratings: number[]): number[];
