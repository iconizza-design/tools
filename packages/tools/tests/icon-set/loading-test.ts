import type { IconizzaInfo, IconizzaJSON } from '@iconizza/types'
import { IconSet } from '../../lib/icon-set'
import type {
   IconSetIcon,
   IconSetIconVariation,
   ResolvedIconizzaIcon,
} from '../../lib/icon-set/types'
import { loadFixture } from '../../lib/tests/helpers'

describe('Loading icon set', () => {
   test('Simple icon set', () => {
      const lastModified = 123
      const iconSetData: IconizzaJSON = {
         prefix: 'foo',
         lastModified,
         icons: {
            foo: {
               body: '<g id="foo" />',
            },
            bar: {
               body: '<g id="bar" />',
            },
         },
         aliases: {
            baz: {
               parent: 'bar',
               hFlip: true,
            },
            // invalid alias
            foo: {
               parent: 'bar',
            },
         },
      }
      const iconSet = new IconSet(iconSetData)
      expect(iconSet.list()).toEqual(['foo', 'bar', 'baz'])

      // Check entries
      const foo: IconSetIcon = {
         type: 'icon',
         body: '<g id="foo" />',
         props: {},
         chars: new Set(),
         categories: new Set(),
      }
      const bar: IconSetIcon = {
         type: 'icon',
         body: '<g id="bar" />',
         props: {},
         chars: new Set(),
         categories: new Set(),
      }
      const baz: IconSetIconVariation = {
         type: 'variation',
         parent: 'bar',
         props: {
            hFlip: true,
         },
         chars: new Set(),
      }
      expect(iconSet.entries).toEqual({
         foo,
         bar,
         baz,
      })
      expect(iconSet.lastModified).toBe(lastModified)

      // Test exists()
      expect(iconSet.exists('foo')).toBe(true)
      expect(iconSet.exists('bar')).toBe(true)
      expect(iconSet.exists('baz')).toBe(true)
      expect(iconSet.exists('bar2')).toBe(false)

      // Resolve icon
      const expected: ResolvedIconizzaIcon = {
         body: '<g id="bar" />',
      }
      expect(iconSet.resolve('bar')).toEqual(expected)
      expect(iconSet.resolve('bar', false)).toEqual(expected)

      const expected2: ResolvedIconizzaIcon = {
         body: '<g id="foo" />',
      }
      expect(iconSet.resolve('foo')).toEqual(expected2)

      // Export icon set
      expect(iconSet.export()).toEqual({
         prefix: 'foo',
         lastModified,
         icons: {
            foo: {
               body: '<g id="foo" />',
            },
            bar: {
               body: '<g id="bar" />',
            },
         },
         aliases: {
            baz: {
               parent: 'bar',
               hFlip: true,
            },
         },
      })

      // Count icons
      expect(iconSet.count()).toBe(3)

      // Info should be undefined
      expect(iconSet.info).toBeUndefined()
   })

   test('With properties', () => {
      const lastModified = 13579
      const iconSet = new IconSet({
         prefix: 'foo',
         lastModified,
         icons: {
            'bar-32': {
               body: '<g />',
               width: 32,
               hFlip: true,
               vFlip: false,
               hidden: true,
            },
            'bar-20': {
               body: '<g id="baz" />',
               width: 20,
               height: 20,
               left: 0,
               top: 0,
               rotate: 1,
            },
         },
         height: 24,
         chars: {
            f00: 'bar-32',
            f01: 'foo',
         },
         themes: {
            valid32px: {
               title: '32px',
               suffix: '-32',
            },
            valid20px: {
               title: '20px',
               suffix: '-20',
            },
            invalid1: {
               title: '24px',
               suffix: '24',
            },
            validPrefix: {
               title: 'Bar',
               prefix: 'bar-',
            },
            invalid2: {
               title: 'Baz',
               prefix: 'baz',
            },
         },
      })
      expect(iconSet.list()).toEqual(['bar-32', 'bar-20'])

      // Check entries
      const bar32: IconSetIcon = {
         type: 'icon',
         body: '<g />',
         props: {
            width: 32,
            height: 24,
            hFlip: true,
            hidden: true,
         },
         chars: new Set(['f00']),
         categories: new Set(),
      }
      const bar20: IconSetIcon = {
         type: 'icon',
         body: '<g id="baz" />',
         props: {
            width: 20,
            height: 20,
            rotate: 1,
         },
         chars: new Set(),
         categories: new Set(),
      }

      expect(iconSet.entries).toEqual({
         'bar-32': bar32,
         'bar-20': bar20,
      })

      expect(iconSet.lastModified).toBe(lastModified)

      // Test exists()
      expect(iconSet.exists('bar-32')).toBe(true)
      expect(iconSet.exists('bar-20')).toBe(true)
      expect(iconSet.exists('foo')).toBe(false)

      // Resolve icons
      const expected1: ResolvedIconizzaIcon = {
         body: '<g />',
         width: 32,
         height: 24,
         hFlip: true,
         hidden: true,
      }
      const expected1Full: Required<ResolvedIconizzaIcon> = {
         body: '<g />',
         width: 32,
         height: 24,
         left: 0,
         top: 0,
         rotate: 0,
         hFlip: true,
         vFlip: false,
         hidden: true,
      }
      const expected2: ResolvedIconizzaIcon = {
         body: '<g id="baz" />',
         width: 20,
         height: 20,
         rotate: 1,
      }
      expect(iconSet.resolve('bar-32')).toEqual(expected1)
      expect(iconSet.resolve('bar-32', true)).toEqual(expected1Full)
      expect(iconSet.resolve('bar-20')).toEqual(expected2)
      expect(iconSet.resolve('missing')).toBeNull()

      // Export icon set
      expect(iconSet.export()).toEqual({
         prefix: 'foo',
         lastModified,
         icons: {
            'bar-32': {
               body: '<g />',
               width: 32,
               height: 24,
               hFlip: true,
               hidden: true,
            },
            'bar-20': {
               body: '<g id="baz" />',
               width: 20,
               height: 20,
               rotate: 1,
            },
         },
         chars: {
            f00: 'bar-32',
         },
         prefixes: {
            bar: 'Bar',
         },
         suffixes: {
            20: '20px',
            // '32px' is not exported because there are no matching icons
         },
      })

      // Count icons: hidden icon is not counted
      expect(iconSet.count()).toBe(1)

      // Info should be undefined
      expect(iconSet.info).toBeUndefined()

      // Test checkTheme()
      expect(iconSet.checkTheme(false)).toEqual({
         valid: {
            20: ['bar-20'],
            32: [],
         },
         invalid: [],
      })
   })

   test('arty-animated.json', async () => {
      const iconSetData = JSON.parse(
         await loadFixture('arty-animated.json'),
      ) as IconizzaJSON

      // Add themes
      iconSetData.prefixes = {
         16: '16px',
      }

      const iconSet = new IconSet(iconSetData)

      // Count icons
      expect(iconSet.count()).toBe(51)

      // Test few icons
      expect(iconSet.resolve('16-drop-outline')).toEqual({
         body: iconSetData.icons['16-drop-outline'].body,
         width: 128,
         height: 128,
      })

      expect(iconSet.resolve('16-arrow-right')).toEqual({
         body: iconSetData.icons['16-arrow-left'].body,
         hFlip: true,
         width: 128,
         height: 128,
      })

      // Info should be undefined
      expect(iconSet.info).toBeUndefined()

      // Last modification time should not be set
      expect(iconSet.lastModified).toBe(0)

      // Check themes
      expect(iconSet.prefixes).toEqual({
         16: '16px',
      })
      expect(iconSet.suffixes).toEqual({})
   })

   test('codicon.json', async () => {
      const iconSetData = JSON.parse(
         await loadFixture('codicon.json'),
      ) as IconizzaJSON
      const iconSet = new IconSet(iconSetData)

      // Count icons (one hidden)
      expect(iconSet.count()).toBe(381)

      // Info should be set
      const expectedInfo: IconizzaInfo = {
         name: 'Codicons',
         total: 381,
         author: {
            name: 'Microsoft Corporation',
            url: 'https://github.com/microsoft/vscode-codicons',
         },
         license: {
            title: 'CC BY 4.0',
            spdx: 'CC-BY-4.0',
            url: 'https://raw.githubusercontent.com/microsoft/vscode-codicons/master/LICENSE',
         },
         version: '0.0.22',
         samples: ['account', 'bell-dot', 'new-file'],
         height: [16, 24],
         displayHeight: 16,
         category: 'General',
         palette: false,
      }
      expect(iconSet.info).toEqual(expectedInfo)

      // Last modification time should not be set
      expect(iconSet.lastModified).toBe(0)
   })

   test('Fluent UI', async () => {
      const iconSetData = JSON.parse(
         await loadFixture('fluent.old.json'),
      ) as IconizzaJSON
      const iconSet = new IconSet(iconSetData)

      expect(iconSet.resolve('accessibility-16-regular')).toEqual({
         body: iconSetData.icons['accessibility-16-regular'].body,
      })

      expect(iconSet.resolve('accessibility-20-regular')).toEqual({
         body: iconSetData.icons['accessibility-20-regular'].body,
         width: 20,
         height: 20,
      })
   })
})
