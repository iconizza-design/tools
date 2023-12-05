import { downloadNPMPackage } from '@iconizza/tools';

(async () => {
	console.log(
		await downloadNPMPackage({
			target: 'downloads/icon-sets/mdi-light',
			package: '@iconizza-json/mdi-light',
		})
	);
})();
