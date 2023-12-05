import { SVG } from '../../lib/svg'
import { removeFigmaClipPathFromSVG } from '../../lib/optimise/figma'

describe('Cleaning up Figma clip paths', () => {
   test('Basic icon', () => {
      const paths = `<path d="M19 13.5V18.6518C19 18.8671 18.8846 19.0659 18.6977 19.1728L12.2977 22.8299C12.1132 22.9353 11.8868 22.9353 11.7023 22.8299L5.30233 19.1728C5.11539 19.0659 5.00001 18.8671 5.00001 18.6518L5 13" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>`
      const svg = new SVG(
			`<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_3377_18972)">
        ${paths}
    </g>
    <defs>
        <clipPath id="clip0_3377_18972">
            <rect width="24" height="24" fill="white"/>
        </clipPath>
    </defs>
</svg>`,
      )
      removeFigmaClipPathFromSVG(svg)
      expect(svg.toMinifiedString()).toBe(
			`<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g>${paths}</g></svg>`,
      )
   })

   test('Paths without group', () => {
      const svg = new SVG(
			`<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="#292929" stroke-linecap="round" stroke-linejoin="round" clip-path="url(#clip0_3377_18972)" />
    <rect x="12.01" y="12" width="0.01" height="0.01" transform="rotate(90 12.01 12)" stroke="#292929" stroke-width="1.5" stroke-linejoin="round" clip-path="url(#clip0_3377_18972)"/>
    <defs>
        <clipPath id="clip0_3377_18972">
            <rect width="24" height="24" fill="white"/>
        </clipPath>
    </defs>
</svg>`,
      )
      removeFigmaClipPathFromSVG(svg)
      expect(svg.toMinifiedString()).toBe(
			`<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" stroke="#292929" stroke-linecap="round" stroke-linejoin="round"/><rect x="12.01" y="12" width="0.01" height="0.01" transform="rotate(90 12.01 12)" stroke="#292929" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
      )
   })

   test('Attributes', () => {
      const svg = new SVG(
			`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_3377_18972)">
        <path d="M0 0z" stroke="currentColor" />
    </g>
    <defs>
        <clipPath id="clip0_3377_18972">
            <rect width="24" height="24" fill="#fff" stroke-width="1.5" transform="translate(0 0.000976562)"/>
        </clipPath>
    </defs>
</svg>`,
      )
      removeFigmaClipPathFromSVG(svg)
      expect(svg.toMinifiedString()).toBe(
			`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g stroke-width="1.5"><path d="M0 0z" stroke="currentColor"/></g></svg>`,
      )
   })
})
