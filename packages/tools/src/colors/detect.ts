import type { IconSet } from '../icon-set'
import { isEmptyColor, parseColorsSync } from './parse'

/**
 * Detect palette
 *
 * Returns null if icon set has mixed colors
 */
export function detectIconSetPalette(iconSet: IconSet): boolean | null {
   let palette: boolean | null | undefined

   iconSet.forEachSync(
      (name) => {
         if (palette === null)
            return

         const svg = iconSet.toSVG(name)
         if (!svg)
            return

         let iconPalette: boolean | null | undefined
         parseColorsSync(svg, {
            callback: (attr, colorStr, color) => {
               if (!color) {
                  // Something went wrong
                  iconPalette = null
                  return colorStr
               }

               // Empty color or already failed
               if (iconPalette === null || isEmptyColor(color))
                  return color

               // Check color
               const isColor = color.type !== 'current'
               if (iconPalette === void 0) {
                  // First entry: assign it
                  iconPalette = isColor
                  return color
               }

               if (iconPalette !== isColor) {
                  // Mismatch
                  iconPalette = null
               }

               return color
            },
         })

         if (iconPalette === void 0) {
            // No colors found
            iconPalette = null
         }

         if (palette === void 0) {
            // First icon
            palette = iconPalette
         }
         else if (palette !== iconPalette) {
            // Different value
            palette = null
         }
      },
      ['icon'],
   )

   return palette === void 0 ? null : palette
}
