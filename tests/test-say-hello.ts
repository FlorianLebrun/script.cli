import { script, print } from "@ewam/script.cli"

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
