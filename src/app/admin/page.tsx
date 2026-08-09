import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RequireRole from "@/components/RequireRole";
import AdminDashboard from "@/components/AdminDashboard";

export default function AdminPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="flex-1">
        <RequireRole role="admin">
          <AdminDashboard />
        </RequireRole>
      </main>
      <Footer />
    </div>
  );
}
