import { useEffect, useState, useRef } from 'react';
import CreateItemModal from './CreateItemModal';
import SystemVariantModal from './SystemVariantModal';
import UserVariantModal from './UserVariantModal';

type SyncFilter = 'all' | 'synced' | 'unsynced';
type StatusTab = 'active' | 'deleted';

export default function ItemsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSystemModal, setShowSystemModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedItemToEdit, setSelectedItemToEdit] = useState<any | null>(null);
  const [selectedSystemItem, setSelectedSystemItem] = useState<any | null>(null);
  const [selectedUserItem, setSelectedUserItem] = useState<any | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [syncFilter, setSyncFilter] = useState<SyncFilter>('all');
  const [statusTab, setStatusTab] = useState<StatusTab>('active');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const fetchItems = async () => {
    try {
      setIsBusy(true);
      const response =
        statusTab === 'active'
          ? await window.electronAPI.itemListCatalogue(true)
          : await window.electronAPI.itemListCatalogue(false);

      if (response.success) {
        setItems(response.data || []);
      } else {
        console.error(`Failed to fetch ${statusTab} items:`, response.message);
      }
    } catch (error) {
      console.error(`Error fetching ${statusTab} items:`, error);
    } finally {
      setIsBusy(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [statusTab]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredItems = items.filter((item) => {
    const queryTerms = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);

    if (queryTerms.length === 0) {
      if (syncFilter === 'synced') return item.isSynced;
      if (syncFilter === 'unsynced') return !item.isSynced;
      return true;
    }

    const matchesSearch = queryTerms.every((term) => {
      const matchesBaseName = item.baseName?.toLowerCase().includes(term);
      const matchesDisplayName = item.displayName?.toLowerCase().includes(term);
      const matchesSku = item.skuCode?.toLowerCase().includes(term);
      const matchesSkuSource = item.skuSource?.toLowerCase().includes(term);
      const matchesMaterialType = item.materialType?.toLowerCase().includes(term);
      const matchesMaterialClass = item.materialClass?.toLowerCase().includes(term);
      const matchesAlias = item.alias?.toLowerCase().includes(term);
      const matchesBrand = item.brand?.toLowerCase().includes(term);
      const matchesSystem = item.system?.toLowerCase().includes(term);
      const matchesCategory = item.category?.toLowerCase().includes(term);
      const matchesTag = item.tag?.toLowerCase().includes(term);
      return (
        matchesBaseName ||
        matchesDisplayName ||
        matchesSku ||
        matchesSkuSource ||
        matchesMaterialType ||
        matchesMaterialClass ||
        matchesAlias ||
        matchesBrand ||
        matchesSystem ||
        matchesCategory ||
        matchesTag
      );
    });

    if (syncFilter === 'synced') return matchesSearch && item.isSynced;
    if (syncFilter === 'unsynced') return matchesSearch && !item.isSynced;
    return matchesSearch;
  });

  const displayedItems = filteredItems.slice(0, 100);

  const totalCount = items.length;
  const syncedCount = items.filter((b) => b.isSynced).length;
  const notSyncedCount = totalCount - syncedCount;

  // --- Modal Launchers ---
  const handleOpenCreateModal = () => {
    setSelectedItemToEdit(null);
    setShowModal(true);
  };

  const handleItemClick = (item: any) => {
    // Reset all modal states first to ensure clean isolation
    setShowModal(false);
    setShowSystemModal(false);
    setShowUserModal(false);

    if (item.creationSource === 'system') {
      setSelectedSystemItem(item);
      setShowSystemModal(true);
    } else if (item.creationSource === 'user') {
      setSelectedUserItem(item);
      setShowUserModal(true);
    } else {
      setSelectedItemToEdit(item);
      setShowModal(true);
    }
  };

  const handleModalSuccess = (message: string) => {
    console.log(message);
    fetchItems();
  };

  if (isBusy && items.length === 0) {
    return (
      <section id="itemsScreen" className="card panel app-screen">
        <h2>Items</h2>
        <p className="muted">Loading items...</p>
      </section>
    );
  }

  return (
    <section id="itemsScreen" className="card panel app-screen">
      <style>{`
        .item-card {
          background: var(--panel-bg, #ffffff);
          border: 1px solid var(--border-color, #e2e8f0);
          transition: all 0.15s ease-in-out;
        }
        .item-card.manual-item {
          background: var(--card-manual-bg, #f8fafc);
          border-color: var(--card-manual-border, #cbd5e1);
        }
        .item-card:hover {
          border-color: var(--primary, #3b82f6);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
          transform: translateY(-1px);
        }
        .item-card:active {
          background: var(--card-active-bg, #f1f5f9);
          transform: translateY(0);
        }
      `}</style>

      {/* Consolidated Single-Row Controls Bar */}
      <div
        className="definition-controls-row"
        style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}
      >
        <div
          ref={searchContainerRef}
          className="search-pill-container"
          onClick={() => {
            const editable = searchContainerRef.current?.querySelector('[contenteditable]');
            (editable as HTMLElement)?.focus();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0 10px',
            background: 'var(--panel-bg, #fff)',
            border: 'var(--input-border, 1px solid var(--border-color, #e2e8f0))',
            borderRadius: 'var(--radius, 8px)',
            overflowX: 'auto',
            overflowY: 'hidden',
            whiteSpace: 'nowrap',
            flex: '1',
            minWidth: '220px',
            cursor: 'text',
            height: '38px',
            boxSizing: 'border-box',
          }}
        >
          <style>{`
            .search-pill-container::-webkit-scrollbar {
              display: none !important;
              width: 0px !important;
              height: 0px !important;
            }
          `}</style>

          {statusTab === 'deleted' && (
            <span
              className="inline-filter-pill"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                background: 'var(--danger-subtle, #fee2e2)',
                color: 'var(--danger, #991b1b)',
                height: '26px',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 500,
                flexShrink: 0,
              }}
            >
              Status: Deleted
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setStatusTab('active');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: 'inherit',
                  padding: 0,
                }}
              >
                ×
              </button>
            </span>
          )}

          {syncFilter !== 'all' && (
            <span
              className="inline-filter-pill"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                background: 'var(--primary-subtle, #e0e7ff)',
                color: 'var(--primary-dark, #3730a3)',
                padding: '2px 6px',
                height: '26px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 500,
                flexShrink: 0,
              }}
            >
              Sync: {syncFilter === 'synced' ? 'Synced' : 'Not Synced'}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSyncFilter('all');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: 'inherit',
                  padding: 0,
                }}
              >
                ×
              </button>
            </span>
          )}

          <div
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => setSearchQuery(e.currentTarget.textContent || '')}
            style={{
              outline: 'none',
              background: 'transparent',
              fontSize: '14px',
              color: 'inherit',
              minWidth: '100px',
              flexShrink: 0,
              display: 'inline-block',
            }}
          />
        </div>

        <div
          className="right-controls-group"
          style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          <div
            className="sync-dropdown-container"
            ref={dropdownRef}
            style={{ position: 'relative' }}
          >
            <button
              type="button"
              className="secondary dropdown-chip-btn"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span>Filters</span>
              <span className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}>▼</span>
            </button>

            {isDropdownOpen && (
              <div className="dropdown-menu" style={{ minWidth: '180px', padding: '8px' }}>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    padding: '4px 8px',
                    color: 'var(--muted-color, #888)',
                  }}
                >
                  Status
                </div>
                <button
                  type="button"
                  className={`dropdown-item ${statusTab === 'active' ? 'selected' : ''}`}
                  onClick={() => setStatusTab('active')}
                  style={{ width: '100%', textAlign: 'left' }}
                >
                  Active Items
                </button>
                <button
                  type="button"
                  className={`dropdown-item ${statusTab === 'deleted' ? 'selected' : ''}`}
                  onClick={() => setStatusTab('deleted')}
                  style={{ width: '100%', textAlign: 'left' }}
                >
                  Deleted Items
                </button>

                <div
                  style={{
                    margin: '6px 0',
                    height: '1px',
                    background: 'var(--border-color, #ddd)',
                  }}
                />

                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    padding: '4px 8px',
                    color: 'var(--muted-color, #888)',
                  }}
                >
                  Sync Status
                </div>
                <button
                  type="button"
                  className={`dropdown-item ${syncFilter === 'all' ? 'selected' : ''}`}
                  onClick={() => setSyncFilter('all')}
                  style={{ width: '100%', textAlign: 'left' }}
                >
                  All Sync States
                </button>
                <button
                  type="button"
                  className={`dropdown-item ${syncFilter === 'synced' ? 'selected' : ''}`}
                  onClick={() => setSyncFilter('synced')}
                  style={{ width: '100%', textAlign: 'left' }}
                >
                  Synced Only
                </button>
                <button
                  type="button"
                  className={`dropdown-item ${syncFilter === 'unsynced' ? 'selected' : ''}`}
                  onClick={() => setSyncFilter('unsynced')}
                  style={{ width: '100%', textAlign: 'left' }}
                >
                  Not Synced Only
                </button>
              </div>
            )}
          </div>

          <button className="primary" onClick={handleOpenCreateModal}>
            Create New Item
          </button>
        </div>
      </div>

      <div className="spacer" />
      <div className="divider" />
      <div className="spacer" />

      {/* Items Compact Grid View */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '10px',
        }}
      >
        {displayedItems.length > 0 ? (
          displayedItems.map((item) => {
            const isManual = item.creationSource === 'user';
            const isExternal = item.skuSource === 'external';

            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`item-card ${isManual ? 'manual-item' : ''}`}
                style={{
                  borderRadius: 'var(--radius, 6px)',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                }}
              >
                {/* 1:1 Image Container */}
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    background: 'var(--surface-subtle, #f1f5f9)',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.displayName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span className="muted" style={{ fontSize: '10px' }}>
                      No Image
                    </span>
                  )}
                </div>

                {/* Sub-header info: Part number or EXTERNAL */}
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    color: isExternal ? 'var(--warning, #d97706)' : 'var(--muted-color, #64748b)',
                    lineHeight: '1.2',
                  }}
                >
                  {isExternal ? 'EXTERNAL' : item.skuCode || '—'}
                </div>

                {/* Display Name */}
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'inherit',
                    wordBreak: 'break-word',
                    lineHeight: '1.3',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {item.displayName || 'Untitled Item'}
                </div>
              </div>
            );
          })
        ) : (
          <div
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '24px',
            }}
            className="muted"
          >
            {searchQuery || syncFilter !== 'all'
              ? `No matching ${statusTab} items found.`
              : `No ${statusTab} items found.`}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
        <span className="muted" style={{ fontSize: '13px' }}>
          {totalCount} {statusTab} items out of {syncedCount} synced | {notSyncedCount} not synced
        </span>
      </div>

      {/* Item Creation Workspace Modal */}
      <CreateItemModal
        isOpen={showModal}
        initialData={selectedItemToEdit}
        onClose={() => setShowModal(false)}
        onSuccess={handleModalSuccess}
      />

      {/* System Variant Modal */}
      <SystemVariantModal
        isOpen={showSystemModal}
        initialData={selectedSystemItem}
        onClose={() => setShowSystemModal(false)}
        onSuccess={handleModalSuccess}
        onAdd={(item) => {
          setSelectedSystemItem(null);
          setSelectedUserItem(item);
          setShowUserModal(true);
        }}
        onEdit={(item) => {
          setSelectedSystemItem(null);
          setSelectedItemToEdit(item);
          setShowModal(true);
        }}
      />

      {/* User Variant Modal */}
      <UserVariantModal
        isOpen={showUserModal}
        initialData={selectedUserItem}
        onClose={() => setShowUserModal(false)}
        onSuccess={handleModalSuccess}
        onEdit={(item) => {
          setSelectedSystemItem(null);
          setSelectedItemToEdit(item);
          setShowModal(true);
        }}
      />
    </section>
  );
}