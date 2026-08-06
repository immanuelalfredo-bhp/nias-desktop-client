import { useState, useMemo, useEffect } from 'react';
import { item, attribute } from '@nias/shared';
import ModalTemplate from '../../components/templates/Modal';
import { notifyApp } from '../../lib/notifications';

interface ApiDimension {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  isSynced: boolean;
  syncVersion: number;
  position: string;
  name: string;
  sortOrder: number;
  normalizedName: string;
  scope: string;
  formName: string;
}

interface AliasItem {
  id?: string; // Optional ID if coming from backend
  alias: string;
  sortOrder: number;
}

interface ItemWorkspaceModalProps {
  isOpen: boolean;
  initialData?: Partial<item.CreateItemRecordInput> & { id?: string };
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export default function ItemWorkspaceModal({
  isOpen,
  initialData,
  onClose,
  onSuccess,
}: ItemWorkspaceModalProps) {
  if (!isOpen) return null;

  const isEditMode = Boolean(initialData?.id);

  // --- Left Panel States (Identity & Metadata) ---
  const [skuCode, setSkuCode] = useState(initialData?.skuCode || '');
  const [displayName, setDisplayName] = useState(initialData?.displayName || '');
  const [baseName, setBaseName] = useState(initialData?.baseName || '');
  const [imageUrl, setImageUrl] = useState<string | null>(initialData?.imageUrl || null);
  const [isImageCollapsed, setIsImageCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'documents' | 'systems' | 'tags' | 'aliases' | 'system_data'
  >('system_data');

  // --- Aliases Tab States ---
  const [aliases, setAliases] = useState<AliasItem[]>([]);
  const [initialAliases, setInitialAliases] = useState<AliasItem[]>([]);
  const [newAliasName, setNewAliasName] = useState('');
  const [newAliasSortOrder, setNewAliasSortOrder] = useState<string | number>(0);

  // --- System Data States ---
  const [skuSource, setSkuSource] = useState<'internal' | 'external'>(
    initialData?.skuSource || 'internal',
  );
  const [materialType, setMaterialType] = useState<'component' | 'assembly'>(
    initialData?.materialType || 'component',
  );
  const [materialClass, setMaterialClass] = useState<'main' | 'installation' | 'support'>(
    initialData?.materialClass || 'main',
  );
  const [creationSource] = useState<'system' | 'user'>('user');
  const [delimiterType, setDelimiterType] = useState<'pipe' | 'cross'>(
    initialData?.delimiterType || 'cross',
  );
  const [hasAutoAssemblyTrigger] = useState<boolean>(initialData?.hasAutoAssemblyTrigger || false);

  // --- Right Panel States (Configurator & Dimension Selector) ---
  const [isBusy, setIsBusy] = useState(false);

  // --- Dimension Selector States ---
  const [activeApiDimensions, setActiveApiDimensions] = useState<ApiDimension[]>([]);
  const [dimensionSearchQuery, setDimensionSearchQuery] = useState('');
  const [selectedCreateDimensionIds, setSelectedCreateDimensionIds] = useState<string[]>([]);
  const [initialSelectedDimensionIds, setInitialSelectedDimensionIds] = useState<string[]>([]);

  // --- System Selector States ---
  const [activeApiSystems, setActiveApiSystems] = useState<attribute.System[]>([]);
  const [systemSearchQuery, setSystemSearchQuery] = useState('');
  const [selectedCreateSystemIds, setSelectedCreateSystemIds] = useState<string[]>([]);
  const [initialSelectedSystemIds, setInitialSelectedSystemIds] = useState<string[]>([]);

  // --- Tag Selector States ---
  const [activeApiTags, setActiveApiTags] = useState<attribute.Tag[]>([]);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [selectedCreateTagIds, setSelectedCreateTagIds] = useState<string[]>([]);
  const [initialSelectedTagIds, setInitialSelectedTagIds] = useState<string[]>([]);

  // Fetch active metadata and pre-populate maps if editing an existing item
  useEffect(() => {
    const fetchMetadataAndRelations = async () => {
      try {
        const [dimRes, sysRes, tagRes] = await Promise.all([
          window.electronAPI.dimensionListActive(),
          window.electronAPI.systemListActive(),
          window.electronAPI.tagListActive(),
        ]);

        if (dimRes && dimRes.success && Array.isArray(dimRes.data)) {
          setActiveApiDimensions(dimRes.data);
        }
        if (sysRes && sysRes.success && Array.isArray(sysRes.data)) {
          setActiveApiSystems(sysRes.data);
        }
        if (tagRes && tagRes.success && Array.isArray(tagRes.data)) {
          setActiveApiTags(tagRes.data);
        }

        // If in edit mode, fetch existing relations/mappings for this item
        if (isEditMode && initialData?.id) {
          const itemId = initialData.id;
          const [itemDimRes, itemSysRes, itemTagRes, itemAliasRes] = await Promise.all([
            window.electronAPI.dimensionGetByItemId
              ? window.electronAPI.dimensionGetByItemId(itemId)
              : Promise.resolve(null),
            window.electronAPI.systemGetByItemId
              ? window.electronAPI.systemGetByItemId(itemId)
              : Promise.resolve(null),
            window.electronAPI.tagGetByItemId
              ? window.electronAPI.tagGetByItemId(itemId)
              : Promise.resolve(null),
            window.electronAPI.aliasGetByItemId
              ? window.electronAPI.aliasGetByItemId(itemId)
              : Promise.resolve(null),
          ]);

          if (itemDimRes?.success && Array.isArray(itemDimRes.data)) {
            const ids = itemDimRes.data.map((d: any) => d.dimensionId || d.id);
            setSelectedCreateDimensionIds(ids);
            setInitialSelectedDimensionIds(ids);
          }
          if (itemSysRes?.success && Array.isArray(itemSysRes.data)) {
            const ids = itemSysRes.data.map((s: any) => s.systemId || s.id);
            setSelectedCreateSystemIds(ids);
            setInitialSelectedSystemIds(ids);
          }
          if (itemTagRes?.success && Array.isArray(itemTagRes.data)) {
            const ids = itemTagRes.data.map((t: any) => t.tagId || t.id);
            setSelectedCreateTagIds(ids);
            setInitialSelectedTagIds(ids);
          }
          if (itemAliasRes?.success && Array.isArray(itemAliasRes.data)) {
            const mappedAliases = itemAliasRes.data.map((a: any) => ({
              id: a.id,
              alias: a.alias,
              sortOrder: a.sortOrder ?? 0,
            }));
            setAliases(mappedAliases);
            setInitialAliases(mappedAliases);
          }
        }
      } catch (err) {
        console.error('Failed to fetch metadata or item relations:', err);
      }
    };
    fetchMetadataAndRelations();
  }, [isEditMode, initialData?.id]);

  // Filter and truncate to 100 items for dimensions
  const filteredApiDimensions = useMemo(() => {
    const q = dimensionSearchQuery.toLowerCase().trim();
    const filtered = activeApiDimensions.filter(
      (dim) => dim.formName.toLowerCase().includes(q) || dim.name.toLowerCase().includes(q),
    );
    return filtered.slice(0, 100);
  }, [activeApiDimensions, dimensionSearchQuery]);

  // Filter and truncate to 100 items for systems
  const filteredApiSystems = useMemo(() => {
    const q = systemSearchQuery.toLowerCase().trim();
    const filtered = activeApiSystems.filter(
      (sys: any) =>
        (sys.formName && sys.formName.toLowerCase().includes(q)) ||
        (sys.name && sys.name.toLowerCase().includes(q)),
    );
    return filtered.slice(0, 100);
  }, [activeApiSystems, systemSearchQuery]);

  // Filter and truncate to 100 items for tags
  const filteredApiTags = useMemo(() => {
    const q = tagSearchQuery.toLowerCase().trim();
    const filtered = activeApiTags.filter(
      (tag: any) =>
        (tag.formName && tag.formName.toLowerCase().includes(q)) ||
        (tag.name && tag.name.toLowerCase().includes(q)),
    );
    return filtered.slice(0, 100);
  }, [activeApiTags, tagSearchQuery]);

  const toggleCreateDimensionSelection = (id: string) => {
    setSelectedCreateDimensionIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleCreateSystemSelection = (id: string) => {
    setSelectedCreateSystemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleCreateTagSelection = (id: string) => {
    setSelectedCreateTagIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleAddAlias = () => {
    const trimmedAlias = newAliasName.trim();
    if (!trimmedAlias) return;

    const isDuplicate = aliases.some(
      (item) => item.alias.toLowerCase() === trimmedAlias.toLowerCase(),
    );

    if (isDuplicate) {
      notifyApp('This alias already exists. Aliases must be unique.', 'error');
      return;
    }

    const sortVal = newAliasSortOrder === '' ? 0 : Number(newAliasSortOrder);

    setAliases((prev) => [
      ...prev,
      { alias: trimmedAlias, sortOrder: isNaN(sortVal) ? 0 : sortVal },
    ]);

    setNewAliasName('');
    setNewAliasSortOrder(0);
  };

  const handleRemoveAlias = (index: number) => {
    setAliases((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setIsBusy(true);
    try {
      const payload: any = {
        displayName,
        skuCode,
        baseName,
        skuSource,
        materialType,
        materialClass,
        creationSource: 'user',
        delimiterType,
        hasAutoAssemblyTrigger,
        imageUrl,
      };

      let targetItemId = initialData?.id;

      if (isEditMode && targetItemId) {
        payload.id = targetItemId;
        const response = await window.electronAPI.itemUpdate(payload);
        if (response && !response.success) {
          throw new Error(response.message || 'Failed to update item');
        }
      } else {
        const response = await window.electronAPI.itemCreate(payload);
        if (response && !response.success) {
          throw new Error(response.message || 'Failed to create item');
        }
        targetItemId = response.data.id;
      }

      if (!targetItemId) {
        throw new Error('Item ID missing for processing relations.');
      }

      // --- Diff and Handle Additions & Removals ---

      // 1. Dimensions Diff
      const dimensionsToAdd = selectedCreateDimensionIds.filter(
        (id) => !initialSelectedDimensionIds.includes(id),
      );
      const dimensionsToRemove = initialSelectedDimensionIds.filter(
        (id) => !selectedCreateDimensionIds.includes(id),
      );

      // 2. Systems Diff
      const systemsToAdd = selectedCreateSystemIds.filter(
        (id) => !initialSelectedSystemIds.includes(id),
      );
      const systemsToRemove = initialSelectedSystemIds.filter(
        (id) => !selectedCreateSystemIds.includes(id),
      );

      // 3. Tags Diff
      const tagsToAdd = selectedCreateTagIds.filter((id) => !initialSelectedTagIds.includes(id));
      const tagsToRemove = initialSelectedTagIds.filter((id) => !selectedCreateTagIds.includes(id));

      // 4. Aliases Diff (using alias string match as a unique key identifier)
      const aliasesToAdd = aliases.filter(
        (a) => !initialAliases.some((ia) => ia.alias.toLowerCase() === a.alias.toLowerCase()),
      );
      const aliasesToRemove = initialAliases.filter(
        (ia) => !aliases.some((a) => a.alias.toLowerCase() === ia.alias.toLowerCase()),
      );

      await Promise.all([
        // --- ADDITIONS (Restore first if available, then fallback to create) ---
        ...dimensionsToAdd.map(async (dimensionId) => {
          return window.electronAPI.dimensionMapCreate({ dimensionId, itemId: targetItemId });
        }),

        ...systemsToAdd.map(async (systemId) => {
          return window.electronAPI.systemMapCreate({ systemId, itemId: targetItemId } as any);
        }),

        ...tagsToAdd.map(async (tagId) => {
          return window.electronAPI.tagMapCreate({ tagId, itemId: targetItemId } as any);
        }),

        ...aliasesToAdd.map((aliasObj) =>
          window.electronAPI.aliasCreate({ itemId: targetItemId, alias: aliasObj.alias }),
        ),

        // --- REMOVALS ---
        ...dimensionsToRemove.map((dimensionId) =>
          window.electronAPI.dimensionMapDelete
            ? window.electronAPI.dimensionMapDelete(targetItemId, dimensionId)
            : Promise.resolve(),
        ),
        ...systemsToRemove.map((systemId) =>
          window.electronAPI.systemMapDelete
            ? window.electronAPI.systemMapDelete(targetItemId, systemId)
            : Promise.resolve(),
        ),
        ...tagsToRemove.map((tagId) =>
          window.electronAPI.tagMapDelete
            ? window.electronAPI.tagMapDelete(targetItemId, tagId)
            : Promise.resolve(),
        ),
        ...aliasesToRemove.map((aliasObj) =>
          aliasObj.id && window.electronAPI.aliasDelete
            ? window.electronAPI.aliasDelete(targetItemId, aliasObj.alias)
            : Promise.resolve(),
        ),
      ]);

      onSuccess(isEditMode ? 'Successfully updated item!' : 'Successfully created item!');
      onClose();
    } catch (error: any) {
      console.error(error);
      notifyApp(error.message || 'An error occurred during submission.', 'error');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <ModalTemplate
      title={isEditMode ? 'Edit Item' : 'Create New Item'}
      handleClose={onClose}
      className="modal-card-wide"
    >
      <div className="workspaceGrid">
        {/* ================= LEFT PANEL (Identity & Meta) ================= */}
        <div className="leftPanel">
          <div>
            <input
              type="text"
              value={skuCode}
              onChange={(e) => setSkuCode(e.target.value)}
              placeholder="Item SKU Code"
              className="textInput"
            />
          </div>

          <div>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Item Display Name"
              className="textInput"
            />
          </div>

          {/* Collapsible Image Section
          <div className="imageSectionWrapper">
            <div onClick={() => setIsImageCollapsed(!isImageCollapsed)} className="imageHeader">
              <span>Item Image</span>
              <span>{isImageCollapsed ? '▼' : '▲'}</span>
            </div>
            {!isImageCollapsed && (
              <div className="itemImageContainer">
                {imageUrl ? (
                  <img src={imageUrl} alt={displayName} className="itemImage" />
                ) : (
                  <span className="noImageText">No Image</span>
                )}
              </div>
            )}
          </div> */}

          <div>
            <input
              type="text"
              value={baseName}
              onChange={(e) => setBaseName(e.target.value)}
              placeholder="Item Base Name"
              className="textInput"
            />
          </div>

          {/* Navigation Tabs for Meta data */}
          <div className="metaTabsContainer">
            <div className="tabButtons">
              {(['systems', 'tags', 'aliases', 'system_data'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`tabButton ${activeTab === tab ? 'tabButtonActive' : 'tabButtonInactive'}`}
                >
                  {tab.replace('_', ' ')}
                </button>
              ))}
            </div>
            <div className="tabContent">
              {/* {activeTab === 'documents' && (
                <p className="tabInfoText">Attached spec sheets or assets.</p>
              )} */}
              {activeTab === 'systems' && (
                <div className="createSystemsSection">
                  <div className="selectedTagsContainer">
                    <span className="selectedTagsLabel">
                      Selected Systems ({selectedCreateSystemIds.length})
                    </span>
                    <div className="tagsBox">
                      {selectedCreateSystemIds.length === 0 ? (
                        <span className="emptyTagsText">No systems selected.</span>
                      ) : (
                        selectedCreateSystemIds.map((id) => {
                          const found: any = activeApiSystems.find((s: any) => s.id === id);
                          return (
                            <span key={id} className="tagBadge">
                              {found ? found.formName || found.name : id}
                              <button
                                type="button"
                                onClick={() => toggleCreateSystemSelection(id)}
                                className="removeTagButton"
                              >
                                x
                              </button>
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>
                  <div>
                    <input
                      type="text"
                      value={systemSearchQuery}
                      onChange={(e) => setSystemSearchQuery(e.target.value)}
                      placeholder="Search systems..."
                      className="textInput"
                    />
                  </div>
                  <div className="tableWrapper">
                    <table className="dimensionTable">
                      <thead>
                        <tr className="tableHeaderRow">
                          <th className="tableHeaderCell">Form Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredApiSystems.length === 0 ? (
                          <tr>
                            <td className="emptyTableCell">No active systems found.</td>
                          </tr>
                        ) : (
                          filteredApiSystems.map((sys: any) => {
                            const isChecked = selectedCreateSystemIds.includes(sys.id);
                            return (
                              <tr
                                key={sys.id}
                                onClick={() => toggleCreateSystemSelection(sys.id)}
                                className={`tableRow ${isChecked ? 'tableRowChecked' : ''}`}
                              >
                                <td className="tableCellFormName">{sys.formName || sys.name}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {activeTab === 'tags' && (
                <div className="createTagsSection">
                  <div className="selectedTagsContainer">
                    <span className="selectedTagsLabel">
                      Selected Tags ({selectedCreateTagIds.length})
                    </span>
                    <div className="tagsBox">
                      {selectedCreateTagIds.length === 0 ? (
                        <span className="emptyTagsText">No tags selected.</span>
                      ) : (
                        selectedCreateTagIds.map((id) => {
                          const found: any = activeApiTags.find((t: any) => t.id === id);
                          return (
                            <span key={id} className="tagBadge">
                              {found ? found.formName || found.name : id}
                              <button
                                type="button"
                                onClick={() => toggleCreateTagSelection(id)}
                                className="removeTagButton"
                              >
                                x
                              </button>
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>
                  <div>
                    <input
                      type="text"
                      value={tagSearchQuery}
                      onChange={(e) => setTagSearchQuery(e.target.value)}
                      placeholder="Search tags..."
                      className="textInput"
                    />
                  </div>
                  <div className="tableWrapper">
                    <table className="dimensionTable">
                      <thead>
                        <tr className="tableHeaderRow">
                          <th className="tableHeaderCell">Form Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredApiTags.length === 0 ? (
                          <tr>
                            <td className="emptyTableCell">No active tags found.</td>
                          </tr>
                        ) : (
                          filteredApiTags.map((tag: any) => {
                            const isChecked = selectedCreateTagIds.includes(tag.id);
                            return (
                              <tr
                                key={tag.id}
                                onClick={() => toggleCreateTagSelection(tag.id)}
                                className={`tableRow ${isChecked ? 'tableRowChecked' : ''}`}
                              >
                                <td className="tableCellFormName">{tag.formName || tag.name}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {activeTab === 'aliases' && (
                <div className="aliasTabWrapper">
                  <div className="aliasInputRow">
                    <input
                      type="text"
                      value={newAliasName}
                      onChange={(e) => setNewAliasName(e.target.value)}
                      placeholder="Alias Name"
                      className="textInput aliasNameInput"
                    />
                    <input
                      type="number"
                      value={newAliasSortOrder}
                      onChange={(e) => setNewAliasSortOrder(e.target.value)}
                      placeholder="Sort"
                      className="textInput aliasSortInput"
                    />
                    <button
                      type="button"
                      onClick={handleAddAlias}
                      className="primaryButton aliasAddBtn"
                    >
                      Add
                    </button>
                  </div>

                  <div className="tableWrapper">
                    <table className="dimensionTable aliasTable">
                      <thead>
                        <tr className="tableHeaderRow">
                          <th className="tableHeaderCell aliasHeaderName">Alias</th>
                          <th className="tableHeaderCell aliasHeaderSort">Sort</th>
                          <th className="tableHeaderCell aliasHeaderAction"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {aliases.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="emptyTableCell">
                              No aliases added yet.
                            </td>
                          </tr>
                        ) : (
                          aliases.map((item, index) => (
                            <tr key={index} className="tableRow">
                              <td className="tableCellFormName aliasCellName">{item.alias}</td>
                              <td className="aliasSortCell">{item.sortOrder}</td>
                              <td className="aliasActionCell">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAlias(index)}
                                  className="removeTagButton aliasRemoveBtn"
                                >
                                  x
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {activeTab === 'system_data' && (
                <div className="systemDataContainer">
                  <div className="formGroup">
                    <label className="formLabel">SKU Source</label>
                    <select
                      value={skuSource}
                      onChange={(e: any) => setSkuSource(e.target.value)}
                      className="selectInput"
                    >
                      <option value="internal">Internal</option>
                      <option value="external">External</option>
                    </select>
                  </div>

                  <div className="formGroup">
                    <label className="formLabel">Material Type</label>
                    <select
                      value={materialType}
                      onChange={(e: any) => setMaterialType(e.target.value)}
                      className="selectInput"
                    >
                      <option value="component">Component</option>
                      <option value="assembly">Assembly</option>
                    </select>
                  </div>

                  <div className="formGroup">
                    <label className="formLabel">Material Class</label>
                    <select
                      value={materialClass}
                      onChange={(e: any) => setMaterialClass(e.target.value)}
                      className="selectInput"
                    >
                      <option value="main">Main</option>
                      <option value="installation">Installation</option>
                      <option value="support">Support</option>
                    </select>
                  </div>

                  <div className="formGroup">
                    <label className="formLabel">Delimiter Type</label>
                    <select
                      value={delimiterType}
                      onChange={(e: any) => setDelimiterType(e.target.value)}
                      className="selectInput"
                    >
                      <option value="cross">Cross (x)</option>
                      <option value="pipe">Pipe (|)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= RIGHT PANEL (Configurator & Dimension Selector) ================= */}
        <div className="rightPanel">
          <div className="configuratorContent">
            {/* Dimension Configuration Table & Selected Header Tags */}
            <div className="createDimensionsSection">
              <h4 className="sectionTitle">Dimensions Configuration</h4>

              {/* Selected Dimensions Headers / Tags */}
              <div className="selectedTagsContainer">
                <span className="selectedTagsLabel">
                  Selected Dimensions ({selectedCreateDimensionIds.length})
                </span>
                <div className="tagsBox">
                  {selectedCreateDimensionIds.length === 0 ? (
                    <span className="emptyTagsText">
                      No dimensions selected yet. Choose from the table below.
                    </span>
                  ) : (
                    selectedCreateDimensionIds.map((id) => {
                      const found = activeApiDimensions.find((d) => d.id === id);
                      return (
                        <span key={id} className="tagBadge">
                          {found ? found.name : id}
                          <button
                            type="button"
                            onClick={() => toggleCreateDimensionSelection(id)}
                            className="removeTagButton"
                          >
                            x
                          </button>
                        </span>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Search Bar */}
              <div>
                <input
                  type="text"
                  value={dimensionSearchQuery}
                  onChange={(e) => setDimensionSearchQuery(e.target.value)}
                  placeholder="Search dimension form names..."
                  className="textInput"
                />
              </div>

              {/* Truncated Table (First 100 active dimension form names) */}
              <div className="tableWrapper">
                <table className="dimensionTable">
                  <thead>
                    <tr className="tableHeaderRow">
                      <th className="tableHeaderCell">Form Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApiDimensions.length === 0 ? (
                      <tr>
                        <td colSpan={1} className="emptyTableCell">
                          No active dimensions found.
                        </td>
                      </tr>
                    ) : (
                      filteredApiDimensions.map((dim) => {
                        const isChecked = selectedCreateDimensionIds.includes(dim.id);
                        return (
                          <tr
                            key={dim.id}
                            onClick={() => toggleCreateDimensionSelection(dim.id)}
                            className={`tableRow ${isChecked ? 'tableRowChecked' : ''}`}
                          >
                            <td className="tableCellFormName">{dim.formName}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <span className="helperText">Showing up to 100 active dimensions.</span>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="workspaceFooter">
            <button type="button" className="secondaryButton" onClick={onClose} disabled={isBusy}>
              Cancel
            </button>
            <button
              type="button"
              className="primaryButton"
              onClick={handleSubmit}
              disabled={isBusy}
            >
              {isBusy
                ? isEditMode
                  ? 'Updating...'
                  : 'Creating...'
                : isEditMode
                  ? 'Update Item'
                  : 'Create Item'}
            </button>
          </div>
        </div>
      </div>
    </ModalTemplate>
  );
}
