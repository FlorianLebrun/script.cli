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
/**
 * ODBC Creation required parameters
 */
export type odbcParams = {
  /**
   * Database kind
   */
  kind: DBKind
  sourceName: string
  server: string
  name: string
  user: string
  password: string
}

export const db = {
  /**
   * Create an ODBC Connection using powershell and `Add-OdbcDsn`
   * visit https://docs.microsoft.com/en-us/powershell/module/wdac/add-odbcdsn for details
   * Warning: you must be admin to be able to run this task
   * @param options Options to create the connection
   */
  createODBC(options: odbcParams): number {
    file.write.text(
      path.join(__dirname, "create-odbc-connection.ps1"),
      createODBC
    )

    const scriptName = path.join(__dirname, "create-odbc-connection.ps1")
    const scriptParameters = `-ODBCConnectionName ${options.sourceName} -DbType ${options.kind} -DbServer ${options.server} -DbName ${options.name} -DbUser ${options.user} -DbPassword '${options.password}'`
    console.log(`Creating ODBC connection ${options.sourceName}`)
    return command.exec(
      `powershell.exe -NoProfile -ExecutionPolicy Unrestricted -Command "${scriptName} ${scriptParameters}"`,
      { cwd: __dirname }
    )
  },
}
