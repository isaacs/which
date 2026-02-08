import { isexe, sync as isexeSync } from 'isexe'
import { join, delimiter, sep, posix } from 'node:path'

export type WhichOptions = {
  all?: boolean
  path?: string
  pathExt?: string
  delimiter?: string
  nothrow?: boolean
}

const isWindows = process.platform === 'win32'

// used to check for slashed in commands passed in. always checks for the posix
// seperator on all platforms, and checks for the current separator when not on
// a posix platform. don't use the isWindows check for this since that is mocked
// in tests but we still need the code to actually work when called. that is also
// why it is ignored from coverage.
/* c8 ignore start */
const rSlash = new RegExp(
  `[${posix.sep}${sep === posix.sep ? '' : sep}]`.replace(/(\\)/g, '\\$1'),
)
/* c8 ignore stop */
const rRel = new RegExp(`^\\.${rSlash.source}`)

const getNotFoundError = (cmd: string, from: (...a: any[]) => unknown) => {
  const er = Object.assign(
    new Error(`not found: ${cmd}`, { cause: { code: 'ENOENT' } }),
    { code: 'ENOENT' },
  )
  Error.captureStackTrace(er, from)
  return er
}

const getPathInfo = (
  cmd: string,
  {
    path: optPath = process.env.PATH,
    pathExt: optPathExt = process.env.PATHEXT,
    delimiter: optDelimiter = delimiter,
  }: WhichOptions,
) => {
  // If it has a slash, then we don't bother searching the pathenv.
  // just check the file itself, and that's it.
  const pathEnv =
    cmd.match(rSlash) ?
      ['']
    : [
        // windows always checks the cwd first
        ...(isWindows ? [process.cwd()] : []),
        /* c8 ignore start: very unusual */
        ...(optPath || '').split(
          /* c8 ignore stop */
          optDelimiter,
        ),
      ]

  if (isWindows) {
    const pathExtExe =
      optPathExt || ['.EXE', '.CMD', '.BAT', '.COM'].join(optDelimiter)
    const pathExt = pathExtExe
      .split(optDelimiter)
      .flatMap(item => [item, item.toLowerCase()])
    if (cmd.includes('.') && pathExt[0] !== '') {
      pathExt.unshift('')
    }
    return { pathEnv, pathExt, pathExtExe }
  }

  return { pathEnv, pathExt: [''] }
}

const getPathPart = (raw: string, cmd: string) => {
  const pathPart = /^".*"$/.test(raw) ? raw.slice(1, -1) : raw
  const prefix = !pathPart && rRel.test(cmd) ? cmd.slice(0, 2) : ''
  return prefix + join(pathPart, cmd)
}

export const which = async (cmd: string, opt: WhichOptions = {}) => {
  const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt)
  const found = []

  for (const envPart of pathEnv) {
    const p = getPathPart(envPart, cmd)

    for (const ext of pathExt) {
      const withExt = p + ext
      const is = await isexe(withExt, {
        pathExt: pathExtExe,
        ignoreErrors: true,
      })
      if (is) {
        if (!opt.all) {
          return withExt
        }
        found.push(withExt)
      }
    }
  }

  if (opt.all && found.length) {
    return found
  }

  if (opt.nothrow) {
    return null
  }

  throw getNotFoundError(cmd, which)
}

export const whichSync = (cmd: string, opt: WhichOptions = {}) => {
  const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt)
  const found = []

  for (const pathEnvPart of pathEnv) {
    const p = getPathPart(pathEnvPart, cmd)

    for (const ext of pathExt) {
      const withExt = p + ext
      const is = isexeSync(withExt, {
        pathExt: pathExtExe,
        ignoreErrors: true,
      })
      if (is) {
        if (!opt.all) {
          return withExt
        }
        found.push(withExt)
      }
    }
  }

  if (opt.all && found.length) {
    return found
  }

  if (opt.nothrow) {
    return null
  }

  throw getNotFoundError(cmd, whichSync)
}
