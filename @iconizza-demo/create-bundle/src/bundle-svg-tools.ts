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

// File to save bundle to
const target = 'assets/icons-bundle.js';

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
	let output = 'add(' + JSON.stringify(json) + ');\n';

	// Wrap in custom code that checks for Iconizza.addCollection and IconizzaPreload
	output = `(function() { 
	function add(data) {
		try {
			if (typeof self.Iconizza === 'object' && self.Iconizza.addCollection) {
				self.Iconizza.addCollection(data);
				return;
			}
			if (typeof self.IconizzaPreload === 'undefined') {
				self.IconizzaPreload = [];
			}
			self.IconizzaPreload.push(data);
		} catch (err) {
		}
	}
	${output}
})();\n`;

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
