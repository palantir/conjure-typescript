export type PrimitiveType = "STRING" | "DATETIME" | "INTEGER" | "DOUBLE" | "SAFELONG" | "BINARY" | "ANY" | "BOOLEAN" | "UUID" | "RID" | "BEARERTOKEN";

export const PrimitiveType = {
    STRING: "STRING" as "STRING",
    DATETIME: "DATETIME" as "DATETIME",
    INTEGER: "INTEGER" as "INTEGER",
    DOUBLE: "DOUBLE" as "DOUBLE",
    SAFELONG: "SAFELONG" as "SAFELONG",
    BINARY: "BINARY" as "BINARY",
    ANY: "ANY" as "ANY",
    BOOLEAN: "BOOLEAN" as "BOOLEAN",
    UUID: "UUID" as "UUID",
    RID: "RID" as "RID",
    BEARERTOKEN: "BEARERTOKEN" as "BEARERTOKEN"
};
