import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import OrderPanel from '../../pages/catalogue/OrderPanel';
import type { AppNotification } from '../../lib/notifications';

export default function MainLayout() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isOrderPanelOpen, setIsOrderPanelOpen] = useState(false);
  const [notification, setNotification] = useState<AppNotification | null>(null);
  const location = useLocation();

  useEffect(() => {
    const handleAppNotification = (event: Event) => {
      const customEvent = event as CustomEvent<AppNotification>;
      if (!customEvent.detail) return;
      setNotification(customEvent.detail);

      window.setTimeout(() => setNotification(null), 4000);
    };

    window.addEventListener('app:notification', handleAppNotification);
    return () => window.removeEventListener('app:notification', handleAppNotification);
  }, []);

  const isCataloguePage = location.pathname.includes('/catalogue');

  const getPageTitle = (pathname: string) => {
    if (pathname.includes('/catalogue')) return 'Catalogue';
    if (pathname.includes('/pregen')) return 'Pregen Rulesets';
    if (pathname.includes('/brands')) return 'Brands';
    if (pathname.includes('/vendors')) return 'Vendors';
    if (pathname.includes('/dimensions')) return 'Dimensions';
    if (pathname.includes('/categories')) return 'Categories';
    if (pathname.includes('/systems')) return 'Systems';
    if (pathname.includes('/modes')) return 'Modes';
    if (pathname.includes('/tags')) return 'Tags';
    if (pathname.includes('/uoms')) return 'UOMs';
    if (pathname.includes('/users')) return 'Users';
    if (pathname.includes('/audit')) return 'Audit Log';
    return 'Dashboard';
  };

  return (
    <div className="app-shell" style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Sidebar isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
      
      {/* Main wrapper positioned absolutely so its width stays static and independent of overlays */}
      <div
        className={`main-wrapper ${isExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: isExpanded ? 'var(--sidebar-width-expanded, 240px)' : 'var(--sidebar-width-collapsed, 64px)',
          right: 0,
          height: '100%',
          transition: 'left 0.2s ease-in-out',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        <Header title={getPageTitle(location.pathname)} />

        <main
          className="content-area"
          style={{
            position: 'relative',
            height: 'calc(100% - var(--header-height, 60px))',
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          <div className="content" style={{ height: '100%', width: '100%', boxSizing: 'border-box' }}>
            <Outlet />
          </div>
          {notification && (
            <div
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                zIndex: 200,
                padding: '12px 16px',
                borderRadius: '10px',
                background:
                  notification.type === 'error'
                    ? 'rgba(248, 113, 113, 0.95)'
                    : notification.type === 'success'
                    ? 'rgba(34, 197, 94, 0.95)'
                    : 'rgba(59, 130, 246, 0.95)',
                color: '#fff',
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
                maxWidth: '320px',
                fontSize: '13px',
                lineHeight: 1.4,
              }}
            >
              {notification.message}
            </div>
          )}
        </main>
      </div>

      {/* Render toggle button and order panel only on the Catalogue page */}
      {isCataloguePage && (
        <>
          {/* Toggle Arrow Button Positioned at the Right Edge */}
          <button
            type="button"
            onClick={() => setIsOrderPanelOpen(!isOrderPanelOpen)}
            style={{
              position: 'absolute',
              right: isOrderPanelOpen ? '320px' : '0px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 100,
              background: 'var(--panel-bg, #fff)',
              border: '1px solid var(--border-color, #cbd5e1)',
              borderRight: 'none',
              borderTopLeftRadius: '6px',
              borderBottomLeftRadius: '6px',
              borderTopRightRadius: '0px',
              borderBottomRightRadius: '0px',
              width: '24px',
              height: '48px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '-2px 0 6px rgba(0,0,0,0.1)',
              fontSize: '12px',
              color: 'var(--muted-color, #64748b)',
              transition: 'right 0.25s ease-in-out',
            }}
            title={isOrderPanelOpen ? 'Close Order Panel' : 'Open Order Panel'}
          >
            {isOrderPanelOpen ? '▶' : '◀'}
          </button>

          {/* Absolutely Positioned Overlay Order Panel */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '320px',
              height: '100%',
              zIndex: 90,
              transform: isOrderPanelOpen ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.25s ease-in-out',
              boxShadow: '-4px 0 12px rgba(0,0,0,0.08)',
              background: 'var(--panel-bg, #ffffff)',
              boxSizing: 'border-box',
              borderLeft: '1px solid var(--border-color, #e2e8f0)',
            }}
          >
            <OrderPanel onClose={() => setIsOrderPanelOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
}