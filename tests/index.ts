import { script, print, command, string, env } from "@polycuber/script.cli"

print.info("Hello")
const gitStatus = command.read.exec("git status")
console.log(gitStatus)

console.log(string.slug("hello/wor_ldé?value=124"))

console.log(env.getScriptEnvVars("C:/Program Files (x86)/Microsoft Visual Studio/2019/Professional/VC/Auxiliary/Build/vcvarsx86_amd64.bat"))