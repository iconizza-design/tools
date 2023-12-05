/**
 * This is an advanced example for creating icon bundles for Iconizza SVG Framework.
 *
 * It creates a bundle from:
 * - All SVG files in a directory.
 * - Custom JSON files.
 * - Iconizza icon sets.
 * - SVG framework.
 *
 * This example uses Iconizza Tools to import and clean up icons.
 * For Iconizza Tools documentation visit https://docs.iconizza.design/tools/tools2/
 */
import { promises as fs } from 'fs';
import { dirname } from 'path';

// Installation: npm install --save-dev @iconizza/tools @iconizza/utils @iconizza/json @iconizza/iconizza
import {
	importDirectorySync,
	cleanupSVG,
	parseColorsSync,
	isEmptyColor,
	runSVGO,
} from '@iconizza/tools';
import { getIcons, stringToIcon, minifyIconSet } from '@iconizza/utils';
import type { IconizzaJSON, IconizzaMetaData } from '@iconizza/types';

/**
 * Script configuration
 */
interface BundleScriptCustomSVGConfig {
	// Path to SVG files
	dir: string;

	// True if icons should be treated as monotone: colors replaced with currentColor
	monotone: boolean;

	// Icon set prefix
	prefix: string;
}

interface BundleScriptCustomJSONConfig {
	// Path to JSON file
	filename: string;

	// List of icons to import. If missing, all icons will be imported
	icons?: string[];
}

interface BundleScriptConfig {
	// Source file for Iconizza SVG Framework:
	// Use require.resolve('@iconizza/iconizza') for full version
	// Use require.resolve('@iconizza/iconizza/dist/iconizza.without-api.min') for version without API
	svgFramework?: string;

	// Custom SVG to import and bundle
	svg?: BundleScriptCustomSVGConfig[];

	// Icons to bundled from @iconizza/json packages
	iconizzaIcons?: string[];

	// List of JSON files to bundled
	// Entry can be a string, pointing to filename or a BundleScriptCustomJSONConfig object (see type above)
	// If entry is a string or object without 'icons' property, an entire JSON file will be bundled
	json?: (string | BundleScriptCustomJSONConfig)[];
}

let sources: BundleScriptConfig;
sources = {
	svgFramework: require.resolve(
		'@iconizza/iconizza/dist/iconizza.without-api.min'
	),

	svg: [
		{
			dir: 'svg',
			monotone: true,
			prefix: 'custom',
		},
		{
			dir: 'emojis',
			monotone: false,
			prefix: 'emoji',
		},
	],

	iconizzaIcons: [
		'mdi:home',
		'mdi:account',
		'mdi:login',
		'mdi:logout',
		'octicon:book-24',
		'octicon:code-square-24',
	],

	json: [
		// Custom JSON file
		'json/gg.json',
		// Iconizza JSON file (@iconizza/json is a package name, /json/ is directory where files are, then filename)
		require.resolve('@iconizza/json/json/tabler.json'),
		// Custom file with only few icons
		{
			filename: require.resolve('@iconizza/json/json/line-md.json'),
			icons: [
				'home-twotone-alt',
				'github',
				'document-list',
				'document-code',
				'image-twotone',
			],
		},
	],
};

// File to save bundle to
const target = 'assets/iconizza-bundle.js';

/**
 * Do stuff!
 */
(async function () {
	let bundle = '';

	// Create directory for output if missing
	const dir = dirname(target);
	try {
		await fs.mkdir(dir, {
			recursive: true,
		});
	} catch (err) {
		//
	}

	/**
	 * Bundle SVG framework
	 */
	const isIconizzaBundled = !!sources.svgFramework;
	const wrapperFunction = isIconizzaBundled ? 'Iconizza.addCollection' : 'add';
	if (sources.svgFramework) {
		bundle += await fs.readFile(sources.svgFramework, 'utf8');
		console.log('Bundled SVG framework');

		// Try to copy .d.ts
		const tsSource = sources.svgFramework.replace('.js', '.d.ts');
		try {
			const tsContent = await fs.readFile(tsSource);
			await fs.writeFile(target.replace('.js', '.d.ts'), tsContent);
		} catch (err) {
			//
		}
	}

	/**
	 * Convert sources.iconizzaIcons to sources.json
	 */
	if (sources.iconizzaIcons) {
		const sourcesJSON = sources.json ? sources.json : (sources.json = []);

		// Sort icons by prefix
		const organizedList = organizeIconsList(sources.iconizzaIcons);
		for (const prefix in organizedList) {
			const filename = require.resolve(
				`@iconizza/json/json/${prefix}.json`
			);
			sourcesJSON.push({
				filename,
				icons: organizedList[prefix],
			});
		}
	}

	/**
	 * Bundle JSON files
	 */
	if (sources.json) {
		for (let i = 0; i < sources.json.length; i++) {
			const item = sources.json[i];

			// Load icon set
			const filename = typeof item === 'string' ? item : item.filename;
			let content = JSON.parse(
				await fs.readFile(filename, 'utf8')
			) as IconizzaJSON;

			// Filter icons
			if (typeof item !== 'string' && item.icons?.length) {
				const filteredContent = getIcons(content, item.icons);
				if (!filteredContent) {
					throw new Error(
						`Cannot find required icons in ${filename}`
					);
				}
				content = filteredContent;
			}

			// Remove metadata and add to bundle
			removeMetaData(content);
			minifyIconSet(content);
			bundle += wrapperFunction + '(' + JSON.stringify(content) + ');\n';
			console.log(`Bundled icons from ${filename}`);
		}
	}

	/**
	 * Custom SVG
	 */
	if (sources.svg) {
		for (let i = 0; i < sources.svg.length; i++) {
			const source = sources.svg[i];

			// Import icons
			const iconSet = importDirectorySync(source.dir, {
				prefix: source.prefix,
			});

			// Validate, clean up, fix palette and optimise
			iconSet.forEach((name, type) => {
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

					if (source.monotone) {
						// Replace color with currentColor, add if missing
						// If icon is not monotone, remove this code
						parseColorsSync(svg, {
							defaultColor: 'currentColor',
							callback: (attr, colorStr, color) => {
								return !color || isEmptyColor(color)
									? colorStr
									: 'currentColor';
							},
						});
					}

					// Optimise
					runSVGO(svg);
				} catch (err) {
					// Invalid icon
					console.error(
						`Error parsing ${name} from ${source.dir}:`,
						err
					);
					iconSet.remove(name);
					return;
				}

				// Update icon from SVG instance
				iconSet.fromSVG(name, svg);
			});
			console.log(`Bundled ${iconSet.count()} icons from ${source.dir}`);

			// Export to JSON
			const content = iconSet.export();
			bundle += wrapperFunction + '(' + JSON.stringify(content) + ');\n';
		}
	}

	/**
	 * Add wrapper function if SVG framework is not in bundle
	 */
	if (!isIconizzaBundled) {
		// Wrap in custom code that checks for Iconizza.addCollection and IconizzaPreload
		bundle = `(function() { 
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
${bundle}
})();\n`;
	}

	// Save to file
	await fs.writeFile(target, bundle, 'utf8');

	console.log(`Saved ${target} (${bundle.length} bytes)`);
})().catch((err) => {
	console.error(err);
});

/**
 * Remove metadata from icon set
 */
function removeMetaData(iconSet: IconizzaJSON) {
	const props: (keyof IconizzaMetaData)[] = [
		'info',
		'chars',
		'categories',
		'themes',
		'prefixes',
		'suffixes',
	];
	props.forEach((prop) => {
		delete iconSet[prop];
	});
}

/**
 * Sort icon names by prefix
 */
function organizeIconsList(icons: string[]): Record<string, string[]> {
	const sorted: Record<string, string[]> = Object.create(null);
	icons.forEach((icon) => {
		const item = stringToIcon(icon);
		if (!item) {
			return;
		}

		const prefix = item.prefix;
		const prefixList = sorted[prefix]
			? sorted[prefix]
			: (sorted[prefix] = []);

		const name = item.name;
		if (prefixList.indexOf(name) === -1) {
			prefixList.push(name);
		}
	});

	return sorted;
}
