import { Octokit } from '@octokit/rest';

function getClient(): Octokit {
  const token = process.env.GH_TOKEN;
  if (!token) {
    throw new Error('GH_TOKEN 환경변수가 설정되지 않았습니다.');
  }
  return new Octokit({ auth: token });
}

function getRepo(): { owner: string; repo: string } {
  const repoEnv = process.env.GH_REPO;
  if (!repoEnv || !repoEnv.includes('/')) {
    throw new Error('GH_REPO 환경변수가 "owner/repo" 형식으로 설정되지 않았습니다.');
  }
  const [owner, repo] = repoEnv.split('/');
  return { owner, repo };
}

export async function getFile(
  path: string
): Promise<{ content: string; sha: string } | null> {
  const octokit = getClient();
  const { owner, repo } = getRepo();
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    if (Array.isArray(data) || data.type !== 'file' || !data.content) {
      return null;
    }
    return {
      content: Buffer.from(data.content, 'base64').toString('utf-8'),
      sha: data.sha,
    };
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 404) {
      return null;
    }
    throw err;
  }
}

export async function putFile(
  path: string,
  content: string,
  message: string
): Promise<void> {
  const octokit = getClient();
  const { owner, repo } = getRepo();
  const existing = await getFile(path);
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: Buffer.from(content, 'utf-8').toString('base64'),
    sha: existing?.sha,
  });
}

/**
 * Same as putFile but takes content that is already base64-encoded, so
 * binary files (images) round-trip without going through a UTF-8 buffer
 * that would corrupt them.
 */
export async function putBinaryFile(
  path: string,
  base64Content: string,
  message: string
): Promise<void> {
  const octokit = getClient();
  const { owner, repo } = getRepo();
  const existing = await getFile(path);
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: base64Content,
    sha: existing?.sha,
  });
}

export async function deleteFile(path: string, message: string): Promise<void> {
  const octokit = getClient();
  const { owner, repo } = getRepo();
  const existing = await getFile(path);
  if (!existing) {
    return;
  }
  await octokit.repos.deleteFile({
    owner,
    repo,
    path,
    message,
    sha: existing.sha,
  });
}
