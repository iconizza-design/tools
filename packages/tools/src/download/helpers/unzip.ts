import { promises as fs } from 'node:fs'
import extract from 'extract-zip'

/**
 * Unzip archive
 */
export async function unzip(source: string, path: string): Promise<void> {
   const dir = await fs.realpath(path)
   await extract(source, {
      dir,
   })
}
