import { NavLink } from 'react-router-dom';

export default function LeftNavbar() {
  return (
    <aside className="leftbar" aria-label="Primary navigation">
      <NavLink
        to="/dashboard"
        className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        title="Home"
      >
        H
      </NavLink>
      <NavLink
        to="/users"
        className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        title="Users"
      >
        U
      </NavLink>
      <NavLink
        to="/attributes"
        className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        title="Attributes"
      >
        A
      </NavLink>
      <button className="nav-item" type="button" title="Projects" disabled aria-disabled="true">
        P
      </button>
      <button className="nav-item" type="button" title="Roles" disabled aria-disabled="true">
        R
      </button>
      <button className="nav-item" type="button" title="Utility" disabled aria-disabled="true">
        S
      </button>
    </aside>
  );
}
