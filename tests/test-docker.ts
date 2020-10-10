import { script, docker } from "@polycuber/script.cli"

script(() => {
  docker.createImage("myapp-node-win64", "windows")
    .from("")
    .execute(docker.installers.node)
    .build()
})
