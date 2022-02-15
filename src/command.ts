import Path from "path"
import Process from "process"
import ChildProcess from "child_process"

export type stringMap = { [name: string]: string }
export type stringArray = string[]

export type CommandOptionsType = {
  cwd?: string
  env?: { [name: string]: string }
  ignoreError?: boolean
}

export const command: {
  read: {
    exec(command: string, options: CommandOptionsType): string | Error,
    call(program: string, args: string[], options: CommandOptionsType): string | Error
  },
  exec(command: string, options?: CommandOptionsType): Error
  call(program: string, args?: (string | stringMap | stringArray)[], options?: CommandOptionsType): Error
  exit(status: number)
} = {
  read: {
    exec(command, options) {
      return execSync(command, {
        ...options,
        stdio: 'pipe',
      })
    },
    call(program, args, options) {
      return spawnSync(program, normalizeArgs(args), {
        ...options,
        stdio: 'pipe',
      })
    },
  },
  exec(command, options) {
    return execSync(command, {
      ...options,
      stdio: ['inherit', 'inherit', 'inherit'],
    }) as Error
  },
  call(program, args, options) {
    return spawnSync(program, normalizeArgs(args), {
      ...options,
      stdio: ['inherit', 'inherit', 'inherit'],
    }) as Error
  },
  exit(status) {
    Process.exit(status)
  },
}

function execSync(command: string, options?: any): string | Error {
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

function spawnSync(program: string, args: string[], options?: any): string | Error {
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

function handleError(command: string, error: Error, options?: any): Error {
  error.message = `Command '${command}' has failed:\n${indentMessage(error)}`
  if (options && options.ignoreError) console.log("[ignored]", error.message)
  else throw error
  return error
}

function indentMessage(message): string {
  const padding = "    | "
  return padding + message.toString().split("\n").join("\n" + padding)
}

function normalizeArgs(argv: any[]): string[] {
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
