import { useEffect, useState, useRef } from 'react';
import type { attribute } from '@nias/shared';
import UomModal from './UomModal';

type SyncFilter = 'all' | 'synced' | 'unsynced';
type StatusTab = 'active' | 'deleted';

export default function UomsPage() {
  const [uoms, setUoms] = useState<attribute.Uom[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [uomToEdit, setUomToEdit] = useState<attribute.Uom | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [syncFilter, setSyncFilter] = useState<SyncFilter>('all');
  const [statusTab, setStatusTab] = useState<StatusTab>('active');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUoms = async () => {
    try {
      setIsBusy(true);
      const response =
        statusTab === 'active'
          ? await window.electronAPI.uomListActive()
          : await window.electronAPI.uomListDeleted();

      if (response.success) {
        setUoms(response.data || []);
      } else {
        console.error(`Failed to fetch ${statusTab} uoms:`, response.message);
      }
    } catch (error) {
      console.error(`Error fetching ${statusTab} uoms:`, error);
    } finally {
      setIsBusy(false);
    }
  };

  useEffect(() => {
    fetchUoms();
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

  const filteredUoms = uoms.filter((uom) => {
    const queryTerms = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);

    if (queryTerms.length === 0) {
      if (syncFilter === 'synced') return uom.isSynced;
      if (syncFilter === 'unsynced') return !uom.isSynced;
      return true;
    }

    // Every search term must match AT LEAST ONE field (name or tags)
    const matchesSearch = queryTerms.every((term) => {
      const matchesName = uom.name.toLowerCase().includes(term);
      const matchesSymbol = uom.symbol.toLowerCase().includes(term);

      return matchesName || matchesSymbol;
    });

    if (syncFilter === 'synced') return matchesSearch && uom.isSynced;
    if (syncFilter === 'unsynced') return matchesSearch && !uom.isSynced;
    return matchesSearch;
  });

  // Truncate to 100 entries
  const displayedUoms = filteredUoms.slice(0, 100);

  // Calculate sync counts for the footer summary
  const totalCount = uoms.length;
  const syncedCount = uoms.filter((b) => b.isSynced).length;
  const notSyncedCount = totalCount - syncedCount;

  const getSyncLabel = (filter: SyncFilter) => {
    switch (filter) {
      case 'synced':
        return 'Synced';
      case 'unsynced':
        return 'Not Synced';
      default:
        return 'All';
    }
  };

  const handleOpenCreateModal = () => {
    setUomToEdit(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (uom: attribute.Uom) => {
    setUomToEdit(uom);
    setShowModal(true);
  };

  const handleDeleteUom = async (id: string) => {
    try {
      const result = await window.electronAPI.uomDelete(id);
      if (result.success) {
        fetchUoms();
      } else {
        console.error(`Failed to delete uom:`, result.message);
      }
    } catch (error) {
      console.error(`Error deleting uom:`, error);
    }
  };

  const handleRestoreUom = async (id: string) => {
    try {
      const result = await window.electronAPI.uomRestore(id);
      if (result.success) {
        fetchUoms();
      } else {
        console.error(`Failed to restore uom:`, result.message);
      }
    } catch (error) {
      console.error(`Error restoring uom:`, error);
    }
  };

  const handleModalSuccess = (message: string) => {
    console.log(message);
    fetchUoms();
  };

  if (isBusy && uoms.length === 0) {
    return (
      <section id="uomsScreen" className="card panel app-screen">
        <h2>UOMs</h2>
        <p className="muted">Loading UOMs...</p>
      </section>
    );
  }

  return (
    <section id="uomsScreen" className="card panel app-screen">
      {/* Controls Bar: Search Bar, Dropdown Chip, and Toggle all in the same row */}
      <div className="definition-controls-row">
        {/* Search Bar */}
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Search UOMs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Right side controls group */}
        <div className="right-controls-group">
          {/* Dropdown Chip for Sync Status */}
          <div className="sync-dropdown-container" ref={dropdownRef}>
            <button
              type="button"
              className="secondary dropdown-chip-btn"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span>{getSyncLabel(syncFilter)}</span>
              <span className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}>▼</span>
            </button>

            {isDropdownOpen && (
              <div className="dropdown-menu">
                <button
                  type="button"
                  className={`dropdown-item ${syncFilter === 'all' ? 'selected' : ''}`}
                  onClick={() => {
                    setSyncFilter('all');
                    setIsDropdownOpen(false);
                  }}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`dropdown-item ${syncFilter === 'synced' ? 'selected' : ''}`}
                  onClick={() => {
                    setSyncFilter('synced');
                    setIsDropdownOpen(false);
                  }}
                >
                  Synced
                </button>
                <button
                  type="button"
                  className={`dropdown-item ${syncFilter === 'unsynced' ? 'selected' : ''}`}
                  onClick={() => {
                    setSyncFilter('unsynced');
                    setIsDropdownOpen(false);
                  }}
                >
                  Not Synced
                </button>
              </div>
            )}
          </div>

          {/* Active | Deleted Segmented Toggle Button */}
          <div className="segmented-toggle">
            <button
              type="button"
              className={`segmented-btn ${statusTab === 'active' ? 'active' : ''}`}
              onClick={() => setStatusTab('active')}
            >
              Active
            </button>
            <button
              type="button"
              className={`segmented-btn ${statusTab === 'deleted' ? 'active' : ''}`}
              onClick={() => setStatusTab('deleted')}
            >
              Deleted
            </button>
          </div>
        </div>
      </div>

      <div className="spacer" />
      <div className="divider" />
      <div className="spacer" />

      {/* Table Section Header with Create Button on the right */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <h3 style={{ margin: 0 }}>{statusTab === 'active' ? 'Active UOMs' : 'Deleted UOMs'}</h3>
        <button className="primary" onClick={handleOpenCreateModal}>
          Create New UOM
        </button>
      </div>

      {/* UOMs Table View */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Symbol</th>
              <th>Sort Order</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedUoms.length > 0 ? (
              displayedUoms.map((uom) => (
                <tr key={uom.id}>
                  <td>{uom.name}</td>
                  <td>{uom.symbol || '—'}</td>
                  <td>{uom.sortOrder ?? '—'}</td>
                  <td>
                    <div className="inline-actions" style={{ justifyContent: 'center' }}>
                      {statusTab === 'active' ? (
                        <>
                          <button className="secondary" onClick={() => handleOpenEditModal(uom)}>
                            Edit
                          </button>
                          <button className="danger" onClick={() => handleDeleteUom(uom.id)}>
                            Delete
                          </button>
                        </>
                      ) : (
                        <button className="secondary" onClick={() => handleRestoreUom(uom.id)}>
                          Restore
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '24px' }} className="muted">
                  {searchQuery || syncFilter !== 'all'
                    ? `No matching ${statusTab} UOMs found.`
                    : `No ${statusTab} UOMs found.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer summary counts */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
        <span className="muted" style={{ fontSize: '13px' }}>
          {totalCount} {statusTab} UOMs out of {syncedCount} synced | {notSyncedCount} not synced
        </span>
      </div>

      <UomModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleModalSuccess}
        uomToEdit={uomToEdit}
      />
    </section>
  );
}
