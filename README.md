# conjure-typescript

conjure-typescript is a [Conjure](https://github.com/palantir/conjure) generator for TypeScript, written in TypeScript. 

## Overview

conjure-typescript is tool that allows your to generate TypeScript clients for a Conjure-defined API. 
The generated clients provide a simple Promise based interface for executing strongly typed remote procedure calls from
the browser or server.

## Usage

The easiest way to use conjure-typescript is through one of the follow build tools:
- [Gradle](https://github.com/palantir/gradle-conjure)

Usage from a npm package is also supported by adding a devDependency on the `conjure-typescript` and invoking the exposed script:
```json
{
  "devDependencies": {
    "conjure-typescript": "^1.0.0"
  }
}
```

Usage from any other environment is supported by downloading a standalone executable from
[bintray](https://dl.bintray.com/palantir/releases/) at `com.palantir.conjure.typescript:conjure-typscript:<version>`
maven coordinates.

The conjure-typescript cli has the following command:
```
conjure-typescript generate

Generate TypeScript bindings for a conjure API

Positionals:
  input   The location of the apis IR
  output  The output location of the generated code

Options:
  --version                Show version number                                                                           [boolean]
  --help                   Show help                                                                                     [boolean]
  --packageVersion         The version of the generated package                                                [string] [required]
  --packageName            The name of the generated package                                                   [string] [required]
  --nodeCompatibleModules  Generate node compatible javascript                                          [boolean] [default: false]
```

## Contributing

See the [CONTRIBUTING.md](./CONTRIBUTING.md) document.
