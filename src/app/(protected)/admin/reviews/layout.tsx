export const metadata = {
  title: "Gerenciamento de Reviews - Admin",
  description: "Visualize e modere todas as avaliações do sistema"
};

export default function ReviewsAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      {children}
    </div>
  );
} 