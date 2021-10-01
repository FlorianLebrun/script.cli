import { script, print, command, string } from "@polycuber/script.cli"

print.info("Hello")
const gitStatus = command.read.exec("git status")
console.log(gitStatus)

console.log(string.slug("hello/worldé?value=124"))

