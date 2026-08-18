import Header from "@/components/layout/public/header";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <Header />
      <main className="min-h-[calc(100vh-4rem)] w-full mt-16">{children}</main>
      <footer className="w-full bg-primary py-8">Footer</footer>
    </div>
  );
}
