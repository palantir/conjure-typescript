import { IManyFieldExample } from "./manyFieldExample";

export interface IAliasAsMapKeyExample {
    'strings': { readonly [key: string]: IManyFieldExample };
    'rids': { readonly [key: string]: IManyFieldExample };
    'bearertokens': { readonly [key: string]: IManyFieldExample };
    'integers': { readonly [key: string]: IManyFieldExample };
    'safelongs': { readonly [key: string]: IManyFieldExample };
    'datetimes': { readonly [key: string]: IManyFieldExample };
    'uuids': { readonly [key: string]: IManyFieldExample };
}
