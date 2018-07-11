#!/usr/bin/env bash

set -euo pipefail

VERSION=0.0.6
TEST_CASES="test-cases"
API="verification-api"
SERVER="verification-server"

DOWNLOADS_DIR=build/downloads
RESOURCES_DIR=build/resources

mkdir -p "$DOWNLOADS_DIR"/bin
mkdir -p "$RESOURCES_DIR"

function download() {
  basename=$(basename "$1")
  target="$DOWNLOADS_DIR"/"$basename"
  if [[ ! -f "$target" ]]; then
    curl -L "$1" -o "$target.tmp" && mv "$target.tmp" "$target"
  fi
  echo "$target"
}

DOWNLOAD_OUTPUT="$RESOURCES_DIR/${API}.conjure.json"
ARTIFACT_NAME="${API}-${VERSION}.conjure.json"
out=$(download "https://palantir.bintray.com/releases/com/palantir/conjure/verification/${API}/${VERSION}/${ARTIFACT_NAME}")
cp -f "$out" "$DOWNLOAD_OUTPUT"

DOWNLOAD_OUTPUT="$RESOURCES_DIR/${TEST_CASES}.json"
ARTIFACT_NAME="${TEST_CASES}-${VERSION}.json"
out=$(download "https://palantir.bintray.com/releases/com/palantir/conjure/verification/${TEST_CASES}/${VERSION}/${ARTIFACT_NAME}")
cp -f "$out" "$DOWNLOAD_OUTPUT"


case $(uname -s) in
    Linux*) TARGET=linux-x86_64-unknown-linux-gnu ;;
    Darwin*) TARGET=x86_64-apple-darwin ;;
    *) echo "Unsupported OS" >&2; exit 1;;
esac

ARTIFACT_NAME="${SERVER}-${VERSION}.tgz"
out=$(download "https://palantir.bintray.com/releases/com/palantir/conjure/verification/${SERVER}/${VERSION}/${ARTIFACT_NAME}")
tar xf "$out" -C "$DOWNLOADS_DIR" "bin/$TARGET/verification-server"
cp -f "$DOWNLOADS_DIR/bin/$TARGET/verification-server" "$DOWNLOADS_DIR/bin/verification-server"

chmod +x "$DOWNLOADS_DIR/bin/verification-server"
