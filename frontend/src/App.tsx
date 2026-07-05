import LoginPage from "@/pages/Login";
import RegisterPage from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";

export default function App() {
  const path = window.location.pathname;
  const token = localStorage.getItem("token");

  if (path === "/register") return <RegisterPage />;
  if (path === "/dashboard") {
    if (!token) {
      window.location.href = "/";
      return null;
    }
    return <Dashboard />;
  }
  return <LoginPage />;
}
