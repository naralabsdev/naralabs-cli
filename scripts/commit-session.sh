#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

commit() {
  git add "$@"
  if git diff --cached --quiet; then
    echo "skip (empty): $MSG"
    return 0
  fi
  git commit -m "$MSG"
}

MSG='docs: update CLI README for auth and schema workflows' && commit README.md
MSG='chore: update CLI package metadata and dependencies' && commit package.json package-lock.json
MSG='feat(cli): add auth helper for Atlas tokens' && commit src/lib/auth.ts src/lib/auth.test.ts
MSG='feat(cli): add interactive prompt utilities' && commit src/lib/prompt.ts
MSG='feat(cli): add schema template generator' && commit src/lib/schema-template.ts
MSG='feat(cli): add schema init workflow helpers' && commit src/lib/schema-init.ts
MSG='feat(cli): add schema IO read write helpers' && commit src/lib/schema-io.ts
MSG='feat(cli): extend schema generate command' && commit src/lib/schema-generate.ts
MSG='feat(cli): extend API client for registry endpoints' && commit src/lib/api.ts src/lib/config.ts
MSG='feat(cli): wire auth schema init and publish commands' && commit src/index.ts
MSG='test(cli): add CLI integration test suite' && commit test/

echo "CLI commits in session done"
