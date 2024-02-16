import { db, DBKind } from "../src"

db.createODBC({
  dataSource: {
    kind: DBKind.MSSQL,
    name: "test",
    driverName: "SQL Server",
    dsnType: "User",
  },
  driver: {
    database: "sqlserveronaci.francecentral.azurecontainer.io",
    server: "sqlserveronaci.francecentral.azurecontainer.io",
  }
})
