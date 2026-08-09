'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Link as TiptapLink } from '@tiptap/extension-link';
import { Image as TiptapImage } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { Markdown, type MarkdownStorage } from 'tiptap-markdown';

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // result is a data URL ("data:image/png;base64,AAAA...") — strip the prefix.
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

const CATEGORIES = ['기업분석', '대체투자', '부동산', '산업분석', '크립토'];

export interface PostEditorInitialData {
  slug: string;
  title: string;
  date: string;
  category: string;
  tags: string[];
  bodyMarkdown: string;
  sourceLog: string | null;
  status: 'draft' | 'published';
}

interface PostEditorProps {
  mode: 'new' | 'edit';
  initial?: PostEditorInitialData;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

const inputClass =
  'w-full bg-al-navy-dark border border-al-divider rounded px-3 py-2 text-sm text-al-silver placeholder:text-al-muted focus:outline-none focus:border-al-sage';
const labelClass = 'flex flex-col gap-1 text-xs text-al-label';
const toolbarBtn =
  'px-2.5 py-1 rounded text-xs border border-al-divider text-al-label hover:text-al-silver hover:border-al-sage transition-colors';
const toolbarBtnActive = 'text-al-sage border-al-sage';

export default function PostEditor({ mode, initial }: PostEditorProps) {
  const router = useRouter();
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [category, setCategory] = useState(initial?.category ?? CATEGORIES[0]);
  const [tagsInput, setTagsInput] = useState((initial?.tags ?? []).join(', '));
  const [sourceLogOpen, setSourceLogOpen] = useState(Boolean(initial?.sourceLog));
  const [sourceLog, setSourceLog] = useState(initial?.sourceLog ?? '');
  const [status, setStatus] = useState(initial?.status ?? 'draft');
  const [saving, setSaving] = useState<'draft' | 'published' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TiptapLink.configure({ openOnClick: false }),
      TiptapImage,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Markdown,
    ],
    content: initial?.bodyMarkdown ?? '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'prose-content min-h-[320px] rounded border border-al-divider bg-al-navy-dark px-4 py-3 focus:outline-none',
      },
    },
  });

  async function save(nextStatus: 'draft' | 'published') {
    setError(null);
    setMessage(null);

    if (!slug.trim()) {
      setError('영문 슬러그를 입력해주세요.');
      return;
    }
    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }
    if (!editor) return;

    setSaving(nextStatus);
    try {
      const markdownStorage = (editor.storage as unknown as { markdown: MarkdownStorage }).markdown;
      const bodyMarkdown = markdownStorage.getMarkdown();
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          title,
          date,
          category,
          tags,
          bodyMarkdown,
          sourceLog: sourceLogOpen ? sourceLog : null,
          status: nextStatus,
          previousStatus: initial?.status ?? null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? '저장에 실패했습니다.');
      }

      setStatus(nextStatus);
      setMessage(
        nextStatus === 'published'
          ? 'GitHub에 커밋했습니다. Vercel 배포까지 1~2분 정도 걸린 뒤 사이트에 반영됩니다.'
          : '임시저장했습니다. 사이트에는 아직 공개되지 않았습니다.'
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(null);
    }
  }

  async function handleImageSelected(file: File | undefined) {
    if (!file || !editor) return;
    setError(null);

    if (file.size > MAX_IMAGE_BYTES) {
      setError('이미지가 너무 큽니다. 3MB 이하로 줄여서 다시 시도해주세요.');
      return;
    }

    setUploadingImage(true);
    try {
      const base64 = await fileToBase64(file);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, mimeType: file.type, base64 }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? '이미지 업로드에 실패했습니다.');
      }

      const { url } = (await res.json()) as { url: string };
      editor.chain().focus().setImage({ src: url }).run();
    } catch (e) {
      setError(e instanceof Error ? e.message : '이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <label className={labelClass}>
          제목
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="글 제목" />
        </label>

        {mode === 'new' && (
          <label className={labelClass}>
            URL 슬러그 (영문, 예: robinhood-sp500-one-year)
            <input className={inputClass} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="english-slug" />
          </label>
        )}

        <div className="flex gap-3">
          <label className={`${labelClass} flex-1`}>
            날짜
            <input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className={`${labelClass} flex-1`}>
            카테고리
            <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className={labelClass}>
          태그 (쉼표로 구분)
          <input className={inputClass} value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="태그1, 태그2" />
        </label>
      </div>

      {editor && (
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`${toolbarBtn} ${editor.isActive('bold') ? toolbarBtnActive : ''}`}>
            굵게
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`${toolbarBtn} ${editor.isActive('italic') ? toolbarBtnActive : ''}`}>
            기울임
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`${toolbarBtn} ${editor.isActive('heading', { level: 2 }) ? toolbarBtnActive : ''}`}>
            소제목1
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`${toolbarBtn} ${editor.isActive('heading', { level: 3 }) ? toolbarBtnActive : ''}`}>
            소제목2
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`${toolbarBtn} ${editor.isActive('bulletList') ? toolbarBtnActive : ''}`}>
            목록
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`${toolbarBtn} ${editor.isActive('orderedList') ? toolbarBtnActive : ''}`}>
            번호 목록
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`${toolbarBtn} ${editor.isActive('blockquote') ? toolbarBtnActive : ''}`}>
            인용
          </button>
          <button
            type="button"
            className={toolbarBtn}
            onClick={() => {
              const url = window.prompt('링크 URL을 입력하세요');
              if (url) editor.chain().focus().setLink({ href: url }).run();
            }}
          >
            링크
          </button>
          <button
            type="button"
            className={toolbarBtn}
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          >
            표 삽입
          </button>
          <button
            type="button"
            className={toolbarBtn}
            disabled={uploadingImage}
            onClick={() => imageInputRef.current?.click()}
          >
            {uploadingImage ? '업로드 중...' : '사진 삽입'}
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            className="hidden"
            onChange={(e) => handleImageSelected(e.target.files?.[0])}
          />
        </div>
      )}

      <EditorContent editor={editor} />

      <div className="flex flex-col gap-2 border-t border-al-divider pt-4">
        <label className="flex items-center gap-2 text-xs text-al-label">
          <input type="checkbox" checked={sourceLogOpen} onChange={(e) => setSourceLogOpen(e.target.checked)} />
          출처 확인 로그 포함
        </label>
        {sourceLogOpen && (
          <textarea
            className={`${inputClass} font-mono`}
            value={sourceLog}
            onChange={(e) => setSourceLog(e.target.value)}
            placeholder={'- 주장: ...\n  - 재확인 방법: ... / 결과: [1차]/[2차]/삭제됨/unknown'}
            rows={8}
          />
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={saving !== null}
          onClick={() => save('draft')}
          className="px-4 py-2 rounded border border-al-divider text-sm text-al-silver hover:border-al-sage transition-colors disabled:opacity-50"
        >
          {saving === 'draft' ? '임시저장 중...' : '임시저장'}
        </button>
        <button
          type="button"
          disabled={saving !== null}
          onClick={() => save('published')}
          className="px-4 py-2 rounded bg-al-sage text-al-navy-dark text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving === 'published' ? '발행 중...' : '발행하기'}
        </button>
        {status === 'published' && <span className="text-xs text-al-label">현재 공개된 글입니다</span>}
      </div>

      {message && <p className="text-xs text-al-sage">{message}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
