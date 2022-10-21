import Path from "path"
import fs from "fs"

/**
 * File common operation
 */
export const file = {
  exists(path: string): boolean {
    return fs.existsSync(path) && fs.statSync(path).isFile()
  },
  copy: {
    toFile(src: string, dest: string): string {
      dest = Path.resolve(dest)
      directory.make(Path.dirname(dest))
      fs.copyFileSync(src, dest)
      return dest
    },
    toDir(src: string, dest: string) {
      dest = Path.resolve(dest, Path.basename(src))
      directory.make(Path.dirname(dest))
      fs.copyFileSync(src, dest)
      return dest
    }
  },
  move: {
    toFile(src: string, dest: string) {
      dest = Path.resolve(dest)
      directory.make(Path.dirname(dest))
      fs.copyFileSync(src, dest)
      fs.unlinkSync(src)
      return dest
    },
    toDir(src: string, dest: string) {
      dest = Path.resolve(dest, Path.basename(src))
      directory.make(Path.dirname(dest))
      fs.copyFileSync(src, dest)
      fs.unlinkSync(src)
      return dest
    },
  },
  read: {
    json(path: string) {
      try { return JSON.parse(fs.readFileSync(path).toString()) }
      catch (e) { return undefined }
    },
    text(path: string) {
      try { return fs.readFileSync(path).toString() }
      catch (e) { return undefined }
    }
  },
  write: {
    json(path: string, data: any) {
      directory.make(Path.dirname(path))
      fs.writeFileSync(path, JSON.stringify(data, null, 2))
    },
    text(path: string, data: string) {
      directory.make(Path.dirname(path))
      fs.writeFileSync(path, Array.isArray(data) ? data.join("\n") : data.toString())
    }
  },
  find: {
    upperDir(base: string, subpath: string) {
      let previous, current = Path.resolve(base)
      do {
        previous = current
        if (fs.existsSync(Path.join(current, subpath))) return current
        current = Path.dirname(current)
      } while (current != previous)
    }
  },
  remove(path: string) {
    if (fs.existsSync(path)) {
      fs.unlinkSync(path)
    }
  },
}

/**
 * Manage directory common operation
 */
export const directory = {
  getValidPath(paths) {
    for (const path of paths) {
      if (fs.existsSync(path)) return path
    }
    throw "no valid path found"
  },
  exists(path: string): boolean {
    return fs.existsSync(path) && fs.statSync(path).isDirectory()
  },
  filenames(path: string, recursive?: Boolean): string[] {
    try {
      if (recursive) {

        function *walkSync(dir: string) {
          const files = fs.readdirSync(dir)
      
          for (const file of files) {
            const pathToFile = Path.join(dir, file)
            const isDirectory = fs.statSync(pathToFile).isDirectory()
            if (isDirectory) {
              yield *walkSync(pathToFile)
            } else {
              yield pathToFile
            }
          }
        }

        var _Result = []
        for (const file of walkSync(path)) {
          _Result.push(Path.relative(path, file))
        }
        return _Result
      }
      else return fs.readdirSync(path) || [] 
    }
    catch (e) { return [] }
  },
  copy(src: string, dest: string, filter?: (name: string, path: string, stats) => boolean) {
    if (directory.exists(src)) {
      for (const name of fs.readdirSync(src)) {
        const path = Path.join(src, name)
        const stats = fs.statSync(path)
        const destination = Path.join(dest, name)
        if (stats.isDirectory()) {
          directory.copy(path, destination, filter)
        }
        else if (!filter || filter(name, path, stats)) {
          file.copy.toFile(path, destination)
        }
      }
    }
  },
  make(path: string) {
    if (path && !fs.existsSync(path)) {
      directory.make(Path.parse(path).dir)
      fs.mkdirSync(path)
    }
  },
  remove(path: string) {
    if (fs.existsSync(path)) {
      const stats = fs.lstatSync(path)
      if (stats.isSymbolicLink()) {
        file.remove(path)
      }
      else if (stats.isDirectory()) {
        fs.readdirSync(path).forEach(function (entry) {
          var entry_path = Path.join(path, entry)
          if (fs.lstatSync(entry_path).isDirectory()) {
            directory.remove(entry_path)
          }
          else {
            try { file.remove(entry_path) }
            catch (e) { return }
          }
        })
        fs.rmdirSync(path)
      }
    }
  },
  clean(path: string) {
    directory.remove(path)
    directory.make(path)
  },
}

