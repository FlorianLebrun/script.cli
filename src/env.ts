import { command } from "./command"
import { file } from "./file"
var Path = require("path")

export const env = {
  /*
  Execute script and retrieve the environment variables
  */
  getScriptEnvVars(scriptPath) {
    file.write.text(
      Path.join(__dirname, "read.script.env.bat"),
      `@call %*
@call node --eval "console.log(JSON.stringify(require('process').env,null,2))" > "%~dp0.temp.env.json"
`
    )
    command.exec(`read.script.env.bat "${scriptPath}"`, { cwd: __dirname })
    // Read and remove env vars file
    const envJsonFile = Path.resolve(__dirname, ".temp.env.json")
    const env = file.read.json(envJsonFile)
    file.remove(envJsonFile)
    return env
  },
}
