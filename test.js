 function range(size, startAt) {
  const r = [...Array(size).keys()];
  if (startAt) return r.map((i) => i + startAt);
  return r;
}

const sumReducer = (previousValue, currentValue) => previousValue + currentValue;
const decor = (v, i) => [v, i];
const undecor = (a) => a[1];
const argsort = (arr) => arr.map(decor).sort().map(undecor);


const exponentialScoreFunction = (n, base) => {
  if (base < 1) throw new Error("Base must be >= 1");

  const out = range(n, 1).map((p) => Math.pow(base, n - p) - 1);
  const sum = out.reduce(sumReducer);

  return out.map((p) => p / sum);
};

let scores = exponentialScoreFunction(12, 1.35);
console.log(scores)
scores = argsort(argsort(range(12, 0))).map((i) => scores[i]);
console.log(scores)
