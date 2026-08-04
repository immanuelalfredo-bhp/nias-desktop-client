import { useEffect, useState, useRef } from 'react';
import type { attribute } from '@nias/shared';
import ModeModal from './ModeModal';

type SyncFilter = 'all' | 'synced' | 'unsynced';
type StatusTab = 'active' | 'deleted';

export default function ModesPage() {
  const [modes, setModes] = useState<attribute.Mode[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modeToEdit, setModeToEdit] = useState<attribute.Mode | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [syncFilter, setSyncFilter] = useState<SyncFilter>('all');
  const [statusTab, setStatusTab] = useState<StatusTab>('active');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchModes = async () => {
    try {
      setIsBusy(true);
      const response =
        statusTab === 'active'
          ? await window.electronAPI.modeListActive()
          : await window.electronAPI.modeListDeleted();

      if (response.success) {
        setModes(response.data || []);
      } else {
        console.error(`Failed to fetch ${statusTab} modes:`, response.message);
      }
    } catch (error) {
      console.error(`Error fetching ${statusTab} modes:`, error);
    } finally {
      setIsBusy(false);
    }
  };

  useEffect(() => {
    fetchModes();
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

  const filteredModes = modes.filter((mode) => {
    const queryTerms = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);

    if (queryTerms.length === 0) {
      if (syncFilter === 'synced') return mode.isSynced;
      if (syncFilter === 'unsynced') return !mode.isSynced;
      return true;
    }

    // Every search term must match AT LEAST ONE field (name or tags)
    const matchesSearch = queryTerms.every((term) => {
      const matchesName = mode.name.toLowerCase().includes(term);

      return matchesName;
    });

    if (syncFilter === 'synced') return matchesSearch && mode.isSynced;
    if (syncFilter === 'unsynced') return matchesSearch && !mode.isSynced;
    return matchesSearch;
  });

  // Truncate to 100 entries
  const displayedModes = filteredModes.slice(0, 100);

  // Calculate sync counts for the footer summary
  const totalCount = modes.length;
  const syncedCount = modes.filter((b) => b.isSynced).length;
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
    setModeToEdit(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (mode: attribute.Mode) => {
    setModeToEdit(mode);
    setShowModal(true);
  };

  const handleDeleteMode = async (id: string) => {
    try {
      const result = await window.electronAPI.modeDelete(id);
      if (result.success) {
        fetchModes();
      } else {
        console.error(`Failed to delete mode:`, result.message);
      }
    } catch (error) {
      console.error(`Error deleting mode:`, error);
    }
  };

  const handleRestoreMode = async (id: string) => {
    try {
      const result = await window.electronAPI.modeRestore(id);
      if (result.success) {
        fetchModes();
      } else {
        console.error(`Failed to restore mode:`, result.message);
      }
    } catch (error) {
      console.error(`Error restoring mode:`, error);
    }
  };

  const handleModalSuccess = (message: string) => {
    console.log(message);
    fetchModes();
  };

  if (isBusy && modes.length === 0) {
    return (
      <section id="modesScreen" className="card panel app-screen">
        <h2>Modes</h2>
        <p className="muted">Loading modes...</p>
      </section>
    );
  }

  return (
    <section id="modesScreen" className="card panel app-screen">
      {/* Controls Bar: Search Bar, Dropdown Chip, and Toggle all in the same row */}
      <div className="definition-controls-row">
        {/* Search Bar */}
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Search modes..."
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
        <h3 style={{ margin: 0 }}>{statusTab === 'active' ? 'Active Modes' : 'Deleted Modes'}</h3>
        <button className="primary" onClick={handleOpenCreateModal}>
          Create New Mode
        </button>
      </div>

      {/* Modes Table View */}
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
            {displayedModes.length > 0 ? (
              displayedModes.map((mode) => (
                <tr key={mode.id}>
                  <td>{mode.name}</td>
                  <td>{mode.sortOrder ?? '—'}</td>
                  <td>
                    <div className="inline-actions" style={{ justifyContent: 'center' }}>
                      {statusTab === 'active' ? (
                        <>
                          <button className="secondary" onClick={() => handleOpenEditModal(mode)}>
                            Edit
                          </button>
                          <button className="danger" onClick={() => handleDeleteMode(mode.id)}>
                            Delete
                          </button>
                        </>
                      ) : (
                        <button className="secondary" onClick={() => handleRestoreMode(mode.id)}>
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
                    ? `No matching ${statusTab} modes found.`
                    : `No ${statusTab} modes found.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer summary counts */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
        <span className="muted" style={{ fontSize: '13px' }}>
          {totalCount} {statusTab} modes out of {syncedCount} synced | {notSyncedCount} not synced
        </span>
      </div>

      <ModeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleModalSuccess}
        modeToEdit={modeToEdit}
      />
    </section>
  );
}
