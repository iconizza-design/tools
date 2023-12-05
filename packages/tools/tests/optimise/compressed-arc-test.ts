import { SVG } from '../../lib/svg'
import { deOptimisePaths } from '../../lib/optimise/flags'

describe('De-optimise paths', () => {
   test('Should de-compress arcs', async () => {
      const svg = new SVG(
         '<svg viewBox="0 0 1200 400" xmlns="http://www.w3.org/2000/svg" width="1200" height="400"><path d="M300 200H150A150 150 0 10300 50z"/></svg>',
      )
      await deOptimisePaths(svg)
      expect(svg.toMinifiedString()).toBe(
         '<svg viewBox="0 0 1200 400" xmlns="http://www.w3.org/2000/svg" width="1200" height="400"><path d="M300 200H150A150 150 0 1 0 300 50z"/></svg>',
      )
   })

   test('Should de-compress lines', async () => {
      const svg = new SVG(
         '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path fill="currentColor" d="m8 8 8-8 8 8z"/></svg>',
      )
      await deOptimisePaths(svg)
      expect(svg.toMinifiedString()).toBe(
         '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path fill="currentColor" d="m8 8l8-8l8 8z"/></svg>',
      )
   })
})
