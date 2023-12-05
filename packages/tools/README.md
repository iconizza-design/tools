# Iconizza Tools

This library is a collection of tools for importing, exporting and processing SVG images.

Its main purpose is to convert icon sets and fonts to Iconizza JSON collections, but it can be used for other purposes.

## Installation

First install it by running this command:

```
npm install @iconizza/tools --save
```

## Example

The following code example does the following:

-   Imports set of SVG from directory.
-   Cleans up all icons.
-   Changes colors in all icons to `currentColor`.
-   Optimises icons.
-   Exports icons as `IconizzaJSON` icon set.

```js
import { promises as fs } from 'node:fs'
import { importDirectory } from '@iconizza/tools/lib/import/directory'
import { cleanupSVG } from '@iconizza/tools/lib/svg/cleanup'
import { runSVGO } from '@iconizza/tools/lib/optimise/svgo'
import { isEmptyColor, parseColors } from '@iconizza/tools/lib/colors/parse';

(async () => {
   // Import icons
   const iconSet = await importDirectory('svg/test', {
      prefix: 'test',
   })

   // Validate, clean up, fix palette and optimise
   await iconSet.forEach(async (name, type) => {
      if (type !== 'icon')
         return

      const svg = iconSet.toSVG(name)
      if (!svg) {
         // Invalid icon
         iconSet.remove(name)
         return
      }

      // Clean up and optimise icons
      try {
         cleanupSVG(svg)
         await parseColors(svg, {
            defaultColor: 'currentColor',
            callback: (attr, colorStr, color) => {
               return !color || isEmptyColor(color)
                  ? colorStr
                  : 'currentColor'
            },
         })
         runSVGO(svg)
      }
      catch (err) {
         // Invalid icon
         console.error(`Error parsing ${name}:`, err)
         iconSet.remove(name)
         return
      }

      // Update icon
      iconSet.fromSVG(name, svg)
   })

   // Export as IconizzaJSON
   const exported = `${JSON.stringify(iconSet.export(), null, '\t')}\n`

   // Save to file
   await fs.writeFile(`output/${iconSet.prefix}.json`, exported, 'utf8')
})()
```

## Documentation

Full documentation is too big for simple README file. See [Iconizza Tools documentation](https://docs.iconizza.design/tools/tools2/) for detailed documentation with code samples.

## Synchronous functions

Most functions in example above are asynchronous.

If you need to import or parse icons synchronously, such as in config file of package that does not support async configuration files, most functions have synchronous copies, such as `importDirectorySync()`.

## License

Library is released with MIT license.

© 2023-PRESENT Dennis Ollhoff
