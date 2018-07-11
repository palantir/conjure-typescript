#!/usr/bin/env bash

set -euo pipefail

VERSION=0.0.6
TEST_CASES="test-cases"
API="verification-api"
SERVER="verification-server"

mkdir -p downloads
mkdir -p resources

function download() {
  basename=$(basename "$1")
  target=downloads/$basename
  if [[ ! -f "$target" ]]; then
    curl -L "$1" -o "$target.tmp" && mv "$target.tmp" "$target"
  fi
  echo "$target"
}

DOWNLOAD_OUTPUT="resources/${API}.conjure.json"
ARTIFACT_NAME="${API}-${VERSION}.conjure.json"
out=$(download "https://palantir.bintray.com/releases/com/palantir/conjure/verification/${API}/${VERSION}/${ARTIFACT_NAME}")
cp -f "$out" "$DOWNLOAD_OUTPUT"

DOWNLOAD_OUTPUT="resources/${TEST_CASES}.json"
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
tar xf "$out" -C downloads/ bin/$TARGET/verification-server
mv -f downloads/bin/$TARGET/verification-server downloads/verification-server

chmod +x downloads/verification-server
