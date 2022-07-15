export interface IListExample {
    'items': ReadonlyArray<string>;
    'primitiveItems': ReadonlyArray<number>;
    'doubleItems': ReadonlyArray<number | "NaN">;
}
