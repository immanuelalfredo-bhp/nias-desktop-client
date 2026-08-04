import { useEffect, useState, useRef } from 'react';
import type { attribute } from '@nias/shared';
import CategoryModal from './CategoryModal';

type SyncFilter = 'all' | 'synced' | 'unsynced';
type StatusTab = 'active' | 'deleted';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<attribute.Category[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<attribute.Category | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [syncFilter, setSyncFilter] = useState<SyncFilter>('all');
  const [statusTab, setStatusTab] = useState<StatusTab>('active');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchCategories = async () => {
    try {
      setIsBusy(true);
      const response =
        statusTab === 'active'
          ? await window.electronAPI.categoryListActive()
          : await window.electronAPI.categoryListDeleted();

      if (response.success) {
        setCategories(response.data || []);
      } else {
        console.error(`Failed to fetch ${statusTab} categories:`, response.message);
      }
    } catch (error) {
      console.error(`Error fetching ${statusTab} categories:`, error);
    } finally {
      setIsBusy(false);
    }
  };

  useEffect(() => {
    fetchCategories();
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

  const filteredCategories = categories.filter((category) => {
    const queryTerms = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);

    if (queryTerms.length === 0) {
      if (syncFilter === 'synced') return category.isSynced;
      if (syncFilter === 'unsynced') return !category.isSynced;
      return true;
    }

    // Every search term must match AT LEAST ONE field (name or tags)
    const matchesSearch = queryTerms.every((term) => {
      const matchesName = category.name.toLowerCase().includes(term);

      return matchesName;
    });

    if (syncFilter === 'synced') return matchesSearch && category.isSynced;
    if (syncFilter === 'unsynced') return matchesSearch && !category.isSynced;
    return matchesSearch;
  });

  // Truncate to 100 entries
  const displayedCategories = filteredCategories.slice(0, 100);

  // Calculate sync counts for the footer summary
  const totalCount = categories.length;
  const syncedCount = categories.filter((c) => c.isSynced).length;
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
    setCategoryToEdit(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (category: attribute.Category) => {
    setCategoryToEdit(category);
    setShowModal(true);
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const result = await window.electronAPI.categoryDelete(id);
      if (result.success) {
        fetchCategories();
      } else {
        console.error(`Failed to delete category:`, result.message);
      }
    } catch (error) {
      console.error(`Error deleting category:`, error);
    }
  };

  const handleRestoreCategory = async (id: string) => {
    try {
      const result = await window.electronAPI.categoryRestore(id);
      if (result.success) {
        fetchCategories();
      } else {
        console.error(`Failed to restore category:`, result.message);
      }
    } catch (error) {
      console.error(`Error restoring category:`, error);
    }
  };

  const handleModalSuccess = (message: string) => {
    console.log(message);
    fetchCategories();
  };

  if (isBusy && categories.length === 0) {
    return (
      <section id="categoriesScreen" className="card panel app-screen">
        <h2>Categories</h2>
        <p className="muted">Loading categories...</p>
      </section>
    );
  }

  return (
    <section id="categoriesScreen" className="card panel app-screen">
      {/* Controls Bar: Search Bar, Dropdown Chip, and Toggle all in the same row */}
      <div className="definition-controls-row">
        {/* Search Bar */}
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Search categories..."
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
        <h3 style={{ margin: 0 }}>{statusTab === 'active' ? 'Active Categories' : 'Deleted Categories'}</h3>
        <button className="primary" onClick={handleOpenCreateModal}>
          Create New Category
        </button>
      </div>

      {/* Categories Table View */}
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
            {displayedCategories.length > 0 ? (
              displayedCategories.map((category) => (
                <tr key={category.id}>
                  <td>{category.name}</td>
                  <td>{category.sortOrder ?? '—'}</td>
                  <td>
                    <div className="inline-actions" style={{ justifyContent: 'center' }}>
                      {statusTab === 'active' ? (
                        <>
                          <button className="secondary" onClick={() => handleOpenEditModal(category)}>
                            Edit
                          </button>
                          <button className="danger" onClick={() => handleDeleteCategory(category.id)}>
                            Delete
                          </button>
                        </>
                      ) : (
                        <button className="secondary" onClick={() => handleRestoreCategory(category.id)}>
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
                    ? `No matching ${statusTab} categories found.`
                    : `No ${statusTab} categories found.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer summary counts */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
        <span className="muted" style={{ fontSize: '13px' }}>
          {totalCount} {statusTab} categories out of {syncedCount} synced | {notSyncedCount} not synced
        </span>
      </div>

      <CategoryModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleModalSuccess}
        categoryToEdit={categoryToEdit}
      />
    </section>
  );
}
