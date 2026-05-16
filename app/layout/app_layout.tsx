import { Outlet } from "react-router";
import { Link } from "react-router";

export default function NavBarLayout() {
  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="features">Features</Link>
      <Link to="study-way">The Study Way</Link>
      <Link to="/universities">Universities</Link>
      <Link to="/auth/login">Login</Link>
      <Link to="/auth/register">Register</Link>
      <Outlet />
    </nav>
  );
}
