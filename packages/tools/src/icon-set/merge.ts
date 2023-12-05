import { findMatchingIcon } from './match'
import { hasIconDataBeenModified } from './modified'
import { IconSet } from '.'

function assertNever(v: never) {
   //
}

/**
 * Merge icon sets
 */
export function mergeIconSets(oldIcons: IconSet, newIcons: IconSet): IconSet {
   const mergedIcons = new IconSet(newIcons.export())
   const oldEntries = oldIcons.entries
   const entries = mergedIcons.entries

   function add(name: string): boolean {
      if (entries[name]) {
         // Already exists
         return true
      }

      const item = oldEntries[name]
      switch (item.type) {
         case 'icon': {
            // Attempt to find matching icon
            const fullIcon = oldIcons.resolve(name, true)
            const parent = fullIcon
               ? findMatchingIcon(mergedIcons, fullIcon)
               : null
            if (parent !== null) {
               // Add as alias
               mergedIcons.setAlias(name, parent)
               return true
            }

            // Add as is, duplicating props
            const props = item.props
            mergedIcons.setItem(name, {
               ...item,
               props: {
                  ...props,
                  hidden: true,
               },
               categories: new Set(),
            })
            return true
         }

         case 'variation':
         case 'alias': {
            // Add parent
            let parent = item.parent
            if (!add(parent))
               return false

            const parentItem = entries[parent]
            if (parentItem.type === 'alias') {
               // Alias of alias - use parent
               parent = parentItem.parent
            }

            if (item.type === 'variation') {
               // Hide variation and copy props
               const props = item.props
               mergedIcons.setItem(name, {
                  ...item,
                  parent,
                  props: {
                     ...props,
                     hidden: true,
                  },
               })
            }
            else {
               mergedIcons.setItem(name, {
                  ...item,
                  parent,
               })
            }
            return true
         }

         default:
            assertNever(item)
            return false
      }
   }

   // Add old icons
   for (const name in oldEntries)
      add(name)

   // Keep old lastModified if possible
   if (
      oldIcons.lastModified
      && !hasIconDataBeenModified(oldIcons, mergedIcons)
   ) {
      // Old and merged icon sets are identical: set last modification time to old icon set
      mergedIcons.updateLastModified(oldIcons.lastModified)
   }
   else if (
      newIcons.lastModified
      && !hasIconDataBeenModified(newIcons, mergedIcons)
   ) {
      // New and merged icon sets are identical: set last modificaiton time to new icon set
      mergedIcons.updateLastModified(newIcons.lastModified)
   }

   return mergedIcons
}
