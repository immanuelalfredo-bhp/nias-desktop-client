import { useEffect, useState, useRef } from 'react';
import type { attribute } from '@nias/shared';
import BrandModal from './BrandModal';

type SyncFilter = 'all' | 'synced' | 'unsynced';
type StatusTab = 'active' | 'deleted';

export default function BrandsPage() {
  const [brands, setBrands] = useState<attribute.Brand[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [brandToEdit, setBrandToEdit] = useState<attribute.Brand | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [syncFilter, setSyncFilter] = useState<SyncFilter>('all');
  const [statusTab, setStatusTab] = useState<StatusTab>('active');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchBrands = async () => {
    try {
      setIsBusy(true);
      const response =
        statusTab === 'active'
          ? await window.electronAPI.brandListActive()
          : await window.electronAPI.brandListDeleted();

      if (response.success) {
        setBrands(response.data || []);
      } else {
        console.error(`Failed to fetch ${statusTab} brands:`, response.message);
      }
    } catch (error) {
      console.error(`Error fetching ${statusTab} brands:`, error);
    } finally {
      setIsBusy(false);
    }
  };

  useEffect(() => {
    fetchBrands();
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

  const filteredBrands = brands.filter((brand) => {
    const queryTerms = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);

    if (queryTerms.length === 0) {
      if (syncFilter === 'synced') return brand.isSynced;
      if (syncFilter === 'unsynced') return !brand.isSynced;
      return true;
    }

    // Every search term must match AT LEAST ONE field (name or tags)
    const matchesSearch = queryTerms.every((term) => {
      const matchesName = brand.name.toLowerCase().includes(term);
      const matchesSku = brand.skuCode.toLowerCase().includes(term);

      return matchesName || matchesSku;
    });

    if (syncFilter === 'synced') return matchesSearch && brand.isSynced;
    if (syncFilter === 'unsynced') return matchesSearch && !brand.isSynced;
    return matchesSearch;
  });

  // Truncate to 100 entries
  const displayedBrands = filteredBrands.slice(0, 100);

  // Calculate sync counts for the footer summary
  const totalCount = brands.length;
  const syncedCount = brands.filter((b) => b.isSynced).length;
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
    setBrandToEdit(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (brand: attribute.Brand) => {
    setBrandToEdit(brand);
    setShowModal(true);
  };

  const handleDeleteBrand = async (id: string) => {
    try {
      const result = await window.electronAPI.brandDelete(id);
      if (result.success) {
        fetchBrands();
      } else {
        console.error(`Failed to delete brand:`, result.message);
      }
    } catch (error) {
      console.error(`Error deleting brand:`, error);
    }
  };

  const handleRestoreBrand = async (id: string) => {
    try {
      const result = await window.electronAPI.brandRestore(id);
      if (result.success) {
        fetchBrands();
      } else {
        console.error(`Failed to restore brand:`, result.message);
      }
    } catch (error) {
      console.error(`Error restoring brand:`, error);
    }
  };

  const handleModalSuccess = (message: string) => {
    console.log(message);
    fetchBrands();
  };

  if (isBusy && brands.length === 0) {
    return (
      <section id="brandsScreen" className="card panel app-screen">
        <h2>Brands</h2>
        <p className="muted">Loading brands...</p>
      </section>
    );
  }

  return (
    <section id="brandsScreen" className="card panel app-screen">
      {/* Controls Bar: Search Bar, Dropdown Chip, and Toggle all in the same row */}
      <div className="definition-controls-row">
        {/* Search Bar */}
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Search brands..."
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
        <h3 style={{ margin: 0 }}>{statusTab === 'active' ? 'Active Brands' : 'Deleted Brands'}</h3>
        <button className="primary" onClick={handleOpenCreateModal}>
          Create New Brand
        </button>
      </div>

      {/* Brands Table View */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>SKU Code</th>
              <th>Name</th>
              <th>Sort Order</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedBrands.length > 0 ? (
              displayedBrands.map((brand) => (
                <tr key={brand.id}>
                  <td>{brand.skuCode || '—'}</td>
                  <td>{brand.name}</td>
                  <td>{brand.sortOrder ?? '—'}</td>
                  <td>
                    <div className="inline-actions" style={{ justifyContent: 'center' }}>
                      {statusTab === 'active' ? (
                        <>
                          <button className="secondary" onClick={() => handleOpenEditModal(brand)}>
                            Edit
                          </button>
                          <button className="danger" onClick={() => handleDeleteBrand(brand.id)}>
                            Delete
                          </button>
                        </>
                      ) : (
                        <button className="secondary" onClick={() => handleRestoreBrand(brand.id)}>
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
                    ? `No matching ${statusTab} brands found.`
                    : `No ${statusTab} brands found.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer summary counts */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
        <span className="muted" style={{ fontSize: '13px' }}>
          {totalCount} {statusTab} brands out of {syncedCount} synced | {notSyncedCount} not synced
        </span>
      </div>

      <BrandModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleModalSuccess}
        brandToEdit={brandToEdit}
      />
    </section>
  );
}
