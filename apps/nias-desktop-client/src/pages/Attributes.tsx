import { useEffect, useMemo, useState } from 'react';
import type { attribute } from '@nias/shared';
import type { StatusState } from '../types';
import StatusFooter from '../components/layout/StatusFooter';
import AttributeSection, { type AttributeView } from '../components/attribute/AttributeSection';
import CreateBrandModal from '../components/modals/CreateBrandModal';
import EditBrandModal from '../components/modals/EditBrandModal';
import CreateModeModal from '../components/modals/CreateModeModal';
import EditModeModal from '../components/modals/EditModeModal';

function normalizeTerm(value: string): string {
  return value.trim().toLowerCase();
}

export default function AttributesPage() {
  const [activeBrands, setActiveBrands] = useState<attribute.Brand[]>([]);
  const [deletedBrands, setDeletedBrands] = useState<attribute.Brand[]>([]);
  const [activeModes, setActiveModes] = useState<attribute.Mode[]>([]);
  const [deletedModes, setDeletedModes] = useState<attribute.Mode[]>([]);

  const [brandView, setBrandView] = useState<AttributeView>('active');
  const [modeView, setModeView] = useState<AttributeView>('active');
  const [brandSearch, setBrandSearch] = useState('');
  const [modeSearch, setModeSearch] = useState('');

  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState<StatusState>({ text: 'Ready', isError: false });

  const [showCreateBrandModal, setShowCreateBrandModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<attribute.Brand | null>(null);
  const [showCreateModeModal, setShowCreateModeModal] = useState(false);
  const [editingMode, setEditingMode] = useState<attribute.Mode | null>(null);

  const fetchBrands = async (): Promise<boolean> => {
    const [activeResponse, deletedResponse] = await Promise.all([
      window.electronAPI.brandListActive(),
      window.electronAPI.brandListDeleted(),
    ]);

    if (!activeResponse.success || !deletedResponse.success) {
      const message =
        activeResponse.message || deletedResponse.message || 'Failed to retrieve brands';
      setStatus({ text: message, isError: true });
      return false;
    }

    setActiveBrands(activeResponse.data || []);
    setDeletedBrands(deletedResponse.data || []);
    return true;
  };

  const fetchModes = async (): Promise<boolean> => {
    const [activeResponse, deletedResponse] = await Promise.all([
      window.electronAPI.modeListActive(),
      window.electronAPI.modeListDeleted(),
    ]);

    if (!activeResponse.success || !deletedResponse.success) {
      const message = activeResponse.message || deletedResponse.message || 'Failed to retrieve modes';
      setStatus({ text: message, isError: true });
      return false;
    }

    setActiveModes(activeResponse.data || []);
    setDeletedModes(deletedResponse.data || []);
    return true;
  };

  const refreshData = async () => {
    setIsBusy(true);
    try {
      await Promise.all([fetchBrands(), fetchModes()]);
    } catch {
      setStatus({ text: 'Failed to refresh attributes: Connection error', isError: true });
    } finally {
      setIsBusy(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const filteredBrands = useMemo(() => {
    const source = brandView === 'active' ? activeBrands : deletedBrands;
    const searchTerm = normalizeTerm(brandSearch);

    if (!searchTerm) {
      return source;
    }

    return source.filter((brand) => {
      const skuCode = brand.skuCode.toLowerCase();
      const normalizedName = brand.normalizedName.toLowerCase();
      return skuCode.includes(searchTerm) || normalizedName.includes(searchTerm);
    });
  }, [activeBrands, deletedBrands, brandSearch, brandView]);

  const totalBrands = useMemo(
    () => (brandView === 'active' ? activeBrands.length : deletedBrands.length),
    [activeBrands.length, deletedBrands.length, brandView],
  );

  const filteredModes = useMemo(() => {
    const source = modeView === 'active' ? activeModes : deletedModes;
    const searchTerm = normalizeTerm(modeSearch);

    if (!searchTerm) {
      return source;
    }

    return source.filter((mode) => mode.normalizedName.toLowerCase().includes(searchTerm));
  }, [activeModes, deletedModes, modeSearch, modeView]);

  const totalModes = useMemo(
    () => (modeView === 'active' ? activeModes.length : deletedModes.length),
    [activeModes.length, deletedModes.length, modeView],
  );

  const handleDeleteBrand = async (brand: attribute.Brand) => {
    setStatus({ text: `Deleting brand ${brand.name}...`, isError: false });

    try {
      const result = await window.electronAPI.brandDelete({ id: brand.id });
      if (!result.success) {
        setStatus({ text: result.message || 'Failed to delete brand', isError: true });
        return;
      }

      await fetchBrands();
      setStatus({ text: result.message || 'Brand deleted successfully', isError: false });
    } catch {
      setStatus({ text: 'Delete brand failed: Connection error', isError: true });
    }
  };

  const handleRestoreBrand = async (brand: attribute.Brand) => {
    setStatus({ text: `Restoring brand ${brand.name}...`, isError: false });

    try {
      const result = await window.electronAPI.brandRestore({ id: brand.id });
      if (!result.success) {
        setStatus({ text: result.message || 'Failed to restore brand', isError: true });
        return;
      }

      await fetchBrands();
      setStatus({ text: result.message || 'Brand restored successfully', isError: false });
    } catch {
      setStatus({ text: 'Restore brand failed: Connection error', isError: true });
    }
  };

  const handleDeleteMode = async (mode: attribute.Mode) => {
    setStatus({ text: `Deleting mode ${mode.name}...`, isError: false });

    try {
      const result = await window.electronAPI.modeDelete({ id: mode.id });
      if (!result.success) {
        setStatus({ text: result.message || 'Failed to delete mode', isError: true });
        return;
      }

      await fetchModes();
      setStatus({ text: result.message || 'Mode deleted successfully', isError: false });
    } catch {
      setStatus({ text: 'Delete mode failed: Connection error', isError: true });
    }
  };

  const handleRestoreMode = async (mode: attribute.Mode) => {
    setStatus({ text: `Restoring mode ${mode.name}...`, isError: false });

    try {
      const result = await window.electronAPI.modeRestore({ id: mode.id });
      if (!result.success) {
        setStatus({ text: result.message || 'Failed to restore mode', isError: true });
        return;
      }

      await fetchModes();
      setStatus({ text: result.message || 'Mode restored successfully', isError: false });
    } catch {
      setStatus({ text: 'Restore mode failed: Connection error', isError: true });
    }
  };

  const handleModalSuccess = async (message: string) => {
    await refreshData();
    setStatus({ text: message, isError: false });
  };

  const handleModalError = (message: string) => {
    setStatus({ text: message, isError: true });
  };

  return (
    <section id="attributesScreen" className="card panel app-screen attributes-page fluid-card">
      <h1>Attributes</h1>
      <p className="muted subtitle-tight">Manage brand and mode records used across the system.</p>

      {isBusy ? <p className="muted">Loading attributes...</p> : null}

      <div className="attributes-grid">
        <AttributeSection<attribute.Brand>
          title="Brands"
          addLabel="Add Brand"
          onAdd={() => setShowCreateBrandModal(true)}
          view={brandView}
          onViewChange={setBrandView}
          searchValue={brandSearch}
          onSearchChange={setBrandSearch}
          searchPlaceholder="Search by SKU or name"
          columns={['SKU', 'Name', 'Actions']}
          rows={filteredBrands}
          rowKey={(brand) => brand.id}
          renderRowCells={(brand, isDeletedView) => (
            <>
              <td>{brand.skuCode}</td>
              <td>{brand.name}</td>
              <td>
                <div className="inline-actions">
                  {isDeletedView ? (
                    <button className="secondary" type="button" onClick={() => handleRestoreBrand(brand)}>
                      Restore
                    </button>
                  ) : (
                    <>
                      <button className="secondary" type="button" onClick={() => setEditingBrand(brand)}>
                        Edit
                      </button>
                      <button className="danger" type="button" onClick={() => handleDeleteBrand(brand)}>
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </td>
            </>
          )}
          emptyText={
            brandView === 'active' ? 'No active brands found.' : 'No deleted brands found.'
          }
          countLabel={`Showing ${filteredBrands.length} of ${totalBrands} Brands`}
        />

        <AttributeSection<attribute.Mode>
          title="Modes"
          addLabel="Add Mode"
          onAdd={() => setShowCreateModeModal(true)}
          view={modeView}
          onViewChange={setModeView}
          searchValue={modeSearch}
          onSearchChange={setModeSearch}
          searchPlaceholder="Search by name"
          columns={['Name', 'Actions']}
          rows={filteredModes}
          rowKey={(mode) => mode.id}
          renderRowCells={(mode, isDeletedView) => (
            <>
              <td>{mode.name}</td>
              <td>
                <div className="inline-actions">
                  {isDeletedView ? (
                    <button className="secondary" type="button" onClick={() => handleRestoreMode(mode)}>
                      Restore
                    </button>
                  ) : (
                    <>
                      <button className="secondary" type="button" onClick={() => setEditingMode(mode)}>
                        Edit
                      </button>
                      <button className="danger" type="button" onClick={() => handleDeleteMode(mode)}>
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </td>
            </>
          )}
          emptyText={modeView === 'active' ? 'No active modes found.' : 'No deleted modes found.'}
          countLabel={`Showing ${filteredModes.length} of ${totalModes} Modes`}
        />
      </div>

      <div className="status-row">
        <StatusFooter status={status} />
      </div>

      {showCreateBrandModal ? (
        <CreateBrandModal
          handleClose={() => setShowCreateBrandModal(false)}
          onSuccess={handleModalSuccess}
          onError={handleModalError}
        />
      ) : null}

      {editingBrand ? (
        <EditBrandModal
          brand={editingBrand}
          handleClose={() => setEditingBrand(null)}
          onSuccess={handleModalSuccess}
          onError={handleModalError}
        />
      ) : null}

      {showCreateModeModal ? (
        <CreateModeModal
          handleClose={() => setShowCreateModeModal(false)}
          onSuccess={handleModalSuccess}
          onError={handleModalError}
        />
      ) : null}

      {editingMode ? (
        <EditModeModal
          mode={editingMode}
          handleClose={() => setEditingMode(null)}
          onSuccess={handleModalSuccess}
          onError={handleModalError}
        />
      ) : null}
    </section>
  );
}
