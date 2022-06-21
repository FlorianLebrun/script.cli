import { command } from "./command"
import { file } from "./file"
var path = require("path")

const createODBC = `param(
  $ODBCConnectionName,
  $ODBCDriverName,
  $DbType,
  $DbServer,
  $DbName,
  $DbUser = "",
  $DbPassword = "",
  $DbPort=5432,
  $TrustServerCertificate
)

Remove-OdbcDsn -Name $ODBCConnectionName -DsnType "System" -ErrorAction SilentlyContinue

if($DbType -eq "Postgre") {
  Add-OdbcDsn -Name $ODBCConnectionName -DriverName "$ODBCDriverName" -DsnType "System" -Platform "64-bit" -SetPropertyValue @("Server=$DbServer","Port=$DbPort","Database=$DbName", "Username=$DBUser"; "Password=$DbPassword", "SSLMode=allow")
} elseif ($DbType -eq "MSSQL") {
  Add-OdbcDsn -Name $ODBCConnectionName -DriverName "$ODBCDriverName" -DsnType "System" -Platform "64-bit" -SetPropertyValue @("Server=$DbServer", "Database=$DbName")
  if($TrustServerCertificate -eq "Yes"){
  set-itemproperty -Path HKLM:\\Software\\ODBC\\ODBC.INI\\$ODBCConnectionName -name TrustServerCertificate -value Yes
  }
} 
`
export enum DBKind {
  MSSQL = "MSSQL",
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
  /**
   * default to 'SQL Server Native Client 11.0' when used with MSSQL
   * default to 'PostgreSQL Unicode(x64)' when used with Postgre
   */
  driverName?: string
  /**
  * default to '5432' when used with Postgre
  */
  port?: number
  trustServerCertificate?: string

}

const defaultOptions = {
  Postgre: {
    driverName: "PostgreSQL Unicode(x64)",
    port: 5432
  },
  MSSQL: {
    driverName: "SQL Server Native Client 11.0",
    trustServerCertificate: "No"
  }
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
    const defaultOpt = defaultOptions[options.kind]
    if (!defaultOpt) {
      throw new Error("Wrong option, use Postgre or MSSQL for kind")
    }
    options = { ...defaultOpt, ...options }

    const scriptName = path.join(__dirname, "create-odbc-connection.ps1")
    const scriptParameters = `-ODBCConnectionName '${options.sourceName}' -TrustServerCertificate '${options.trustServerCertificate}' -ODBCDriverName '${options.driverName}' -DbType '${options.kind}' -DbServer '${options.server}' -DbName '${options.name}' -DbUser '${options.user}' -DbPassword '${options.password}' -DbPort ${options.port}`
    console.log(`Creating ODBC connection ${scriptParameters}`)
    return command.exec(
      `powershell.exe -NoProfile -ExecutionPolicy Unrestricted -Command "${scriptName} ${scriptParameters}"`,
      { cwd: __dirname }
    )
  },
}
