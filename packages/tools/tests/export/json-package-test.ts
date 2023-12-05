import { promises as fs } from 'node:fs'
import type { IconizzaJSON } from '@iconizza/types'
import { exportJSONPackage } from '../../lib/export/json-package'
import { IconSet } from '../../lib/icon-set'
import { scanDirectory } from '../../lib/misc/scan'

// Check if file or directory exists
async function exists(filename: string): Promise<boolean> {
   try {
      const stat = await fs.lstat(filename)
      return stat.isFile() || stat.isDirectory()
   }
   catch (err) {
      return false
   }
}

describe('Exporting to JSON package', () => {
   test('Few icons', async () => {
      const lastModified = 12345
      const targetDir = 'cache/export-json-package-test'
      const iconSet = new IconSet({
         prefix: 'foo',
         lastModified,
         icons: {
            maximize: {
               body: '<g fill="currentColor"><path d="M3 3v10h10V3H3zm9 9H4V4h8v8z"/></g>',
            },
            minimize: {
               body: '<g fill="currentColor"><path d="M14 8v1H3V8h11z"/></g>',
            },
         },
         aliases: {
            test: {
               parent: 'maximize',
            },
         },
         width: 24,
         height: 24,
      })

      // Clean directory
      try {
         await fs.rm(targetDir, {
            recursive: true,
            force: true,
         })
      }
      catch (err) {
         //
      }
      expect(await exists(targetDir)).toBe(false)

      // Export icon set
      await exportJSONPackage(iconSet, {
         target: targetDir,
      })

      // Make sure directory exists and list files
      expect(await exists(targetDir)).toBe(true)
      const files = await scanDirectory(targetDir)
      files.sort((a, b) => a.localeCompare(b))
      expect(files).toEqual([
         'chars.json',
         'icons.json',
         'index.d.ts',
         'index.js',
         'index.mjs',
         'info.json',
         'metadata.json',
         'package.json',
      ])

      // Check contents of icons.json
      // No metadata or characters to check
      const actualData = JSON.parse(
         await fs.readFile(`${targetDir}/icons.json`, 'utf8'),
      ) as IconizzaJSON
      const expectedData = iconSet.export()
      expect(actualData).toEqual(expectedData)

      // Check package.json to make sure it uses wildcard
      const packageContent = JSON.parse(
         await fs.readFile(`${targetDir}/package.json`, 'utf8'),
      ) as Record<string, unknown>
      expect(packageContent.dependencies).toEqual({
         '@iconizza/types': '*',
      })

      // Clean up
      await fs.rm(targetDir, {
         recursive: true,
         force: true,
      })
      expect(await exists(targetDir)).toBe(false)
   })
})
