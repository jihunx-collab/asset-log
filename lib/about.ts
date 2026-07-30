import fs from "node:fs";
import path from "node:path";
import { remark } from "remark";
import html from "remark-html";

const ABOUT_PATH = path.join(process.cwd(), "content", "about.md");

export async function getAboutContent(): Promise<string> {
  const raw = fs.readFileSync(ABOUT_PATH, "utf-8");
  const processed = await remark().use(html).process(raw);
  return processed.toString();
}
