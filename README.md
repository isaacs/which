# @isaacs/which

Like the unix `which` utility.

Finds the first instance of a specified executable in the PATH
environment variable. Does not cache the results, so `hash -r` is not
needed when the PATH changes.

## Fork Notice

This is a fork of the original `which` module that I wrote in
2011, because that became the property of npm, and I wanted a
hybrid CommonJS/ESM typescript implementation, which doesn't
align with the npm team's needs.

I'm ok with the fork continuing to exist. It is fine for
different parties to have different priorities. This is a small
module, and it does no harm to have multiple copies in the world.

## USAGE

```ts
import { which, whichSync } from '@isaacs/which'

// async usage
// rejects if not found
const resolved = await which('node')

// if nothrow option is used, returns null if not found
const resolvedOrNull = await which('node', { nothrow: true })

// sync usage
// throws if not found
const resolved = whichSync('node')

// if nothrow option is used, returns null if not found
const resolvedOrNull = whichSync('node', { nothrow: true })

// Pass options to override the PATH and PATHEXT environment vars.
await which('node', { path: someOtherPath, pathExt: somePathExt })
```

## OPTIONS

You may pass an options object as the second argument.

- `path`: Use instead of the `PATH` environment variable.
- `pathExt`: Use instead of the `PATHEXT` environment variable.
- `all`: Return all matches, instead of just the first one. Note that
  this means the function returns an array of strings instead of a
  single string.
