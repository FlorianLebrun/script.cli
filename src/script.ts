import Process from "process"
import { print } from "./print"

require.resolve
export type ScriptArgumentType = {
  type: string
  enums?: string[]
  isArray?: boolean
  required?: boolean
  closure?: boolean
  default?: any
}

export type ScriptDescriptorType = {
  arguments?: {
    [name: string]: ScriptArgumentType
  }
}

export interface ScriptFunction {
  (program: (argv?: any) => void, descriptor?: ScriptDescriptorType): void
}

export const script: ScriptFunction = scriptEntrypoint as any

function scriptEntrypoint(program: (argv?: any) => void, descriptor?: ScriptDescriptorType) {
  try {
    const argv = {}
    const argvInfos = descriptor && descriptor.arguments

    // Read arguments collection
    let key = "0"
    for (let i = 0; i < Process.argv.length; i++) {
      const value = Process.argv[i]
      if (value.startsWith("--")) {
        key = value.substr(2)
        if (argvInfos) {
          const schema = argvInfos[key]
          if (!schema) {
            throw new Error(`argument '${key}' invalid: is not a recognized input`)
          }
          if (schema.closure === true) {
            argv[key] = Process.argv.slice(i + 1)
            break
          }
        }
        argv[key] = true
      }
      else {
        if (Array.isArray(argv[key])) argv[key].push(value)
        else if (argv[key] === true) argv[key] = value
        else argv[key] = [argv[key], value]
      }
    }

    // Check arguments collection
    for (const key in argvInfos) {
      const schema = argvInfos[key]
      let value = argv[key]
      try {
        if (value !== undefined) {
          const checkScalar = (value) => {
            if (Array.isArray(schema.enums) && schema.enums.indexOf(value) < 0) {
              throw new Error(`value '${value}' is not in [${schema.enums.join(", ")}]`)
            }
            if (schema.type === "string") {
              if (value === true) value = ""
              if (typeof value !== "string") throw new Error(`shall be a string`)
            }
            else if (schema.type === "number") {
              value = parseFloat(value)
            }
            else if (schema.type === "object") {
              value = JSON.parse(value)
            }
            else if (schema.type === "boolean") {
              if (typeof value === "string") {
                value = value.toLowerCase()
                if (value === "true" || value === "on" || value === "1") value = true
                else if (value === "false" || value === "off" || value === "0") value = false
                else throw new Error(`shall string convertable into boolean`)
              }
              if (typeof value !== "boolean") {
                throw new Error(`shall be a boolean`)
              }
            }
            return value
          }
          if (Array.isArray(value)) {
            value = value.map(checkScalar)
            if (schema.isArray !== true) throw new Error("cannot be an array")
          }
          else {
            value = checkScalar(value)
            if (schema.isArray === true) value = [value]
          }
        }
        else {
          if (schema.required === true) throw new Error(`is required`)
          else if (schema.default !== undefined) value = schema.default
          else if (schema.type === "string") value = ""
          else if (schema.type === "number") value = 0
          else if (schema.type === "object") value = {}
          else if (schema.type === "boolean") value = false
        }
        argv[key] = value
      }
      catch (e) {
        e.message = `argument '${key}' invalid: ${e.message}`
        throw e
      }
    }

    // Execute script
    program(argv)
  }
  catch (e) {
    //print.error(e.message)
    print.exception(e)
    print.error(" >>> Failed script:", Process.argv.join(" "))
    Process.exit(1)
  }
}
