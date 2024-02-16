import https from 'https'
import fs from 'fs'
import Path from 'path'
import { directory } from './file'

export const web = {
  async downloadToFile(path: string, url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      https.get(url, function (response) {
        directory.make(Path.dirname(path))
        const file = fs.createWriteStream(path)
          .on('finish', function () {
            file.close()
            resolve(null)
          })
          .on('error', function (err) { // Handle errors
            fs.unlink(path, () => reject(err))
          })
        response.pipe(file)
      }).on('error', reject)
    })
  }
}
