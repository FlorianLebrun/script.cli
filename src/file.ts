import Path from "path"
import fs from "fs"

export const file: {
  exists(path: string): boolean
  remove(path: string)
  copy: {
    toFile(src: string, dest: string): string
    toDir(src: string, dest: string): string
  }
  move: {
    toFile(src: string, dest: string): string
    toDir(src: string, dest: string): string
  }
  read: {
    json(path: string): any
    text(path: string): string
  }
  write: {
    json(path: string, data: any)
    text(path: string, data: string)
  }
} = {
  exists(path) {
    return fs.existsSync(path) && fs.lstatSync(path).isFile()
  },
  copy: {
    toFile(src, dest) {
      dest = Path.resolve(dest)
      directory.make(Path.dirname(dest))
      fs.copyFileSync(src, dest)
      return dest
    },
    toDir(src, dest) {
      dest = Path.resolve(dest, Path.basename(src))
      directory.make(Path.dirname(dest))
      fs.copyFileSync(src, dest)
      return dest
    }
  },
  move: {
    toFile(src, dest) {
      dest = Path.resolve(dest)
      directory.make(Path.dirname(dest))
      fs.copyFileSync(src, dest)
      fs.unlinkSync(src)
      return dest
    },
    toDir(src, dest) {
      dest = Path.resolve(dest, Path.basename(src))
      directory.make(Path.dirname(dest))
      fs.copyFileSync(src, dest)
      fs.unlinkSync(src)
      return dest
    },
  },
  read: {
    json(path) {
      try { return JSON.parse(fs.readFileSync(path).toString()) }
      catch (e) { return undefined }
    },
    text(path) {
      try { return fs.readFileSync(path).toString() }
      catch (e) { return undefined }
    }
  },
  write: {
    json(path, data) {
      directory.make(Path.dirname(path))
      fs.writeFileSync(path, JSON.stringify(data, null, 2))
    },
    text(path, data) {
      directory.make(Path.dirname(path))
      fs.writeFileSync(path, Array.isArray(data) ? data.join("\n") : data.toString())
    }
  },
  remove(path) {
    if (fs.existsSync(path)) {
      fs.unlinkSync(path)
    }
  },
}

export const directory: {
  exists(path: string): boolean
  filenames(path: string): string[]
  copy(src: string, dest: string, filter?: (name: string, path: string, stats: fs.Stats) => boolean)
  make(path: string)
  remove(path: string)
  clean(path: string)
} = {
  exists(path) {
    return fs.existsSync(path) && fs.lstatSync(path).isDirectory()
  },
  filenames(path) {
    try { return fs.readdirSync(path) || [] }
    catch (e) { return [] }
  },
  copy(src, dest, filter) {
    if (directory.exists(src)) {
      for (const name of fs.readdirSync(src)) {
        const path = Path.join(src, name)
        const stats = fs.lstatSync(path)
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
  make(path) {
    if (path && !fs.existsSync(path)) {
      directory.make(Path.parse(path).dir)
      fs.mkdirSync(path)
    }
  },
  remove(path) {
    if (fs.existsSync(path) && fs.lstatSync(path).isDirectory()) {
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
  },
  clean(path) {
    directory.remove(path)
    directory.make(path)
  },
}

