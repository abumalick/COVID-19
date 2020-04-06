import path from 'path'
import {promises as fsPromises} from 'fs'

export function relativePathToRoot(relativePath) {
  return path.resolve(process.cwd(), relativePath)
}

export async function writeDataToFile(data, relativePath) {
  return fsPromises.writeFile(
    relativePathToRoot(relativePath),
    JSON.stringify(data, null, 2),
    (err) => {
      if (err) throw err
      console.log('The file has been saved!')
    },
  )
}
