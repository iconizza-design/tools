import { sendAPIQuery } from '../api'
import type { GitLabAPIOptions } from './types'
import { defaultGitLabBaseURI } from './types'

/**
 * Get latest hash from GitHub using API
 */
export async function getGitLabRepoHash(
   options: GitLabAPIOptions,
): Promise<string> {
   const uri = `${options.uri || defaultGitLabBaseURI}/${
      options.project
   }/repository/branches/${options.branch}/`
   const data = await sendAPIQuery({
      uri,
      headers: {
         Authorization: `token ${options.token}`,
      },
   })
   if (typeof data !== 'string')
      throw new Error(`Error downloading data from GitLab API: ${data}`)

   interface GitLabAPIResponse {
      name: string
      commit: {
         id: string
      }
   }
   const content = JSON.parse(data) as GitLabAPIResponse | GitLabAPIResponse[]
   const item = (Array.isArray(content) ? content : [content]).find(
      item =>
         item.name === options.branch && typeof item.commit.id === 'string',
   )
   if (!item)
      throw new Error('Error parsing GitLab API response')

   return item.commit.id
}
