import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const dataDir = path.join(projectRoot, 'public', 'data')
const dailyDir = path.join(dataDir, 'daily')
const manifestPath = path.join(dataDir, 'manifest.json')
const retentionDays = 7
const dateFilePattern = /^\d{4}-\d{2}-\d{2}\.json$/

async function main() {
  const entries = await fs.readdir(dailyDir)
  const datedFiles = entries
    .filter((entry) => dateFilePattern.test(entry))
    .sort((left, right) => right.localeCompare(left))

  const keepFiles = datedFiles.slice(0, retentionDays)
  const dropFiles = datedFiles.slice(retentionDays)

  await Promise.all(
    dropFiles.map((fileName) => fs.rm(path.join(dailyDir, fileName), { force: true })),
  )

  const availableDates = keepFiles.map((fileName) => fileName.replace(/\.json$/, ''))
  const manifest = {
    retentionDays,
    latestDate: availableDates[0] ?? '',
    availableDates,
  }

  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

  process.stdout.write(
    JSON.stringify(
      {
        retained: keepFiles,
        removed: dropFiles,
        manifest,
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
