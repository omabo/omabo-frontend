import "@/app/globals.css";

export default function AdminConsoleLayout({ children }: { children: React.ReactNode }) {
  // Deliberately dark-themed (shadcn's existing `.dark` tokens in globals.css)
  // so this platform-operator surface is visually unmistakable from the
  // warm tenant-admin theme — nobody should confuse the two.
  return (
    <html lang="ja" className="dark">
      <body className="bg-background text-foreground">{children}</body>
    </html>
  );
}
