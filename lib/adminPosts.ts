import fs from 'node:fs';
import path from 'node:path';
import { parsePostRaw } from './posts';
import { splitSourceLog } from './postFile';

export interface EditablePost {
  title: string;
  date: string;
  category: string;
  tags: string[];
  bodyMarkdown: string;
  sourceLog: string | null;
  status: 'draft' | 'published';
}

/**
 * Loads a post (draft or published) from the local checkout for the admin
 * editor to pre-fill. Drafts take precedence — if a slug exists in both
 * (mid-edit of an already-published post that was re-saved as a draft),
 * the draft is treated as the latest version.
 */
export function loadEditablePost(slug: string): EditablePost | null {
  const draftPath = path.join(process.cwd(), 'content', 'drafts', `${slug}.md`);
  const postPath = path.join(process.cwd(), 'content', 'posts', `${slug}.md`);

  let filePath: string | null = null;
  let status: 'draft' | 'published' = 'draft';

  if (fs.existsSync(draftPath)) {
    filePath = draftPath;
    status = 'draft';
  } else if (fs.existsSync(postPath)) {
    filePath = postPath;
    status = 'published';
  }

  if (!filePath) {
    return null;
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const meta = parsePostRaw(raw, slug);
  const { body, sourceLog } = splitSourceLog(meta.body);

  return {
    title: meta.title,
    date: meta.date,
    category: meta.category,
    tags: meta.tags,
    bodyMarkdown: body,
    sourceLog,
    status,
  };
}
