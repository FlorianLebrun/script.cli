import Path from "path"
import Process from "process"
import ChildProcess from "child_process"

export type stringMap = { [name: string]: string }
export type stringArray = string[]

export type CommandOptionsType = {
  cwd?: string
  env?: { [name: string]: string }
  ignoreStatus?: boolean
}

function execSync(command, options) {
  try {
    const stdout = ChildProcess.execSync(command, {
      ...options,
      cwd: options && options.cwd && Path.resolve(options.cwd),
    })
    return stdout && stdout.toString()
  }
  catch (error) {
    return handleError(command, error, options)
  }
}

function spawnSync(program, args, options) {
  const result = ChildProcess.spawnSync(program, args, {
    ...options,
    cwd: options && options.cwd && Path.resolve(options.cwd),
  })
  if (result.error || result.status) {
    const command = `${program} ${args ? args.join(" ") : ""}`
    return handleError(command, result.error || new Error(`Status ${result.status}`), options)
  }
  return result.stdout && result.stdout.toString()
}

function handleError(command, error, options) {
  error.message = `Command '${command}' has failed:\n${indentMessage(error)}`
  if (options && options.ignoreError) console.log("[ignored]", error.message)
  else throw error
  return error
}

function indentMessage(message) {
  const padding = "    | "
  return padding + message.toString().split("\n").join("\n" + padding)
}

type ReadCommand = {
  exec(command: string, options?: CommandOptionsType): number
  call(program: string, args?: (string | stringMap | stringArray)[], options?: CommandOptionsType): number
}

export const command: {
  exec(command: string, options?: CommandOptionsType): number
  call(program: string, args?: (string | stringMap | stringArray)[], options?: CommandOptionsType): number
  exit(status: number)
  read: ReadCommand
} = {
  read: {
    exec(command, options) {
      return execSync(command, {
        ...options,
        stdio: 'pipe',
      })
    },
    call(program, args, options) {
      return spawnSync(program, args, {
        ...options,
        stdio: 'pipe',
      })
    },
  },
  exec(command, options) {
    const status = ChildProcess.execSync(command, {
      ...options,
      cwd: options && options.cwd && Path.resolve(options.cwd),
      stdio: ['inherit', 'inherit', 'inherit']
    })
    if (status) {
      const message = `Command '${command}' has failed with status code ${status}.`
      if (options && options.ignoreStatus) console.log("[ignored]", message)
      else throw new Error(message)
    }
    return 0
  },
  call(program, args, options) {
    const argv = normalizeArgs(args)
    const result = ChildProcess.spawnSync(program, argv, {
      ...options,
      cwd: options && options.cwd && Path.resolve(options.cwd),
      stdio: ['inherit', 'inherit', 'inherit']
    })
    if (result.error) {
      throw new Error(`Command '${program} ${argv.join(" ")}' has crashed: ${result.error}.`)
    }
    else if (result.status) {
      const message = `Command '${program} ${argv.join(" ")}' has failed with status code ${result.status}.`
      if (options && options.ignoreStatus) console.log("[ignored]", message)
      else throw new Error(message)
    }
    return result.status
  },
  exit(status) {
    Process.exit(status)
  },
}

function normalizeArgs(argv): string[] {
  const result = []
  function process(arg) {
    if (Array.isArray(arg)) {
      arg.forEach(process)
    }
    else if (typeof arg === "object") {
      for (const key in arg) {
        result.push(key)
        process(arg[key])
      }
    }
    else {
      result.push(arg.toString())
    }
  }
  process(argv)
  return result
}
