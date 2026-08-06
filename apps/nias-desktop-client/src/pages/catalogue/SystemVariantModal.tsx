import { useState, useEffect } from 'react';
import { order, attribute, variant } from '@nias/shared';
import ModalTemplate from '../../components/templates/Modal';
import { notifyApp } from '../../lib/notifications';

interface AliasItem {
  alias: string;
  sortOrder: number;
}

interface SystemVariantModalProps {
  isOpen: boolean;
  initialData: any;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onAdd?: (item: any) => void;
  onEdit?: (item: any) => void;
}

export default function SystemVariantModal({
  isOpen,
  initialData,
  onClose,
  onSuccess,
  onAdd,
  onEdit,
}: SystemVariantModalProps) {
  if (!isOpen) return null;

  const itemId = initialData?.id;
  const creationSource = initialData?.creationSource || 'system';

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

  // --- System Data States ---
  const [skuSource] = useState<'internal' | 'external'>(initialData?.skuSource || 'internal');
  const [materialType, setMaterialType] = useState<'component' | 'assembly'>(
    initialData?.materialType || 'component',
  );
  const [materialClass, setMaterialClass] = useState<'main' | 'installation' | 'support'>(
    initialData?.materialClass || 'main',
  );
  const [delimiterType, setDelimiterType] = useState<'pipe' | 'cross'>(
    initialData?.delimiterType || 'cross',
  );
  const [hasAutoAssemblyTrigger] = useState<boolean>(initialData?.hasAutoAssemblyTrigger || false);

  // --- Right Panel & Faceted Selector States ---
  const [isBusy, setIsBusy] = useState(false);
  const [itemBrands, setItemBrands] = useState<attribute.Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);

  // Mode & UOM Selector States
  const [itemModes, setItemModes] = useState<attribute.Mode[]>([]);
  const [selectedModeId, setSelectedModeId] = useState<string | null>(null);

  const [itemUoms, setItemUoms] = useState<attribute.Uom[]>([]);
  const [selectedUomId, setSelectedUomId] = useState<string | null>(null);

  // Dimension Selection State
  const [selectedDimensionValues, setSelectedDimensionValues] = useState<Record<string, string>>(
    {},
  ); // dimensionId -> valueId

  // Faceted Output Data
  const [availableVariants, setAvailableVariants] = useState<variant.VariantRecord[]>([]);
  const [availableDimensions, setAvailableDimensions] = useState<attribute.Dimension[]>([]);
  const [dimensionValuesMap, setDimensionValuesMap] = useState<
    Record<string, attribute.DimensionValue[]>
  >({});

  const [resolvedVariant, setResolvedVariant] = useState<variant.VariantRecord | null>(null);

  // Comments State
  const [commentsValue, setCommentsValue] = useState<string>('');
  const [quantityValue, setQuantityValue] = useState<string>('');

  // --- System & Tag Selector States ---
  const [activeApiSystems, setActiveApiSystems] = useState<attribute.System[]>([]);
  const [selectedCreateSystemIds, setSelectedCreateSystemIds] = useState<string[]>([]);
  const [activeApiTags, setActiveApiTags] = useState<attribute.Tag[]>([]);
  const [selectedCreateTagIds, setSelectedCreateTagIds] = useState<string[]>([]);

  // --- User Variant Modal State ---
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUserItem, setSelectedUserItem] = useState<any>(null);

  // Initial Fetch (Metadata, Systems, Tags, Brands, Modes, Uoms)
  useEffect(() => {
    const fetchActiveMetadata = async () => {
      try {
        const [sysRes, tagRes, brandMapRes, modeMapRes, uomMapRes] = await Promise.all([
          window.electronAPI.systemListActive(),
          window.electronAPI.tagListActive(),
          itemId
            ? window.electronAPI.brandGetByItemId(itemId)
            : Promise.resolve({ success: false, data: [] }),
          itemId
            ? window.electronAPI.modeGetByItemId(itemId)
            : Promise.resolve({ success: false, data: [] }),
          itemId
            ? window.electronAPI.uomGetByItemId(itemId)
            : Promise.resolve({ success: false, data: [] }),
        ]);

        if (sysRes && sysRes.success && Array.isArray(sysRes.data)) {
          setActiveApiSystems(sysRes.data);
        }
        if (tagRes && tagRes.success && Array.isArray(tagRes.data)) {
          setActiveApiTags(tagRes.data);
        }
        if (brandMapRes && brandMapRes.success && Array.isArray(brandMapRes.data)) {
          setItemBrands(brandMapRes.data);
          if (brandMapRes.data.length > 0 && brandMapRes.data[0]) {
            setSelectedBrandId(brandMapRes.data[0].id);
          }
        }
        if (modeMapRes && modeMapRes.success && Array.isArray(modeMapRes.data)) {
          const modes = modeMapRes.data as any[];
          setItemModes(modes);
          if (modes.length > 0 && modes[0]) {
            setSelectedModeId(modes[0].id);
          }
        }
        if (uomMapRes && uomMapRes.success && Array.isArray(uomMapRes.data)) {
          const uoms = uomMapRes.data as any[];
          setItemUoms(uoms);
          if (uoms.length > 0 && uoms[0]) {
            setSelectedUomId(uoms[0].id);
          }
        }
        if (itemId) {
          const [sysMapRes, tagMapRes, aliasMapRes] = await Promise.all([
            window.electronAPI.systemGetByItemId(itemId),
            window.electronAPI.tagGetByItemId(itemId),
            window.electronAPI.aliasGetByItemId(itemId),
          ]);

          if (sysMapRes?.success && Array.isArray(sysMapRes.data)) {
            setSelectedCreateSystemIds(sysMapRes.data.map((s: any) => s.id));
          }
          if (tagMapRes?.success && Array.isArray(tagMapRes.data)) {
            setSelectedCreateTagIds(tagMapRes.data.map((t: any) => t.id));
          }
          if (aliasMapRes?.success && Array.isArray(aliasMapRes.data)) {
            setAliases(
              aliasMapRes.data.map((a: any) => ({ alias: a.alias, sortOrder: a.sortOrder ?? 0 })),
            );
          }
        }
      } catch (err) {
        console.error('Failed to fetch initial metadata:', err);
      }
    };
    fetchActiveMetadata();
  }, [itemId]);

  // --- Step 1: Update Variant Pool based on Specifications & Filters ---
  useEffect(() => {
    const fetchVariants = async () => {
      if (!itemId) return;

      const dimensionValueIds = Object.values(selectedDimensionValues).filter(Boolean);

      try {
        const response = await window.electronAPI.variantGetBySpecifications(
          itemId,
          selectedBrandId || '',
          selectedModeId || '',
          selectedUomId || '',
          dimensionValueIds,
        );

        if (response && response.success && Array.isArray(response.data)) {
          const variants = response.data;
          setAvailableVariants(variants);

          if (variants.length === 1 && variants[0]) {
            const singleVariant = variants[0];
            setResolvedVariant(singleVariant);
            if (singleVariant.skuCode) setSkuCode(singleVariant.skuCode);
            if (singleVariant.description) {
              setBaseName(singleVariant.description);
            }
          } else {
            setResolvedVariant(null);
            setSkuCode(initialData?.skuCode || '');
            setBaseName(initialData?.baseName || '');
          }
        } else {
          setAvailableVariants([]);
          setResolvedVariant(null);
          setSkuCode(initialData?.skuCode || '');
          setBaseName(initialData?.baseName || '');
        }
      } catch (error) {
        console.error('Failed to fetch variants by specifications:', error);
        setAvailableVariants([]);
        setResolvedVariant(null);
        setSkuCode(initialData?.skuCode || '');
        setBaseName(initialData?.baseName || '');
      }
    };

    fetchVariants();
  }, [
    itemId,
    selectedBrandId,
    selectedModeId,
    selectedUomId,
    selectedDimensionValues,
    initialData,
  ]);

  // --- Step 2: Facet Dimensions and Values based on Available Variant IDs ---
  useEffect(() => {
    const fetchFacetedDimensions = async () => {
      if (!itemId || availableVariants.length === 0) {
        setAvailableDimensions([]);
        setDimensionValuesMap({});
        return;
      }

      const variantIds = availableVariants.map((v) => v.id);

      try {
        const valRes = await window.electronAPI.dimensionValueGetByVariantIds(variantIds);

        if (valRes && valRes.success && Array.isArray(valRes.data)) {
          const allValues: any[] = valRes.data;

          const map: Record<string, any[]> = {};
          const dimsMap = new Map<string, attribute.Dimension>();

          allValues.forEach((val) => {
            const dimId = val.dimensionId;
            const dimName = val.dimensionName || 'Dimension';

            if (dimId) {
              if (!dimsMap.has(dimId)) {
                dimsMap.set(dimId, {
                  id: dimId,
                  name: dimName,
                  formName: dimName,
                  position: val.position,
                  dimensionPosition: val.dimensionPosition,
                  scope: val.scope,
                  dimensionScope: val.dimensionScope,
                  sortOrder: val.sortOrder,
                  dimensionSortOrder: val.dimensionSortOrder,
                } as any);
              }
              if (!map[dimId]) map[dimId] = [];
              if (!map[dimId].some((v) => v.id === val.id)) {
                map[dimId].push(val);
              }
            }
          });

          setAvailableDimensions(Array.from(dimsMap.values()));
          setDimensionValuesMap(map);
        }
      } catch (error) {
        console.error('Failed to facet dimensions from variants:', error);
      }
    };

    fetchFacetedDimensions();
  }, [availableVariants, itemId]);

  const handleResetDimension = (dimensionId: string) => {
    setSelectedDimensionValues((prev) => {
      const updated = { ...prev };
      delete updated[dimensionId];
      return updated;
    });
  };

  const handleSubmit = async () => {
    setIsBusy(true);
    try {
      const requestPayload: order.CreateRequestItem = {
        id: crypto.randomUUID(),
        variantId: resolvedVariant?.id || '',
        quantity: parseFloat(quantityValue) || 1,
        comments: commentsValue.trim() === '' ? null : commentsValue,
      };

      const requestResponse = await window.electronAPI.requestItemCreate(requestPayload);
      if (!requestResponse || !requestResponse.success) {
        throw new Error(requestResponse?.message || 'Failed to create request item.');
      }

      window.dispatchEvent(new CustomEvent('orders:refresh'));
      onSuccess('Successfully added variant!');
      onClose();
    } catch (error: any) {
      console.error(error);
      notifyApp(error.message || 'An error occurred during submission.', 'error');
    } finally {
      setIsBusy(false);
    }
  };

  const handleAddClick = () => {
    onClose();
    if (onAdd) {
      onAdd(initialData);
    }
  };

  const handleEditClick = () => {
    onClose();
    if (onEdit) {
      onEdit(initialData);
    }
  };

  return (
    <ModalTemplate title="Variant Selector" handleClose={onClose} className="modal-card-wide">
      <div className="workspaceGrid">
        {/* ================= LEFT PANEL (Identity & Meta) ================= */}
        <div className="leftPanel">
          <div className="formGroup">
            <span className="formLabel">SKU</span>
            <div
              className="skuLabelRow"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '4px',
                gap: '8px',
              }}
            >
              <div
                className="textStaticDisplay"
                style={{
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {skuCode || 'N/A'}
              </div>
              <button
                type="button"
                onClick={handleAddClick}
                title="Add User Variant"
                className="secondaryButton"
                style={{
                  width: '26px',
                  height: '26px',
                  padding: 0,
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                +
              </button>
              <button
                type="button"
                onClick={handleEditClick}
                title="Edit System Item"
                className="secondaryButton"
                style={{
                  width: '26px',
                  height: '26px',
                  padding: 0,
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                ✎
              </button>
            </div>
          </div>

          <div className="formGroup">
            <span className="formLabel">Display Name</span>
            <div className="textStaticDisplay">{displayName || 'N/A'}</div>
          </div>

          {/* <div className="imageSectionWrapper">
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

          <div className="formGroup">
            <span className="formLabel">Base Name</span>
            <div className="textStaticDisplay">{baseName || 'N/A'}</div>
          </div>

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
              {activeTab === 'systems' && (
                <div className="createSystemsSection">
                  <div className="selectedTagsContainer">
                    <span className="selectedTagsLabel">
                      Systems ({selectedCreateSystemIds.length})
                    </span>
                    <div className="tagsBox">
                      {selectedCreateSystemIds.length === 0 ? (
                        <span className="emptyTagsText">No systems.</span>
                      ) : (
                        selectedCreateSystemIds.map((id) => {
                          const found: any = activeApiSystems.find((s: any) => s.id === id);
                          return (
                            <span key={id} className="tagBadge">
                              {found ? found.formName || found.name : id}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'tags' && (
                <div className="createTagsSection">
                  <div className="selectedTagsContainer">
                    <span className="selectedTagsLabel">Tags ({selectedCreateTagIds.length})</span>
                    <div className="tagsBox">
                      {selectedCreateTagIds.length === 0 ? (
                        <span className="emptyTagsText">No tags.</span>
                      ) : (
                        selectedCreateTagIds.map((id) => {
                          const found: any = activeApiTags.find((t: any) => t.id === id);
                          return (
                            <span key={id} className="tagBadge">
                              {found ? found.formName || found.name : id}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'aliases' && (
                <div className="createAliasesSection">
                  <div className="selectedTagsContainer">
                    <span className="selectedTagsLabel">Aliases ({aliases.length})</span>
                    <div className="tagsBox">
                      {aliases.length === 0 ? (
                        <span className="emptyTagsText">No aliases.</span>
                      ) : (
                        aliases.map((item, index) => (
                          <span key={index} className="tagBadge">
                            {item.alias}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'system_data' && (
                <div className="systemDataContainer">
                  <div className="formGroup systemDataFormGroup">
                    <span className="formLabel systemDataLabel">SKU Source</span>
                    <div className="textStaticDisplay systemDataDisplay">{skuSource}</div>
                  </div>
                  <div className="formGroup systemDataFormGroup">
                    <span className="formLabel systemDataLabel">Material Type</span>
                    <div className="textStaticDisplay systemDataDisplay">{materialType}</div>
                  </div>
                  <div className="formGroup systemDataFormGroup">
                    <span className="formLabel systemDataLabel">Material Class</span>
                    <div className="textStaticDisplay systemDataDisplay">{materialClass}</div>
                  </div>
                  <div className="formGroup systemDataFormGroup">
                    <span className="formLabel systemDataLabel">Delimiter Type</span>
                    <div className="textStaticDisplay systemDataDisplay">{delimiterType}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= RIGHT PANEL (Faceted Specifications) ================= */}
        <div className="rightPanel">
          <div className="configuratorContent">
            <h4 className="sectionTitle">
              Variant Specifications - {availableVariants.length} possible variant(s)
            </h4>

            <div className="selectedTagsContainer specCard">
              {/* Split Row for Mode and UOM */}
              <div className="specsSplitRow">
                {/* Mode Section */}
                <div className="selectedTagsContainer specCard">
                  <span className="selectedTagsLabel specCardHeader">Mode</span>
                  <div className="tagsBox specTagsBox">
                    {itemModes.map((mode) => {
                      const isSelected = selectedModeId === mode.id;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setSelectedModeId(mode.id)}
                          className={`tagBadge specBadge ${isSelected ? 'specBadgeSelected' : 'specBadgeUnselected'}`}
                        >
                          {(mode as any).formName || (mode as any).name || mode.id}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* UOM Section */}
                <div className="selectedTagsContainer specCard">
                  <span className="selectedTagsLabel specCardHeader">UOM</span>
                  <div className="tagsBox specTagsBox">
                    {itemUoms.map((uom) => {
                      const isSelected = selectedUomId === uom.id;
                      return (
                        <button
                          key={uom.id}
                          type="button"
                          onClick={() => setSelectedUomId(uom.id)}
                          className={`tagBadge specBadge ${isSelected ? 'specBadgeSelected' : 'specBadgeUnselected'}`}
                        >
                          {(uom as any).formName || (uom as any).name || uom.id}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Brand Section */}
              <div className="selectedTagsContainer specCard">
                <span className="selectedTagsLabel specCardHeader">Brand</span>
                <div className="tagsBox specTagsBox">
                  {itemBrands.map((brand) => {
                    const isSelected = selectedBrandId === brand.id;
                    return (
                      <button
                        key={brand.id}
                        type="button"
                        onClick={() => setSelectedBrandId(brand.id)}
                        className={`tagBadge specBadge ${isSelected ? 'specBadgeSelected' : 'specBadgeUnselected'}`}
                      >
                        {(brand as any).formName || (brand as any).name || brand.id}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Faceted Dimension Sections */}
              {availableDimensions
                .slice()
                .sort((a: any, b: any) => {
                  const getPositionWeight = (pos?: string) => {
                    switch (pos) {
                      case 'prefix':
                        return 1;
                      case 'suffix':
                        return 2;
                      case 'dimensions':
                        return 3;
                      case 'end':
                        return 4;
                      default:
                        return 5;
                    }
                  };

                  const posA = getPositionWeight(a.dimensionPosition || a.position);
                  const posB = getPositionWeight(b.dimensionPosition || b.position);

                  if (posA !== posB) {
                    return posA - posB;
                  }

                  const scopeA = (a.dimensionScope || a.scope || '').toString();
                  const scopeB = (b.dimensionScope || b.scope || '').toString();
                  if (scopeA !== scopeB) {
                    return scopeA.localeCompare(scopeB);
                  }

                  const orderA = a.dimensionSortOrder ?? a.sortOrder ?? 0;
                  const orderB = b.dimensionSortOrder ?? b.sortOrder ?? 0;
                  return orderB - orderA;
                })
                .filter((dim) => {
                  const values = dimensionValuesMap[dim.id] || [];
                  return values.length > 0;
                })
                .map((dim) => {
                  const values = dimensionValuesMap[dim.id] || [];
                  const selectedValId = selectedDimensionValues[dim.id];
                  const dimensionDisplayName = (dim as any).name || 'Dimension';

                  return (
                    <div key={dim.id} className="selectedTagsContainer specCard">
                      <div className="specHeaderWrapper">
                        <span className="selectedTagsLabel specCardHeader">
                          {dimensionDisplayName}
                        </span>
                        <div className="specResetWrapper">
                          {selectedValId && (
                            <button
                              type="button"
                              onClick={() => handleResetDimension(dim.id)}
                              className="specResetButton"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="tagsBox specTagsBox">
                        {values.map((val) => {
                          const isSelected = selectedValId === val.id;
                          return (
                            <button
                              key={val.id}
                              type="button"
                              onClick={() =>
                                setSelectedDimensionValues((prev) => ({
                                  ...prev,
                                  [dim.id]: val.id,
                                }))
                              }
                              className={`tagBadge specBadge ${isSelected ? 'specBadgeSelected' : 'specBadgeUnselected'}`}
                            >
                              {(val as any).formName || (val as any).name || val.id}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

              {/* Comments Section */}
              <div className="selectedTagsContainer specCard">
                <span className="selectedTagsLabel specCardHeader">Comments</span>
                <div className="tagsBox specTagsBox">
                  <textarea
                    value={commentsValue}
                    onChange={(e) => setCommentsValue(e.target.value)}
                    placeholder="Enter comments"
                    className="commentsTextarea"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Quantity Section */}
            <div className="selectedTagsContainer quantityContainer">
              <span className="selectedTagsLabel quantityLabel">Quantity</span>
              <input
                type="text"
                value={quantityValue}
                onChange={(e) => setQuantityValue(e.target.value)}
                placeholder="Enter quantity"
                className="quantityInput"
              />
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
              disabled={isBusy || !resolvedVariant}
            >
              {isBusy ? 'Adding...' : 'Add Variant'}
            </button>
          </div>
        </div>
      </div>
    </ModalTemplate>
  );
}
