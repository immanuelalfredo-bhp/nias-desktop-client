import { useState } from 'react';
import { NavLink } from 'react-router-dom';

interface SidebarProps {
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}

export default function Sidebar({ isExpanded, setIsExpanded }: SidebarProps) {
  const [isAttributesOpen, setIsAttributesOpen] = useState(false);

  return (
    <aside className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <nav className="sidebar-nav">
        {/* WORKFLOW */}
        <div className="nav-group">
          {isExpanded && <span className="nav-label">Workflow</span>}
          <NavLink to="/catalogue" className="nav-item" title="Catalogue">
            <span className="icon">📦</span>
            {isExpanded && <span className="text">Catalogue</span>}
          </NavLink>
        </div>

        <div className="nav-group-divider" />

        {/* ENTITIES & SUBPAGES */}
        <div className="nav-group">
          {isExpanded && <span className="nav-label">Definitions</span>}

          <NavLink to="/pregen" className="nav-item" title="Pregen Rulesets">
            <span className="icon">⚡</span>
            {isExpanded && <span className="text">Pregen Rulesets</span>}
          </NavLink>

          <div className="nav-parent-wrapper">
            <button
              className={`nav-item parent-item ${isAttributesOpen ? 'open' : ''}`}
              onClick={() => setIsAttributesOpen(!isAttributesOpen)}
              title="Attributes"
            >
              <span className="icon">🏷️</span>
              {isExpanded && (
                <>
                  <span className="text">Attributes</span>
                  <span className="chevron">{isAttributesOpen ? '▲' : '▼'}</span>
                </>
              )}
            </button>

            {isExpanded && isAttributesOpen && (
              <div className="sub-nav">
                <NavLink to="/brands" className="sub-nav-item">
                  Brands
                </NavLink>
                <NavLink to="/vendors" className="sub-nav-item">
                  Vendors
                </NavLink>
                <NavLink to="/dimensions" className="sub-nav-item">
                  Dimensions
                </NavLink>
                <NavLink to="/categories" className="sub-nav-item">
                  Categories
                </NavLink>
                <NavLink to="/systems" className="sub-nav-item">
                  Systems
                </NavLink>
                <NavLink to="/modes" className="sub-nav-item">
                  Modes
                </NavLink>
                <NavLink to="/tags" className="sub-nav-item">
                  Tags
                </NavLink>
                <NavLink to="/uoms" className="sub-nav-item">
                  UoMs
                </NavLink>
              </div>
            )}
          </div>
        </div>

        <div className="nav-group-divider" />

        {/* SYSTEM */}
        <div className="nav-group">
          {isExpanded && <span className="nav-label">System</span>}
          <NavLink to="/users" className="nav-item" title="Users">
            <span className="icon">👥</span>
            {isExpanded && <span className="text">Users</span>}
          </NavLink>
          <NavLink to="/audit" className="nav-item" title="Audit Log">
            <span className="icon">📋</span>
            {isExpanded && <span className="text">Audit Log</span>}
          </NavLink>
        </div>
      </nav>

      <button
        className="sidebar-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        title={isExpanded ? 'Collapse Sidebar' : 'Expand Sidebar'}
      >
        {isExpanded ? '◀' : '▶'}
      </button>
    </aside>
  );
}
