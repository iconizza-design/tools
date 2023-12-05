/**
 * This is an advanced example for creating icon bundles for Iconizza SVG Framework.
 * It creates a bundle from all SVG files in a directory.
 *
 * This example uses Iconizza Tools to import and clean up icons.
 * For Iconizza Tools documentation visit https://docs.iconizza.design/tools/tools2/
 */
import { promises as fs } from 'fs';
import { dirname } from 'path';

// Installation: npm install --save-dev @iconizza/tools
import {
	importDirectorySync,
	cleanupSVG,
	parseColorsSync,
	isEmptyColor,
	runSVGO,
} from '@iconizza/tools';

// Iconizza component (this changes import statement in generated file)
// Available options: '@iconizza/react' for React, '@iconizza/vue' for Vue 3, '@iconizza/vue2' for Vue 2, '@iconizza/svelte' for Svelte
const component = '@iconizza/react';

// Set to true to use require() instead of import
const commonJS = false;

// File to save bundle to
const target = 'lib/icons-bundle.js';

// SVG files location
const source = 'svg';

// Prefix to use for custom icons
const prefix = 'custom';

// Import icons
(async function () {
	// Import icons
	const iconSet = importDirectorySync(source, {
		prefix,
	});

	// Validate, clean up, fix palette and optimise
	iconSet.forEachSync((name, type) => {
		if (type !== 'icon') {
			return;
		}

		// Get SVG instance for parsing
		const svg = iconSet.toSVG(name);
		if (!svg) {
			// Invalid icon
			iconSet.remove(name);
			return;
		}

		// Clean up and optimise icons
		try {
			// Clean up icon code
			cleanupSVG(svg);

			// Assume icon is monotone: replace color with currentColor, add if missing
			// If icon is not monotone, remove this code
			parseColorsSync(svg, {
				defaultColor: 'currentColor',
				callback: (attr, colorStr, color) => {
					return !color || isEmptyColor(color)
						? colorStr
						: 'currentColor';
				},
			});

			// Optimise
			runSVGO(svg);
		} catch (err) {
			// Invalid icon
			console.error(`Error parsing ${name}:`, err);
			iconSet.remove(name);
			return;
		}

		// Update icon from SVG instance
		iconSet.fromSVG(name, svg);
	});
	console.log(`Imported ${iconSet.count()} icons`);

	// Export to JSON
	const json = iconSet.export();

	// Export to bundle
	let output = commonJS
		? "const { addCollection } = require('" + component + "');\n\n"
		: "import { addCollection } from '" + component + "';\n\n";
	output += 'addCollection(' + JSON.stringify(json) + ');\n';

	// Create directory for output if missing
	const dir = dirname(target);
	try {
		await fs.mkdir(dir, {
			recursive: true,
		});
	} catch (err) {
		//
	}

	// Save to file
	await fs.writeFile(target, output, 'utf8');

	console.log(`Saved ${target} (${output.length} bytes)`);
})().catch((err) => {
	console.error(err);
});
