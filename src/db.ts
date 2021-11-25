import { command } from "./command"
import { file } from "./file"
var path = require("path")

const createODBC = `param(
  $ODBCConnectionName,
  $DbType,
  $DbServer,
  $DbName,
  $DbUser = "",
  $DbPassword = ""
)

if($DbType -eq "Postgre") {
  $DbPort = 5432
  $ODBCDriverName = "PostgreSQL Unicode(x64)"
} elseif ($DbType -eq "MSSQL") {
  $DbPort = "undefined"
  $ODBCDriverName = "undefined"
} elseif ($DbType -eq "Oracle") {
  $DbPort = "undefined"
  $ODBCDriverName = "undefined"
}

Remove-OdbcDsn -Name $ODBCConnectionName -DsnType "System" -ErrorAction SilentlyContinue
Add-OdbcDsn -Name $ODBCConnectionName -DriverName "$ODBCDriverName" -DsnType "System" -Platform "64-bit" -SetPropertyValue @("Server=$DbServer","Port=$DbPort","Database=$DbName", "Username=$DBUser"; "Password=$DbPassword", "SSLMode=allow")`

export enum DBKind {
  MSSQL = "MSSQL",
  Oracle = "Oracle",
  Postgre = "Postgre",
}

type odbcParams = {
  kind: DBKind
  sourceName: string
  server: string
  name: string
  user: string
  password: string
}

export const db = {
  /*
  Create an ODBC Connection
  You must be admin to be able to run this task
  */
  createODBC(params: odbcParams): number {
    file.write.text(
      path.join(__dirname, "create-odbc-connection.ps1"),
      createODBC
    )

    console.log(params.kind)

    const scriptName = path.join(__dirname, "create-odbc-connection.ps1")
    const scriptParameters = `-ODBCConnectionName ${params.sourceName} -DbType ${params.kind} -DbServer ${params.server} -DbName ${params.name} -DbUser ${params.user} -DbPassword '${params.password}'`
    console.log(`Creating ODBC connection ${params.sourceName}`)
    return command.exec(
      `powershell.exe -NoProfile -ExecutionPolicy Unrestricted -Command "${scriptName} ${scriptParameters}"`,
      { cwd: __dirname }
    )
  },
}
