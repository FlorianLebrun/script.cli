import { db, DBKind } from "../src"

db.createODBC({
  sourceName: "test",
  kind: DBKind.Postgre,
  name: "myDB",
  password: "myPassword",
  user: "myUser",
  server: "db.sql.com",
})
