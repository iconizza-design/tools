import { getNPMVersion } from '@iconizza/tools';

(async () => {
	console.log(
		await getNPMVersion({
			package: '@iconizza-json/mdi-light',
			// tag: 'latest',
		})
	);
})();
