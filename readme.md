# Library for commands script

It is designed to make __simple and not performant__ synchronous program with cli.

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

## DB

```js
const { db, DBKind } = require("@ewam/script.cli")

db.createODBC({
  sourceName: "test",
  kind: DBKind.Postgre,
  name: "myDB",
  password: "myPassword",
  user: "myUser",
  server: "db.sql.com",
})
db.createODBC({
  dataSource: {
    kind: DBKind.MSSQL,
    name: "test",
    driverName: "SQL Server",
  },
  driver: {
    database: "myDB",
    server: "db.sql.com",
    trustedConnection: "Yes",
  }
})
```