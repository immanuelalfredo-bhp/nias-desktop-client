import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import type { StatusState } from '../types';
import StatusFooter from '../components/layout/StatusFooter';
import AttributeTabs from '../components/attribute/AttributeTabs';
import AttributeTable from '../components/attribute/AttributeTable';
import AttributeModal from '../components/attribute/AttributeModal';
import {
  attributeEntityDefinitions,
  buildAttributeCrudFactories,
  type AttributeEntityKey,
} from '../components/attribute/attributeFactory';

interface AttributeRow {
  id: string;
  deletedAt?: string | null;
  [key: string]: unknown;
}

interface EntityState {
  active: AttributeRow[];
  deleted: AttributeRow[];
  search: string;
  isLoading: boolean;
}

interface ModalState {
  mode: 'create' | 'edit';
  entity: AttributeEntityKey;
  row?: AttributeRow;
}

function normalizeTerm(value: string): string {
  return value.trim().toLowerCase();
}

function createInitialState(): Record<AttributeEntityKey, EntityState> {
  return {
    brand: { active: [], deleted: [], search: '', isLoading: false },
    category: { active: [], deleted: [], search: '', isLoading: false },
    dimension: { active: [], deleted: [], search: '', isLoading: false },
    dimensionValue: { active: [], deleted: [], search: '', isLoading: false },
    mode: { active: [], deleted: [], search: '', isLoading: false },
    system: { active: [], deleted: [], search: '', isLoading: false },
    tag: { active: [], deleted: [], search: '', isLoading: false },
    uom: { active: [], deleted: [], search: '', isLoading: false },
    vendor: { active: [], deleted: [], search: '', isLoading: false },
  };
}

function unwrapSchema(schema: z.ZodTypeAny): z.ZodTypeAny {
  let current = schema;
  while ((current as any)?.unwrap) {
    current = (current as any).unwrap();
  }
  return current;
}

function createSchemaDefaults(schema: z.ZodObject<any>, row?: AttributeRow): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  const shape = schema.shape;

  Object.keys(shape).forEach((fieldName) => {
    if (row && row[fieldName] !== undefined) {
      defaults[fieldName] = row[fieldName];
      return;
    }

    const fieldSchema = unwrapSchema(shape[fieldName]);

    if (fieldSchema instanceof z.ZodNumber) {
      defaults[fieldName] = 0;
      return;
    }

    if (fieldSchema instanceof z.ZodEnum) {
      defaults[fieldName] = fieldSchema.options[0] ?? '';
      return;
    }

    defaults[fieldName] = '';
  });

  return defaults;
}

export default function AttributesPage() {
  const [activeTab, setActiveTab] = useState<AttributeEntityKey>('brand');
  const [entityState, setEntityState] = useState<Record<AttributeEntityKey, EntityState>>(
    createInitialState,
  );
  const [modalState, setModalState] = useState<ModalState | null>(null);
  const [status, setStatus] = useState<StatusState>({ text: 'User logged in', isError: false });

  const factories = useMemo(() => buildAttributeCrudFactories(), []);
  const entityKeys = useMemo(
    () => Object.keys(attributeEntityDefinitions) as AttributeEntityKey[],
    [],
  );

  const refreshEntity = async (entityKey: AttributeEntityKey): Promise<boolean> => {
    setEntityState((prev) => ({
      ...prev,
      [entityKey]: {
        ...prev[entityKey],
        isLoading: true,
      },
    }));

    try {
      const [activeResponse, deletedResponse] = await Promise.all([
        factories[entityKey].listActive(),
        factories[entityKey].listDeleted(),
      ]);

      if (!activeResponse.success || !deletedResponse.success) {
        const message =
          activeResponse.message ||
          deletedResponse.message ||
          `Failed to refresh ${attributeEntityDefinitions[entityKey].label.toLowerCase()}`;
        setStatus({ text: message, isError: true });

        setEntityState((prev) => ({
          ...prev,
          [entityKey]: {
            ...prev[entityKey],
            isLoading: false,
          },
        }));
        return false;
      }

      setEntityState((prev) => ({
        ...prev,
        [entityKey]: {
          ...prev[entityKey],
          active: (activeResponse.data || []) as AttributeRow[],
          deleted: (deletedResponse.data || []) as AttributeRow[],
          isLoading: false,
        },
      }));
      return true;
    } catch {
      setStatus({ text: 'Failed to refresh attributes: Connection error', isError: true });
      setEntityState((prev) => ({
        ...prev,
        [entityKey]: {
          ...prev[entityKey],
          isLoading: false,
        },
      }));
      return false;
    }
  };

  useEffect(() => {
    void Promise.all(entityKeys.map((entityKey) => refreshEntity(entityKey)));
  }, [entityKeys]);

  const currentDefinition = attributeEntityDefinitions[activeTab];
  const currentState = entityState[activeTab];

  const searchTerm = normalizeTerm(currentState.search);

  const filteredActive = useMemo(() => {
    if (!searchTerm) {
      return currentState.active;
    }

    return currentState.active.filter((row) =>
      currentDefinition.searchKeys.some((key) =>
        String(row[key] ?? '')
          .toLowerCase()
          .includes(searchTerm),
      ),
    );
  }, [currentDefinition.searchKeys, currentState.active, searchTerm]);

  const filteredDeleted = useMemo(() => {
    if (!searchTerm) {
      return currentState.deleted;
    }

    return currentState.deleted.filter((row) =>
      currentDefinition.searchKeys.some((key) =>
        String(row[key] ?? '')
          .toLowerCase()
          .includes(searchTerm),
      ),
    );
  }, [currentDefinition.searchKeys, currentState.deleted, searchTerm]);

  const rows = useMemo(() => [...filteredActive, ...filteredDeleted], [filteredActive, filteredDeleted]);

  const runMutation = async (
    entityKey: AttributeEntityKey,
    action: 'delete' | 'restore',
    row: AttributeRow,
  ) => {
    const definition = attributeEntityDefinitions[entityKey];
    const rowName = String(row.name ?? row.id);

    setStatus({
      text: `${action === 'delete' ? 'Deleting' : 'Restoring'} ${definition.label.slice(0, -1)} ${rowName}...`,
      isError: false,
    });

    try {
      const result = await factories[entityKey][action]({ id: row.id });
      if (!result.success) {
        setStatus({
          text:
            result.message ||
            `Failed to ${action} ${definition.label.slice(0, -1).toLowerCase()}`,
          isError: true,
        });
        return;
      }

      await refreshEntity(entityKey);
      setStatus({
        text:
          result.message ||
          `${definition.label.slice(0, -1)} ${action === 'delete' ? 'deleted' : 'restored'} successfully`,
        isError: false,
      });
    } catch {
      setStatus({ text: `Failed to ${action}: Connection error`, isError: true });
    }
  };

  const modalDefinition = modalState ? attributeEntityDefinitions[modalState.entity] : null;
  const modalSchema = useMemo(() => {
    if (!modalState || !modalDefinition) {
      return null;
    }

    if (modalState.mode === 'create') {
      return modalDefinition.createSchema;
    }

    return modalDefinition.updateSchema.omit({ id: true });
  }, [modalDefinition, modalState]);

  const modalDefaults = useMemo(() => {
    if (!modalSchema) {
      return {};
    }

    return createSchemaDefaults(modalSchema, modalState?.row);
  }, [modalSchema, modalState?.row]);

  return (
    <section id="attributesScreen" className="card panel app-screen attributes-page fluid-card">
      <h1>Attributes</h1>
      <p className="muted subtitle-tight">Manage all attribute entities in one tabbed workspace.</p>

      <AttributeTabs
        tabs={entityKeys.map((entityKey) => ({
          key: entityKey,
          label: attributeEntityDefinitions[entityKey].label,
        }))}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <div className="attribute-toolbar unified">
        <button
          className="primary"
          type="button"
          onClick={() => setModalState({ mode: 'create', entity: activeTab })}
        >
          {currentDefinition.createLabel}
        </button>
        <input
          type="text"
          placeholder={currentDefinition.searchPlaceholder}
          value={currentState.search}
          onChange={(event) =>
            setEntityState((prev) => ({
              ...prev,
              [activeTab]: {
                ...prev[activeTab],
                search: event.target.value,
              },
            }))
          }
        />
      </div>

      {currentState.isLoading ? <p className="muted">Loading {currentDefinition.label.toLowerCase()}...</p> : null}

      <AttributeTable
        definition={currentDefinition}
        rows={rows}
        totalActive={currentState.active.length}
        totalDeleted={currentState.deleted.length}
        onEdit={(row) => setModalState({ mode: 'edit', entity: activeTab, row })}
        onDelete={(row) => void runMutation(activeTab, 'delete', row)}
        onRestore={(row) => void runMutation(activeTab, 'restore', row)}
      />

      <StatusFooter status={status} />

      {modalState && modalDefinition && modalSchema ? (
        <AttributeModal
          title={modalState.mode === 'create' ? modalDefinition.createLabel : modalDefinition.updateLabel}
          submitLabel={modalState.mode === 'create' ? 'Create' : 'Save Changes'}
          schema={modalSchema}
          defaultValues={modalDefaults}
          fieldOverrides={modalDefinition.fieldOverrides}
          handleClose={() => setModalState(null)}
          onSuccess={async (message) => {
            setModalState(null);
            await refreshEntity(modalState.entity);
            setStatus({ text: message, isError: false });
          }}
          onError={(message) => setStatus({ text: message, isError: true })}
          onSubmitValues={async (values) => {
            if (modalState.mode === 'create') {
              const payload = modalDefinition.createPayload(values);
              return factories[modalState.entity].create(payload);
            }

            const payload = modalDefinition.updatePayload(modalState.row?.id || '', values);
            return factories[modalState.entity].update(payload);
          }}
        />
      ) : null}
    </section>
  );
}
