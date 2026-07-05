import LoginPage from "@/pages/Login";
import RegisterPage from "@/pages/Register";

export default function App() {
  const path = window.location.pathname;

  if (path === "/register") return <RegisterPage />;
  return <LoginPage />;
}
