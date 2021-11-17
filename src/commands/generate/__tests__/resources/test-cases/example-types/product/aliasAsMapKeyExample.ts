import { IManyFieldExample } from "./manyFieldExample";
import { IRidAliasExample } from "./ridAliasExample";
import { IStringAliasExample } from "./stringAliasExample";

export interface IAliasAsMapKeyExample {
    'strings': { [key: IStringAliasExample]: IManyFieldExample };
    'rids': { [key: IRidAliasExample]: IManyFieldExample };
    'bearertokens': { [key: string]: IManyFieldExample };
    'integers': { [key: string]: IManyFieldExample };
    'safelongs': { [key: string]: IManyFieldExample };
    'datetimes': { [key: string]: IManyFieldExample };
    'uuids': { [key: string]: IManyFieldExample };
}
