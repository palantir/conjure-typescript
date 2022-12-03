import { AliasGenerationType, ITypeGenerationFlags } from "../../typeGenerationFlags";

export const DEFAULT_TYPE_GENERATION_FLAGS: ITypeGenerationFlags = { aliases: AliasGenerationType.DEFAULT, readonlyInterfaces: false };

export const BRANDED_TYPE_GENERATION_FLAGS: ITypeGenerationFlags = { ...DEFAULT_TYPE_GENERATION_FLAGS, aliases: AliasGenerationType.BRANDED };

export const FLAVORED_TYPE_GENERATION_FLAGS: ITypeGenerationFlags = { ...DEFAULT_TYPE_GENERATION_FLAGS, aliases: AliasGenerationType.FLAVORED };

export const READONLY_TYPE_GENERATION_FLAGS: ITypeGenerationFlags = { ...DEFAULT_TYPE_GENERATION_FLAGS, readonlyInterfaces: true };
