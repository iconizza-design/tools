import { promises as fs } from 'node:fs'
import { defaultIconDimensions } from '@iconizza/utils/lib/icon/defaults'
import type {
   IconizzaChars,
   IconizzaInfo,
   IconizzaJSON,
   IconizzaMetaData,
} from '@iconizza/types'
import type { IconSet } from '../icon-set'
import { writeJSONFile } from '../misc/write-json'
import type { ExportTargetOptions } from './helpers/prepare'
import { prepareDirectoryForExport } from './helpers/prepare'
import type {
   ExportOptionsWithCustomFiles,
} from './helpers/custom-files'
import {
   exportCustomFiles,
} from './helpers/custom-files'

/**
 * Options
 */
export interface ExportJSONPackageOptions
   extends ExportTargetOptions,
   ExportOptionsWithCustomFiles {
   // package.json contents
   package?: Record<string, unknown>
}

interface ExportContents {
   icons: IconizzaJSON
   info?: IconizzaInfo
   metadata?: IconizzaMetaData
   chars?: IconizzaChars
}
type ExportContentsKeys = keyof ExportContents

const exportTypes: Record<ExportContentsKeys, string> = {
   icons: 'IconizzaJSON',
   info: 'IconizzaInfo',
   metadata: 'IconizzaMetaData',
   chars: 'IconizzaChars',
}

const iconsKeys = ['aliases', 'lastModified'].concat(
   Object.keys(defaultIconDimensions),
) as (keyof IconizzaJSON)[]
const metadataKeys: (keyof IconizzaMetaData)[] = [
   'categories',
   'themes',
   'prefixes',
   'suffixes',
]

/**
 * Export icon set as JSON package
 *
 * Used for exporting `@iconizza-json/{prefix}` packages
 */
export async function exportJSONPackage(
   iconSet: IconSet,
   options: ExportJSONPackageOptions,
): Promise<string[]> {
   const files: Set<string> = new Set()

   // Normalise and prepare directory
   const dir = await prepareDirectoryForExport(options)

   // Export icon set to IconizzaJSON format
   const exportedJSON = iconSet.export(true)

   // Get icons
   const icons: IconizzaJSON = {
      prefix: exportedJSON.prefix,
      icons: exportedJSON.icons,
   }
   iconsKeys.forEach((attr) => {
      if (exportedJSON[attr] !== void 0)
         icons[attr as 'aliases'] = exportedJSON[attr as 'aliases']
   })

   // Get metadata
   const metadata: IconizzaMetaData = {}
   let hasMetadata = false
   metadataKeys.forEach((attr) => {
      if (exportedJSON[attr]) {
         metadata[attr as 'categories'] = exportedJSON[attr as 'categories']
         hasMetadata = true
      }
   })

   // Contents
   const info = exportedJSON.info
      ? {
            prefix: iconSet.prefix,
            ...exportedJSON.info,
         }
      : void 0
   const contents: ExportContents = {
      icons,
      info,
      metadata: hasMetadata ? metadata : void 0,
      chars: exportedJSON.chars,
   }

   // Generate package.json
   const { name, description, version, dependencies, ...customPackageProps }
      = options.package || {}
   const packageJSONIconSet: Record<string, string> = {}
   const packageJSONExports: Record<string, string | Record<string, string>>
      = {
         './*': './*',
         '.': {
            types: './index.d.ts',
            require: './index.js',
            import: './index.mjs',
         },
      }
   const packageJSON = {
      name: name || `@iconizza-json/${iconSet.prefix}`,
      description:
         description
         || `${
            info ? info.name : iconSet.prefix
         } icon set in Iconizza JSON format`,
      version,
      iconSetVersion: info?.version,
      main: 'index.js',
      module: 'index.mjs',
      types: 'index.d.ts',
      ...customPackageProps,
      exports: packageJSONExports,
      iconSet: packageJSONIconSet,
      dependencies: dependencies || {
         '@iconizza/types': '*', // '^' + (await getTypesVersion()),
      },
   }

   // Save all files, generate exports
   const dtsContent: string[] = []
   const cjsImports: string[] = []
   const cjsExports: string[] = []
   const mjsImports: string[] = []
   const mjsConsts: string[] = []
   const mjsExports: string[] = []

   for (const key in contents) {
      const attr = key as keyof typeof contents
      const data = contents[attr]
      const type = exportTypes[attr]
      const jsonFilename = `${attr}.json`
      const relativeFile = `./${jsonFilename}`

      // Add type
      dtsContent.push(`export declare const ${attr}: ${type};`)

      // Export variable
      cjsExports.push(`exports.${attr} = ${attr};`)
      mjsExports.push(attr)

      if (data !== void 0) {
         // Save JSON file
         await writeJSONFile(`${dir}/${jsonFilename}`, data)

         // Import data from JSON file
         cjsImports.push(`const ${attr} = require('${relativeFile}');`)
         mjsImports.push(
            `import ${attr} from '${relativeFile}' assert { type: 'json' };`,
         )

         // Add data to package.json
         packageJSONIconSet[attr] = `${attr}.json`
         packageJSONExports[relativeFile] = relativeFile
      }
      else {
         // Create empty data
         await writeJSONFile(`${dir}/${jsonFilename}`, {})
         cjsImports.push(`const ${attr} = {};`)
         mjsConsts.push(`const ${attr} = {};`)
      }

      files.add(jsonFilename)
   }

   // Generate CJS index file
   const cjsContent = cjsImports.concat([''], cjsExports)
   await fs.writeFile(`${dir}/index.js`, `${cjsContent.join('\n')}\n`, 'utf8')
   files.add('index.js')

   // Generate MJS index file
   const mjsContent = mjsImports.concat([''], mjsConsts, [
      `export { ${mjsExports.join(', ')} };`,
   ])
   await fs.writeFile(
      `${dir}/index.mjs`,
      `${mjsContent.join('\n')}\n`,
      'utf8',
   )
   files.add('index.mjs')

   // Generate types file
   const usedTypes = Object.values(exportTypes)
   const typesData = [
      `import type { ${usedTypes.join(', ')} } from '@iconizza/types';`,
      '',
      `export { ${usedTypes.join(', ')} };`,
      '',
   ].concat(dtsContent)

   await fs.writeFile(
      `${dir}/index.d.ts`,
      `${typesData.join('\n')}\n`,
      'utf8',
   )
   files.add('index.d.ts')

   // Write custom files
   await exportCustomFiles(dir, options, files)

   // Save package.json
   await writeJSONFile(`${dir}/package.json`, packageJSON)
   files.add('package.json')

   // Return list of stored files as array
   return Array.from(files)
}
