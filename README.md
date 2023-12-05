# Iconizza Tools

This library is a collection of tools for importing, exporting and processing SVG images.

Its main purpose is to convert icon sets and fonts to Iconizza JSON collections, but it can be used for other purposes.

## Installation

First install it by running this command:

```
npm install @iconizza/tools --save
```

## Functions

Functions incuded in Iconizza Tools:

-   Download packages from git repository, GitHub API, GitLab API, NPM repository.
-   Import SVGs from directory (and downloaded package), Figma API.
-   Clean up, optimise, validate icons.
-   Parse or change icon palette.
-   Export icon sets in various formats.

See [Iconizza Tools documentation](https://iconizza.design/docs/libraries/tools/).

### Limitations

This library is optinionated.

It does not allow the following content in icons:

-   Scripts and event listeners.
-   Any remote resources: images, fonts, links, etc...
-   Raster images. They do not belong in scalable icons.
-   Text. Text is rendered differently in various operating systems, so it should not be used in SVG. Convert text to shapes.
-   All tags and attributes that are not approved are removed, including all XML namespaces.

All limitations listed above are by design.

Iconizza Tools library is designed to export icons that are safe to use in any environment and render identically for all users.

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

Full documentation is too big for simple README file. See [Iconizza Tools documentation](https://iconizza.design/docs/libraries/tools/) for detailed documentation with code samples.

## Sponsors

<p align="center">
  <a href="https://github.com/sponsors/nyxb">
    <img src='https://nyxb.github.io/static/sponsors.svg'/>
  </a>
</p>

## License

Library is released with MIT license.

© 2023-PRESENT Dennis Ollhoff
