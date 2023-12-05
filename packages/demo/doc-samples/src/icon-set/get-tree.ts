import { IconSet } from '@iconizza/tools';

const iconSet = new IconSet({
	prefix: 'foo',
	icons: {
		bar: {
			body: '<g />',
		},
	},
	aliases: {
		baz: {
			parent: 'bar',
		},
		baz2: {
			parent: 'baz',
		},
		bad: {
			parent: 'whatever',
		},
	},
});

console.log(iconSet.getTree());
