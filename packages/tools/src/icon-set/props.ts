import {
   commonObjectProps,
   unmergeObjects,
} from '@iconizza/utils/lib/misc/objects'
import { defaultIconProps } from '@iconizza/utils'
import type { CommonIconProps } from './types'

/**
 * Common properties for icon and alias
 */
export const defaultCommonProps: Required<CommonIconProps> = Object.freeze({
   ...defaultIconProps,
   hidden: false,
})

/**
 * Filter icon props: copies properties, removing undefined and default entries
 */
export function filterProps(
   data: CommonIconProps,
   reference: CommonIconProps,
   compareDefaultValues: boolean,
): CommonIconProps {
   const result = commonObjectProps(data, reference)
   return compareDefaultValues ? unmergeObjects(result, reference) : result
}
