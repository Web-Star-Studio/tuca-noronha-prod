export default function HostingDetailLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return <main className="mt-16">{children}</main>;
  }