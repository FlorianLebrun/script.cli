import { script, print } from "@polycuber/script.cli"

script((argv) => {
  print.success("say:", argv.message)
}, {
  arguments: {
    "message": {
      type: "string",
      required: true,
    }
  }
})
