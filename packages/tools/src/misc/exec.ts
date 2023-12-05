import { exec } from 'node:child_process'
import type { ExecOptions } from 'node:child_process'
import { resolve } from 'pathe'

export interface ExecResult {
   stdout: string
   stderr: string
}

/**
 * Exec as Promise
 */
export function execAsync(
   cmd: string,
   options?: ExecOptions,
): Promise<ExecResult> {
   return new Promise((fulfill, reject) => {
      if (typeof options?.cwd === 'string') {
         // Relative directories sometimes do not work, so resolve directory first
         options = {
            ...options,
            cwd: resolve(options.cwd),
         }
      }
      exec(cmd, options, (error, stdout, stderr) => {
         if (error) {
            reject(error)
         }
         else {
            fulfill({
               stdout,
               stderr,
            } as ExecResult)
         }
      })
   })
}
