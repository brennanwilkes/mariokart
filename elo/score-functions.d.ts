export declare const sumReducer: (previousValue: number, currentValue: number) => number;
export declare type ScoreFunction = (n: number) => number[];
export declare function createExponentialScoreFuntion(base: number): ScoreFunction;
