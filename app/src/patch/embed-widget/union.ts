type PosRange = [start: number, end: number];

const isRangeOverlap = (a: PosRange, b: PosRange) =>
  isWithinRange(a, b[0]) || isWithinRange(a, b[1]);
const isWithinRange = (r: PosRange, pos: number) => r[0] < pos && r[1] > pos;

const mergeRanges = (a: PosRange, b: PosRange) => {
  const start = isWithinRange(a, b[0]) ? a[0] : b[0],
    end = isWithinRange(a, b[1]) ? a[1] : b[1];
  return [start, end] as PosRange;
};

export default function careateRangeUnion(ranges: PosRange[]) {
  return ranges
    .sort((a, b) => a[0] - b[0])
    .reduce((arr, range) => {
      const index = arr.findIndex((rangeToCheck) =>
        isRangeOverlap(rangeToCheck, range),
      );
      if (index !== -1) {
        arr[index] = mergeRanges(arr[index], range);
      } else {
        arr.push(range);
      }
      return arr;
    }, [] as PosRange[]);
}
