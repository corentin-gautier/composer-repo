// Writes packages.json: every tagged version of the repos in repos.json, as GitHub tag archives.
// No GitHub API (no token, no rate limit): tags come from `git ls-remote`, composer.json from raw.githubusercontent.com.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const repos = JSON.parse(fs.readFileSync(path.join(root, 'repos.json'), 'utf8'));

// Annotated tags list the tag object, then the commit as `<tag>^{}`: the commit wins
const tags = repo => {
  const refs = {};
  execFileSync('git', ['ls-remote', '--tags', `https://github.com/${repo}.git`], { encoding: 'utf8' })
    .trim().split('\n').filter(Boolean).forEach(line => {
      const [sha, ref] = line.split('\t');
      const tag = ref.replace('refs/tags/', '');
      if (tag.endsWith('^{}')) refs[tag.slice(0, -3)] = sha;
      else refs[tag] ??= sha;
    });
  return Object.entries(refs).filter(([tag]) => /^v?\d+\.\d+\.\d+$/.test(tag)).map(([tag, sha]) => ({ tag, sha }));
};

(async () => {
  const packages = {};
  for (const repo of repos) {
    // Only the package name the repo uses today: tags from before a rename are left out
    const { name } = await (await fetch(`https://raw.githubusercontent.com/${repo}/HEAD/composer.json`)).json();
    for (const { sha, tag } of tags(repo)) {
      const res = await fetch(`https://raw.githubusercontent.com/${repo}/${sha}/composer.json`);
      if (!res.ok) continue;
      const json = await res.json();
      if (json.name !== name) continue;
      const version = tag.replace(/^v/, '');
      packages[json.name] ??= {};
      packages[json.name][version] = {
        ...json,
        version,
        dist: { type: 'zip', url: `https://github.com/${repo}/archive/${sha}.zip`, reference: sha },
        source: { type: 'git', url: `https://github.com/${repo}.git`, reference: sha },
      };
    }
    console.log(`${repo}: done`);
  }
  fs.writeFileSync(path.join(root, 'packages.json'), JSON.stringify({ packages }, null, 2) + '\n');
})();
