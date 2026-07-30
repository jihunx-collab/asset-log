import Link from "next/link";
import Image from "next/image";

export default function Nav() {
  return (
    <header className="border-b border-al-divider">
      <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.jpg" alt="Asset Log" width={32} height={32} className="rounded" />
          <span className="font-serif text-sm tracking-wide text-al-silver">ASSET LOG</span>
        </Link>
        <nav className="flex gap-5 font-sans text-xs text-al-label">
          <Link href="/">Home</Link>
          <Link href="/categories">Categories</Link>
          <Link href="/about">About</Link>
        </nav>
      </div>
    </header>
  );
}
