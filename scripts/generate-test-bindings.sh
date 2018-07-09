#!/usr/bin/env bash

CONJURE_TYPESCRIPT=bin/conjure-typescript
TEST_DIR=src/__integTest__/__generated__

# Clear directory before regenerating
if [ -e "$TEST_DIR/index.ts" ]; then
    rm -rf "$TEST_DIR/conjure-compliance" "$TEST_DIR/index.ts"
fi

$CONJURE_TYPESCRIPT generate resources/api.json "$TEST_DIR" --packageName generated --packageVersion 0.0.0

# Clean up package cruft
rm ${TEST_DIR}/*.json "$TEST_DIR/.npmignore"
