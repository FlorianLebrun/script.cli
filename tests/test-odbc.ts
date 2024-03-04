import { db, DBKind } from "../src"

db.createODBC({
  dataSource: {
    kind: DBKind.MSSQL,
    name: "test",
    driverName: "SQL Server",
    dsnType: "User",
    platform: "64-bit",
  },
  driver: {
    database: "sqlserveronaci.francecentral.azurecontainer.io",
    server: "sqlserveronaci.francecentral.azurecontainer.io",
  }
}, "development")
