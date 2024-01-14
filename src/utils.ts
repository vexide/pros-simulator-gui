export function pairs<T>(iter: Iterable<T>): [T, T][] {
    const result: [T, T][] = [];
    const empty = Symbol();
    let last: T | typeof empty = empty;
    for (const item of iter) {
        if (last !== empty) {
            result.push([last, item]);
            last = empty;
        } else {
            last = item;
        }
    }
    return result;
}
