import { useEffect, useState, useRef } from 'react';
import type { attribute } from '@nias/shared';
import TagModal from './TagModal';

type SyncFilter = 'all' | 'synced' | 'unsynced';
type StatusTab = 'active' | 'deleted';

export default function TagsPage() {
  const [tags, setTags] = useState<attribute.Tag[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [tagToEdit, setTagToEdit] = useState<attribute.Tag | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [syncFilter, setSyncFilter] = useState<SyncFilter>('all');
  const [statusTab, setStatusTab] = useState<StatusTab>('active');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchTags = async () => {
    try {
      setIsBusy(true);
      const response =
        statusTab === 'active'
          ? await window.electronAPI.tagListActive()
          : await window.electronAPI.tagListDeleted();

      if (response.success) {
        setTags(response.data || []);
      } else {
        console.error(`Failed to fetch ${statusTab} tags:`, response.message);
      }
    } catch (error) {
      console.error(`Error fetching ${statusTab} tags:`, error);
    } finally {
      setIsBusy(false);
    }
  };

  useEffect(() => {
    fetchTags();
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

  const filteredTags = tags.filter((tag) => {
    const queryTerms = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);

    if (queryTerms.length === 0) {
      if (syncFilter === 'synced') return tag.isSynced;
      if (syncFilter === 'unsynced') return !tag.isSynced;
      return true;
    }

    // Every search term must match AT LEAST ONE field (name or tags)
    const matchesSearch = queryTerms.every((term) => {
      const matchesName = tag.name.toLowerCase().includes(term);

      return matchesName;
    });

    if (syncFilter === 'synced') return matchesSearch && tag.isSynced;
    if (syncFilter === 'unsynced') return matchesSearch && !tag.isSynced;
    return matchesSearch;
  });

  // Truncate to 100 entries
  const displayedTags = filteredTags.slice(0, 100);

  // Calculate sync counts for the footer summary
  const totalCount = tags.length;
  const syncedCount = tags.filter((b) => b.isSynced).length;
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
    setTagToEdit(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (tag: attribute.Tag) => {
    setTagToEdit(tag);
    setShowModal(true);
  };

  const handleDeleteTag = async (id: string) => {
    try {
      const result = await window.electronAPI.tagDelete(id);
      if (result.success) {
        fetchTags();
      } else {
        console.error(`Failed to delete tag:`, result.message);
      }
    } catch (error) {
      console.error(`Error deleting tag:`, error);
    }
  };

  const handleRestoreTag = async (id: string) => {
    try {
      const result = await window.electronAPI.tagRestore(id);
      if (result.success) {
        fetchTags();
      } else {
        console.error(`Failed to restore tag:`, result.message);
      }
    } catch (error) {
      console.error(`Error restoring tag:`, error);
    }
  };

  const handleModalSuccess = (message: string) => {
    console.log(message);
    fetchTags();
  };

  if (isBusy && tags.length === 0) {
    return (
      <section id="tagsScreen" className="card panel app-screen">
        <h2>Tags</h2>
        <p className="muted">Loading tags...</p>
      </section>
    );
  }

  return (
    <section id="tagsScreen" className="card panel app-screen">
      {/* Controls Bar: Search Bar, Dropdown Chip, and Toggle all in the same row */}
      <div className="definition-controls-row">
        {/* Search Bar */}
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Search tags..."
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
        <h3 style={{ margin: 0 }}>{statusTab === 'active' ? 'Active Tags' : 'Deleted Tags'}</h3>
        <button className="primary" onClick={handleOpenCreateModal}>
          Create New Tag
        </button>
      </div>

      {/* Tags Table View */}
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
            {displayedTags.length > 0 ? (
              displayedTags.map((tag) => (
                <tr key={tag.id}>
                  <td>{tag.name}</td>
                  <td>{tag.sortOrder ?? '—'}</td>
                  <td>
                    <div className="inline-actions" style={{ justifyContent: 'center' }}>
                      {statusTab === 'active' ? (
                        <>
                          <button className="secondary" onClick={() => handleOpenEditModal(tag)}>
                            Edit
                          </button>
                          <button className="danger" onClick={() => handleDeleteTag(tag.id)}>
                            Delete
                          </button>
                        </>
                      ) : (
                        <button className="secondary" onClick={() => handleRestoreTag(tag.id)}>
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
                    ? `No matching ${statusTab} tags found.`
                    : `No ${statusTab} tags found.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer summary counts */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
        <span className="muted" style={{ fontSize: '13px' }}>
          {totalCount} {statusTab} tags out of {syncedCount} synced | {notSyncedCount} not synced
        </span>
      </div>

      <TagModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleModalSuccess}
        tagToEdit={tagToEdit}
      />
    </section>
  );
}
