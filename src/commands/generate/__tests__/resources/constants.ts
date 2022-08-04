import { ITypeGenerationFlags } from "../../typeGenerationFlags";

export const DEFAULT_TYPE_GENERATION_FLAGS: ITypeGenerationFlags = { flavorizedAliases: false, readonlyCollections: false, readonlyInterfaces: false };

export const FLAVORED_TYPE_GENERATION_FLAGS: ITypeGenerationFlags = { ...DEFAULT_TYPE_GENERATION_FLAGS, flavorizedAliases: true };

export const READONLY_TYPE_GENERATION_FLAGS: ITypeGenerationFlags = { ...DEFAULT_TYPE_GENERATION_FLAGS, readonlyCollections: true, readonlyInterfaces: true };
