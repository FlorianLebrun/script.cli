# Library for commands script

Is design to make __simple and not performant__ synchronous program with cli.

The __typescript definition__ will help to see other exposed features.

```js
const { script, print } = require("@ewam/script.cli")

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
```
