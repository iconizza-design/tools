import { downloadGitLabRepo } from '@iconizza/tools';

// GITLAB_TOKEN=qwertyuiop node example.js
const token = process.env.GITLAB_TOKEN || '';

(async () => {
	console.log(
		await downloadGitLabRepo({
			target: 'downloads/eos-icons',
			project: '4600360',
			branch: 'master',
			token,
		})
	);
})();
