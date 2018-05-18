# conjure-typescript

conjure-typescript is a [Conjure]() generator for TypeScript, written in 
TypeScript. It replaces the [Java implementation](), 
which is deprecated.

## Overview

conjure-typescript is intended to be used by back end as well as front end repositories. Back end repositories 
should generate and publish TypeScript bindings for their APIs as part of their builds. Usage by front end repositories 
allows for more control over the version of the generator used, and decouples API changes from generator changes but 
at the cost of package size.

The Conjure definitions that the generator takes as input are expected to be in the [intermediate 
representation](), or IR, 
format.


## Usage
For usage by API defining services see their language specific build tools: [Java]()

For usage by front end repositories add `conjure-typescript` to your project's package.json file in the 
`devDependencies` block. This is where you will specify the version of the generator to use.

You consume conjure APIs in the typical manner by adding them to the `dependencies` block in your package.json. 
When installed these modules will use your specified generator to bootstrap themselves.

## Local Development

### Prerequisites: 

- Node 8+ (On macOS: `brew install node`)
- Yarn package manager 1.2+ (On macOS: `brew install yarn`; note that this is not the Hadoop package)

### One-time setup for development

1. Clone the repo and run `yarn` to install dependencies.
1. `yarn build` to build all packages once.
1. Install [VSCode](https://code.visualstudio.com/), recommended extensions: [TSLint](https://github.com/Microsoft/vscode-tslint), [Auto Import](https://github.com/soates/Auto-Import)

### Development tips

- Use `yarn test -- --watch` from the `packages/conjure-typescript` directory for a quick feedback loop while developing.
- To regenerate the expected test files, run `RECREATE=true yarn test`.

### Adding dependencies

- To add a global dependency shared across packages in the monorepo, use `yarn add`.
    - This includes global build tooling and common `@types` packages.
- To add a dependency for a frontend package, update its `package.json` and run `yarn` at the root.

## Publishing Releases

1. Tag a release from the GitHub UI.

