import { promises as fs } from 'node:fs'

/**
 * Write JSON file
 */
export async function writeJSONFile(
   filename: string,
   data: unknown,
): Promise<void> {
   return fs.writeFile(filename, `${JSON.stringify(data, null, '\t')}\n`)
}
