interface AppHeaderProps {
  email: string;
  onSettingsClick: () => void;
  onLogoutClick: () => void;
}

export default function AppHeader({
  email,
  onSettingsClick,
  onLogoutClick,
}: AppHeaderProps) {
  return (
    <header className="topbar">
      <div className="topbar-logo">NIAS</div>
      <div className="topbar-actions">
        <span id="profileLabel" className="profile">
          {email}
        </span>
        <button className="secondary" type="button" onClick={onSettingsClick}>
          Settings
        </button>
        <button id="logoutBtn" className="danger" type="button" onClick={onLogoutClick}>
          Logout
        </button>
      </div>
    </header>
  );
}
