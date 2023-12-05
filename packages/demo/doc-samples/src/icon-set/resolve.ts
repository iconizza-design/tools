import { IconSet } from '@iconizza/tools';

const iconSet = new IconSet({
	prefix: 'codicon',
	icons: {
		'add': {
			body: '<g fill="currentColor"><path d="M14 7v1H8v6H7V8H1V7h6V1h1v6h6z"/></g>',
		},
		'debug-pause': {
			body: '<g fill="currentColor"><path d="M4.5 3H6v10H4.5V3zm7 0v10H10V3h1.5z"/></g>',
			hidden: true,
		},
		'triangle-left': {
			body: '<g fill="currentColor"><path d="M10.44 2l.56.413v11.194l-.54.393L5 8.373v-.827L10.44 2z"/></g>',
		},
	},
	aliases: {
		'plus': {
			parent: 'add',
		},
		'triangle-right': {
			parent: 'triangle-left',
			hFlip: true,
		},
	},
});

// Resolve icon (partial and full)
console.log(iconSet.resolve('debug-pause'));
console.log(iconSet.resolve('debug-pause', true));

// Resolve variation (partial and full)
console.log(iconSet.resolve('triangle-right'));
console.log(iconSet.resolve('triangle-right', true));

// Resolve alias (partial and full)
console.log(iconSet.resolve('plus'));
console.log(iconSet.resolve('plus', true));
