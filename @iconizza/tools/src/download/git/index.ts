import {
	ExportTargetOptions,
	prepareDirectoryForExport,
} from '../../export/helpers/prepare';
import { execAsync } from '../../misc/exec';
import type { DocumentNotModified } from '../types/modified';
import type { DownloadSourceMixin } from '../types/sources';
import { getGitRepoBranch } from './branch';
import { getGitRepoHash } from './hash';
import { resetGitRepoContents } from './reset';

interface IfModifiedSinceOption {
	// Download only if it was modified since hash
	// If true, checked against file stored in target directory

	// Important: this function doesn't verify if target directory has correct branch,
	// so do not use the same target directory for different repos or branches.
	ifModifiedSince: string | true | DownloadGitRepoResult;
}

/**
 * Options for downloadGitRepo()
 */
export interface DownloadGitRepoOptions
	extends ExportTargetOptions,
		Partial<IfModifiedSinceOption> {
	// Repository
	remote: string;

	// Branch
	branch: string;

	// Log commands
	log?: boolean;
}

/**
 * Result
 */
export interface DownloadGitRepoResult extends DownloadSourceMixin<'git'> {
	contentsDir: string;
	hash: string;
}

/**
 * Download Git repo
 */
export async function downloadGitRepo<
	T extends IfModifiedSinceOption & DownloadGitRepoOptions
>(options: T): Promise<DownloadGitRepoResult | DocumentNotModified>;
export async function downloadGitRepo(
	options: DownloadGitRepoOptions
): Promise<DownloadGitRepoResult>;
export async function downloadGitRepo(
	options: DownloadGitRepoOptions
): Promise<DownloadGitRepoResult | DocumentNotModified> {
	const { remote, branch } = options;

	// Check for last commit
	const hasHashInTarget = options.target.indexOf('{hash}') !== -1;
	const ifModifiedSince = options.ifModifiedSince;
	if (ifModifiedSince || hasHashInTarget) {
		// Get actual hash
		const result = await execAsync(
			`git ls-remote ${remote} --branch ${branch}`
		);
		const parts = result.stdout.split(/\s/);
		const latestHash = parts.shift() as string;
		if (hasHashInTarget) {
			options.target = options.target.replace('{hash}', latestHash);
		}

		try {
			// Make sure correct branch is checked out. This will throw error if branch is not available
			await getGitRepoBranch(options, branch);

			if (ifModifiedSince) {
				// Get expected hash
				const expectedHash: string | null =
					ifModifiedSince === true
						? await getGitRepoHash(options)
						: typeof ifModifiedSince === 'string'
						? ifModifiedSince
						: ifModifiedSince.downloadType === 'git'
						? ifModifiedSince.hash
						: null;

				if (latestHash === expectedHash) {
					// Reset contents before returning
					await resetGitRepoContents(options.target);
					return 'not_modified';
				}
			}
		} catch {
			//
		}
	}

	// Prepare target directory
	const target = (options.target = await prepareDirectoryForExport({
		...options,
		// Always cleanup
		cleanup: true,
	}));

	// Clone repository
	if (options.log) {
		console.log(`Cloning ${remote}#${branch} to ${target}`);
	}
	await execAsync(
		`git clone --branch ${branch} --no-tags --depth 1 ${remote} "${target}"`
	);

	// Get latest hash and make sure correct branch is available
	const hash = await getGitRepoHash(options);
	await getGitRepoBranch(options, branch);

	return {
		downloadType: 'git',
		contentsDir: target,
		hash,
	};
}
