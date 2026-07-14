import { spawnSync } from 'node:child_process'

const commitDate = process.argv[2]

if (!commitDate) {
  console.error('Usage: npm run publish:daily -- YYYY-MM-DD')
  process.exit(1)
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: false,
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

run('npm', ['run', 'retain:data'])
run('npm', ['run', 'build'])
run('git', ['add', '.'])

const diffResult = spawnSync('git', ['diff', '--cached', '--quiet'], {
  stdio: 'inherit',
  shell: false,
})

if (diffResult.status === 0) {
  console.log(`No staged changes to publish for ${commitDate}.`)
  process.exit(0)
}

run('git', ['commit', '-m', `Daily report ${commitDate}`])
run('git', ['push', 'origin', 'main'])
