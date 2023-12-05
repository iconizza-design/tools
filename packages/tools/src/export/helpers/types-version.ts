import { promises as fs } from 'node:fs'
import { resolveModule } from 'local-pkg'

let cache: string

async function getVersion(): Promise<string> {
   const packageName = '@iconizza/types/package.json'
   const filename = resolveModule(packageName)
   if (!filename)
      throw new Error(`Cannot resolve ${packageName}`)

   const content = JSON.parse(await fs.readFile(filename, 'utf8')) as Record<
      string,
      unknown
   >
   return (cache = content.version as string)
}

/**
 * Get current version of Iconizza Types package
 */
export async function getTypesVersion(): Promise<string> {
   throw new Error(
      `getTypesVersion() is deprecated, use wildcard to make packages work with all versions`,
   )
   return cache || (await getVersion())
}
