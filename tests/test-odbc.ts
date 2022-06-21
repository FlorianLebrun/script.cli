import { db, DBKind } from "../src"

db.createODBC({
  sourceName: "test",
  kind: DBKind.MSSQL,
  name: "sqlserveronaci.francecentral.azurecontainer.io",
  password: "mypassss",
  user: "sa",
  server: "sqlserveronaci.francecentral.azurecontainer.io",
  trustServerCertificate: "Yes",
  driverName: "ODBC Driver 18 for SQL Server"
})
