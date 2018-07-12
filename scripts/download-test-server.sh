#!/usr/bin/env bash

set -euo pipefail

VERSION=0.1.1
TEST_CASES="test-cases"
API="verification-api"
SERVER="verification-server"

DOWNLOADS_DIR=build/downloads
RESOURCES_DIR=build/resources

mkdir -p "$DOWNLOADS_DIR"/bin
mkdir -p "$RESOURCES_DIR"

function download() {
  url="$1"
  target="$2"
  echo "downloading $url -> $target" >/dev/stderr

  if [[ ! -f "$target" ]]; then
    rm -f "$target"
    curl -sS -L "$url" -o "$target.tmp" && mv "$target.tmp" "$target"
  fi
}

DOWNLOAD_OUTPUT="$RESOURCES_DIR/${API}.conjure.json"
ARTIFACT_NAME="${API}-${VERSION}.conjure.json"
download "https://palantir.bintray.com/releases/com/palantir/conjure/verification/${API}/${VERSION}/${ARTIFACT_NAME}" $DOWNLOAD_OUTPUT

DOWNLOAD_OUTPUT="$RESOURCES_DIR/${TEST_CASES}.json"
ARTIFACT_NAME="${TEST_CASES}-${VERSION}.json"
download "https://palantir.bintray.com/releases/com/palantir/conjure/verification/${TEST_CASES}/${VERSION}/${ARTIFACT_NAME}" $DOWNLOAD_OUTPUT

# Temporarily disabled, trying the docker image instead (docker run -p 8000:8000 docker.io/palantirtechnologies/conjure-verification-server:0.1.1-3-g5b3778f)

# case $(uname -s) in
#     Linux*) TARGET=x86_64-unknown-linux-gnu ;;
#     Darwin*) TARGET=x86_64-apple-darwin ;;
#     *) echo "Unsupported OS" >&2; exit 1;;
# esac

# ARTIFACT_NAME="${SERVER}-${VERSION}.tgz"
# out=$(download "https://palantir.bintray.com/releases/com/palantir/conjure/verification/${SERVER}/${VERSION}/${ARTIFACT_NAME}")
# tar xf "$out" -C "$DOWNLOADS_DIR" "bin/$TARGET/verification-server"
# cp -f "$DOWNLOADS_DIR/bin/$TARGET/verification-server" "$DOWNLOADS_DIR/bin/verification-server"

# chmod +x "$DOWNLOADS_DIR/bin/verification-server"
