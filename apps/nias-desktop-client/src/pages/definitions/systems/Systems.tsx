import { useEffect, useState, useRef } from 'react';
import type { attribute } from '@nias/shared';
import SystemModal from './SystemModal';

type SyncFilter = 'all' | 'synced' | 'unsynced';
type StatusTab = 'active' | 'deleted';

export default function SystemsPage() {
  const [systems, setSystems] = useState<attribute.System[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [systemToEdit, setSystemToEdit] = useState<attribute.System | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [syncFilter, setSyncFilter] = useState<SyncFilter>('all');
  const [statusTab, setStatusTab] = useState<StatusTab>('active');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchSystems = async () => {
    try {
      setIsBusy(true);
      const response =
        statusTab === 'active'
          ? await window.electronAPI.systemListActive()
          : await window.electronAPI.systemListDeleted();

      if (response.success) {
        setSystems(response.data || []);
      } else {
        console.error(`Failed to fetch ${statusTab} systems:`, response.message);
      }
    } catch (error) {
      console.error(`Error fetching ${statusTab} systems:`, error);
    } finally {
      setIsBusy(false);
    }
  };

  useEffect(() => {
    fetchSystems();
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

  const filteredSystems = systems.filter((system) => {
    const queryTerms = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);

    if (queryTerms.length === 0) {
      if (syncFilter === 'synced') return system.isSynced;
      if (syncFilter === 'unsynced') return !system.isSynced;
      return true;
    }

    // Every search term must match AT LEAST ONE field (name or tags)
    const matchesSearch = queryTerms.every((term) => {
      const matchesName = system.name.toLowerCase().includes(term);

      return matchesName;
    });

    if (syncFilter === 'synced') return matchesSearch && system.isSynced;
    if (syncFilter === 'unsynced') return matchesSearch && !system.isSynced;
    return matchesSearch;
  });

  // Truncate to 100 entries
  const displayedSystems = filteredSystems.slice(0, 100);

  // Calculate sync counts for the footer summary
  const totalCount = systems.length;
  const syncedCount = systems.filter((b) => b.isSynced).length;
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
    setSystemToEdit(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (system: attribute.System) => {
    setSystemToEdit(system);
    setShowModal(true);
  };

  const handleDeleteSystem = async (id: string) => {
    try {
      const result = await window.electronAPI.systemDelete(id);
      if (result.success) {
        fetchSystems();
      } else {
        console.error(`Failed to delete system:`, result.message);
      }
    } catch (error) {
      console.error(`Error deleting system:`, error);
    }
  };

  const handleRestoreSystem = async (id: string) => {
    try {
      const result = await window.electronAPI.systemRestore(id);
      if (result.success) {
        fetchSystems();
      } else {
        console.error(`Failed to restore system:`, result.message);
      }
    } catch (error) {
      console.error(`Error restoring system:`, error);
    }
  };

  const handleModalSuccess = (message: string) => {
    console.log(message);
    fetchSystems();
  };

  if (isBusy && systems.length === 0) {
    return (
      <section id="systemsScreen" className="card panel app-screen">
        <h2>Systems</h2>
        <p className="muted">Loading systems...</p>
      </section>
    );
  }

  return (
    <section id="systemsScreen" className="card panel app-screen">
      {/* Controls Bar: Search Bar, Dropdown Chip, and Toggle all in the same row */}
      <div className="definition-controls-row">
        {/* Search Bar */}
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Search systems..."
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
        <h3 style={{ margin: 0 }}>
          {statusTab === 'active' ? 'Active Systems' : 'Deleted Systems'}
        </h3>
        <button className="primary" onClick={handleOpenCreateModal}>
          Create New System
        </button>
      </div>

      {/* Systems Table View */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Sort Order</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedSystems.length > 0 ? (
              displayedSystems.map((system) => (
                <tr key={system.id}>
                  <td>{system.name}</td>
                  <td>{system.sortOrder ?? '—'}</td>
                  <td>
                    <div className="inline-actions" style={{ justifyContent: 'center' }}>
                      {statusTab === 'active' ? (
                        <>
                          <button className="secondary" onClick={() => handleOpenEditModal(system)}>
                            Edit
                          </button>
                          <button className="danger" onClick={() => handleDeleteSystem(system.id)}>
                            Delete
                          </button>
                        </>
                      ) : (
                        <button
                          className="secondary"
                          onClick={() => handleRestoreSystem(system.id)}
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '24px' }} className="muted">
                  {searchQuery || syncFilter !== 'all'
                    ? `No matching ${statusTab} systems found.`
                    : `No ${statusTab} systems found.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer summary counts */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
        <span className="muted" style={{ fontSize: '13px' }}>
          {totalCount} {statusTab} systems out of {syncedCount} synced | {notSyncedCount} not synced
        </span>
      </div>

      <SystemModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleModalSuccess}
        systemToEdit={systemToEdit}
      />
    </section>
  );
}
