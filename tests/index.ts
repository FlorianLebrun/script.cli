import { script, print, command } from "@polycuber/script.cli"

print.info("Hello")
const gitStatus = command.read.exec("git status")
console.log(gitStatus)

