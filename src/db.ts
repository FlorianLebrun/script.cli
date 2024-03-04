import { command } from "./command"
import { print } from "./print"

/**
 * List of supported DBs
 */
export enum DBKind {
  MSSQL = "MSSQL",
  Postgre = "Postgre",
}

export type YesNo = "Yes" | "No"

export type Mode = "production" | "development"

/**
 * Parameters are split in 2
 * - Data Source parameters, common to any ODBC connection
 * - Driver parameters, specific to each driver
 */
export type ODBCParams = {
  dataSource: {
    kind: DBKind
    name: string
    driverName?: string
    dsnType?: "System" | "User"
    platform?: "64-bit" | "32-bit"
  },
  driver: { // Note: some options are driver specific
    server: string
    database: string
    user?: string
    password?: string
    port?: number
    trustServerCertificate?: YesNo
    SSLMode?: string
    trustedConnection?: YesNo
    encrypt?: YesNo
  },
}

/**
 * Define the default options per DBKind
 */
type DefaultValue = {
  dataSource?: Partial<ODBCParams["dataSource"]>
  driver?: Partial<ODBCParams["driver"]>
}
const defaultOptions: { [key in DBKind]: DefaultValue } = {
  Postgre: {
    dataSource: {
      dsnType: "User",
      driverName: "PostgreSQL Unicode(x64)",
    },
    driver: {
      port: 5432,
      SSLMode: "allow",
    },
  },
  MSSQL: {
    dataSource: {
      dsnType: "User",
      driverName: "ODBC Driver 18 for SQL Server",
    },
    driver: {
      trustedConnection: "No",
      encrypt: "No",
      trustServerCertificate: "No",
    },
  },
}

class ODBCManager {
  constructor(public readonly options: ODBCParams, public readonly mode: Mode) { }

  static callPowershell(scriptCommand: string, mode: Mode, extraOptions: string = ""): number {
    // We don't want to display anything from the command in production mode
    const redirect = mode === "production" ? "1>nul 2>nul" : ""
    return command.exec(`powershell.exe -NoProfile -ExecutionPolicy Unrestricted -NonInteractive -WindowStyle Hidden -Command "${scriptCommand}" ${extraOptions} ${redirect}`)
  }

  removeConnectionIfNeeded() {
    try {
      ODBCManager.callPowershell(`Remove-OdbcDsn -Name '${this.options.dataSource.name}' -DsnType '${this.options.dataSource.dsnType}'`, this.mode, "-ErrorAction SilentlyContinue")
      print.success("Previous connection removed")
    } catch (err) { }
  }

  createConnection(): number {
    const baseOptions = [
      `-Name '${this.options.dataSource.name}'`,
      `-DriverName '${this.options.dataSource.driverName}'`,
      `-DsnType '${this.options.dataSource.dsnType}'`,
    ]
    if (this.options.dataSource.platform) baseOptions.push(` -Platform '${this.options.dataSource.platform}'`)

    try {
      const exitCode = ODBCManager.callPowershell(`Add-OdbcDsn ${baseOptions.join(" ")} -SetPropertyValue @(${driverOptionsGenerator[this.options.dataSource.kind].generate(this.options)})`, this.mode)
      print.success("Connection created")
      return exitCode
    } catch (err) {
      print.error("Failed to create the asked ODBC connection")
      return -1
    }
  }
}

/**
 * Assemble the options for the driver, depending on the kind/driver
 */
const driverOptionsGenerator = {
  MSSQL: {
    generate(options: ODBCParams): string {
      const generateDriverVersionSpecificProperties = (): string[] => {
        const moreProperties: string[] = []
        const parsedDriverName = parseDriverName(options.dataSource.kind, options.dataSource.driverName)
        if (parsedDriverName) {
          // TrustServerCertificate
          if ((parsedDriverName.name === "SQL Server" && parsedDriverName.version >= 2022) ||
            (parsedDriverName.name === "ODBC Driver for SQL Server" && parsedDriverName.version >= 18)) {
            if (options.driver.encrypt) moreProperties.push(`'Encrypt=${options.driver.encrypt}'`)
            if (options.driver.trustServerCertificate) moreProperties.push(`'TrustServerCertificate=${options.driver.trustServerCertificate}'`)
          }
        }
        return moreProperties
      }

      const driverOptions = [
        `'Server=${options.driver.server}'`,
        `'Database=${options.driver.database}'`,
      ]
      if (options.driver.trustedConnection) driverOptions.push(`'Trusted_Connection=${options.driver.trustedConnection}'`)
      driverOptions.push(...generateDriverVersionSpecificProperties())

      return driverOptions.join(", ")
    },
  },
  Postgre: {
    generate(options: ODBCParams): string {
      const driverOptions = [
        `'Server=${options.driver.server}'`,
        `'Database=${options.driver.database}'`,
        `'Port=${options.driver.port}'`,
        `'SSLMode=${options.driver.SSLMode}'`,
      ]
      if (options.driver.user) driverOptions.push(`'Username=${options.driver.user}'`)
      if (options.driver.password) driverOptions.push(`'Password=${options.driver.password}'`)
      return driverOptions.join(", ")
    }
  },
}

type DriverCategory = "SQL Server" | "ODBC Driver for SQL Server" | "PostgreSQL"

/**
 * Parse the driver name, separate the name from the version
 * @param dbkind DBkind for the connection
 * @param driverName Name of the driver
 * @returns Parsed structure or undefined
 */
function parseDriverName(dbkind: DBKind, driverName: string): { name: DriverCategory, version: number } {
  if (dbkind === DBKind.MSSQL) {
    // ODBC or SQL
    if ((/^ODBC Driver \d+ for SQL Server$/i).test(driverName)) {
      const versionReg = /(?<=ODBC Driver )\d+(?= for SQL Server)/i
      return {
        name: "ODBC Driver for SQL Server",
        version: Number(versionReg.exec(driverName)?.at(0).trim()),
      }
    }
    else if ((/^SQL Server \d+$/i).test(driverName)) {
      const versionReg = /(?=SQL Server )\d+/i
      return {
        name: "SQL Server",
        version: Number(versionReg.exec(driverName)?.at(0).trim()),
      }
    }
  }
  return undefined
}

export const db = {
  /**
   * Create an ODBC Connection using powershell and `Add-OdbcDsn`
   * visit https://docs.microsoft.com/en-us/powershell/module/wdac/add-odbcdsn for details
   * Warning: System DSN requires you to run this task as admin
   * @param options Options to create the connection
   */
  createODBC(options: ODBCParams, mode: Mode = "production"): number {
    if (!(options?.dataSource?.kind in DBKind)) throw new Error(`Unknown kind "${options?.dataSource?.kind}", use one of ${Object.values(DBKind).join(", ")}`)

    const defaultKind: DefaultValue = defaultOptions[options.dataSource.kind] || {}
    const fullOptions: ODBCParams = {
      dataSource: {
        ...defaultKind.dataSource,
        ...options.dataSource,
      },
      driver: {
        ...defaultKind.driver,
        ...options.driver,
      },
    }

    const odbcManager = new ODBCManager(fullOptions, mode)
    odbcManager.removeConnectionIfNeeded()
    return odbcManager.createConnection()
  },
}
