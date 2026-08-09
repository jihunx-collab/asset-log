import ThemeToggle from "./ThemeToggle";

export default function Footer() {
  return (
    <footer className="border-t border-al-divider bg-al-navy-dark">
      <div className="max-w-2xl mx-auto px-6 py-5 flex items-center justify-between gap-4 font-sans text-[11px] text-al-muted">
        <span>본 글은 투자 권유가 아닌 개인 학습 목적의 분석입니다.</span>
        <ThemeToggle />
      </div>
    </footer>
  );
}
