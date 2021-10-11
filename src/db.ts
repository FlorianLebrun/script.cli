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

if($DbType -eq "Postgres") {
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

enum DBTypes {
  MSSQL,
  Oracle,
  Postgres,
} 

export const db = {
  /*
  Create an ODBC Connection
  */
  createODBC(dbSourceName: string, type: DBTypes, server: string, dbName, dbUser: string, dbPassword: string): number {
    file.write.text(
      path.join(__dirname, "create-odbc-connection.ps1"),
      createODBC
    )

    const scriptName = path.join(__dirname, "create-odbc-connection.ps1")
    const scriptParameters = `-ODBCConnectionName ${dbSourceName} -DbType ${type} -DbServer ${server} -DbName ${dbName} -DbUser ${dbUser} -DbPassword '${dbPassword}'`
    console.log(`Creating ODBC connection ${dbSourceName}`)
    return command.exec(
      `powershell.exe -NoProfile -ExecutionPolicy Unrestricted -Command "${scriptName} ${scriptParameters}"`,
      { cwd: __dirname }
    )
  },
}
