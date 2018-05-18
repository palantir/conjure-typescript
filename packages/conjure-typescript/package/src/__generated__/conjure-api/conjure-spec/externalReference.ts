import * as IType from "./type";
import { ITypeName } from "./typeName";

export interface IExternalReference {
    /**
     * An identifier for a non-Conjure type which is already defined in a different language (e.g. Java).
     */
    'externalReference': ITypeName;
    /**
     * Other language generators may use the provided fallback if the non-Conjure type is not available. The ANY PrimitiveType is permissible for all external types, but a more specific definition is preferrable.
     * 
     */
    'fallback': IType.IType;
}
