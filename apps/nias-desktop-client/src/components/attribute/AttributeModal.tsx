import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ModalTemplate from '../modals/ModalTemplate';
import type { FieldOverride } from './attributeFactory';

interface AttributeModalProps {
  title: string;
  submitLabel: string;
  schema: z.ZodObject<any>;
  defaultValues: Record<string, unknown>;
  fieldOverrides?: Record<string, FieldOverride> | undefined;
  onSubmitValues: (values: Record<string, unknown>) => Promise<{ success: boolean; message?: string }>;
  handleClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

function humanizeFieldName(value: string): string {
  return value
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (letter) => letter.toUpperCase())
    .trim();
}

function getShape(schema: z.ZodObject<any>): Record<string, z.ZodTypeAny> {
  return schema.shape;
}

function isOptional(schema: z.ZodTypeAny): boolean {
  const schemaName = (schema as any)?._def?.typeName;
  if (schemaName === 'ZodOptional' || schemaName === 'ZodDefault') {
    return true;
  }

  if (schemaName === 'ZodNullable') {
    return true;
  }

  if ((schema as any)?.unwrap) {
    return isOptional((schema as any).unwrap());
  }

  return false;
}

function unwrapSchema(schema: z.ZodTypeAny): z.ZodTypeAny {
  let current = schema;
  while ((current as any)?.unwrap) {
    current = (current as any).unwrap();
  }
  return current;
}

function resolveInputType(
  schema: z.ZodTypeAny,
  override?: FieldOverride,
): 'text' | 'number' | 'select' {
  if (override?.type) {
    return override.type;
  }

  const unwrapped = unwrapSchema(schema);

  if (unwrapped instanceof z.ZodEnum) {
    return 'select';
  }

  if (unwrapped instanceof z.ZodNumber) {
    return 'number';
  }

  return 'text';
}

function resolveEnumOptions(schema: z.ZodTypeAny): { value: string; label: string }[] {
  const unwrapped = unwrapSchema(schema);
  if (!(unwrapped instanceof z.ZodEnum)) {
    return [];
  }

  const options = [...unwrapped.options] as Array<string | number>;
  return options.map((rawOption) => {
    const option = String(rawOption);
    return {
      value: option,
      label: humanizeFieldName(option),
    };
  });
}

export default function AttributeModal({
  title,
  submitLabel,
  schema,
  defaultValues,
  fieldOverrides,
  onSubmitValues,
  handleClose,
  onSuccess,
  onError,
}: AttributeModalProps) {
  const [isBusy, setIsBusy] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const form = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const fields = useMemo(() => {
    const shape = getShape(schema) as Record<string, z.ZodTypeAny>;
    const entries = Object.entries(shape) as Array<[string, z.ZodTypeAny]>;

    return entries.map(([fieldName, fieldSchema]) => {
      const override = fieldOverrides?.[fieldName];
      const type = resolveInputType(fieldSchema, override);
      return {
        name: fieldName,
        schema: fieldSchema,
        label: override?.label || humanizeFieldName(fieldName),
        placeholder: override?.placeholder || `Enter ${humanizeFieldName(fieldName).toLowerCase()}`,
        type,
        options: override?.options || resolveEnumOptions(fieldSchema),
        step: override?.step || '1',
        optional: isOptional(fieldSchema),
      };
    });
  }, [fieldOverrides, schema]);

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsBusy(true);
    setSubmitError('');

    try {
      const result = await onSubmitValues(values);
      if (!result.success) {
        const message = result.message || 'Failed to save changes';
        setSubmitError(message);
        onError(message);
        return;
      }

      const message = result.message || 'Saved successfully';
      onSuccess(message);
      handleClose();
    } catch {
      const message = 'Failed to save changes: Connection error';
      setSubmitError(message);
      onError(message);
    } finally {
      setIsBusy(false);
    }
  });

  return (
    <ModalTemplate title={title} handleClose={handleClose}>
      <form onSubmit={handleSubmit}>
        <div className="modal-fields">
          {fields.map((field) => {
            const error = form.formState.errors[field.name];
            const errorText = error?.message ? String(error.message) : '';

            if (field.type === 'select') {
              return (
                <div key={field.name}>
                  <label htmlFor={`field-${field.name}`}>{field.label}</label>
                  <select
                    id={`field-${field.name}`}
                    disabled={isBusy}
                    {...form.register(field.name)}
                  >
                    <option value="">Select {field.label}</option>
                    {field.options.map((option) => (
                      <option key={`${field.name}-${option.value}`} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errorText ? <div className="form-error">{errorText}</div> : null}
                </div>
              );
            }

            if (field.type === 'number') {
              return (
                <div key={field.name}>
                  <label htmlFor={`field-${field.name}`}>{field.label}</label>
                  <input
                    id={`field-${field.name}`}
                    type="number"
                    step={field.step}
                    placeholder={field.placeholder}
                    disabled={isBusy}
                    {...form.register(field.name, {
                      setValueAs: (value) => {
                        const text = String(value ?? '').trim();
                        if (!text) {
                          return field.optional ? undefined : 0;
                        }

                        const parsed = Number.parseFloat(text);
                        return Number.isFinite(parsed) ? parsed : field.optional ? undefined : 0;
                      },
                    })}
                  />
                  {errorText ? <div className="form-error">{errorText}</div> : null}
                </div>
              );
            }

            return (
              <div key={field.name}>
                <label htmlFor={`field-${field.name}`}>{field.label}</label>
                <input
                  id={`field-${field.name}`}
                  type="text"
                  placeholder={field.placeholder}
                  disabled={isBusy}
                  {...form.register(field.name)}
                />
                {errorText ? <div className="form-error">{errorText}</div> : null}
              </div>
            );
          })}
        </div>

        <div className="actions">
          <button className="secondary" type="button" onClick={handleClose} disabled={isBusy}>
            Cancel
          </button>
          <button className="primary" type="submit" disabled={isBusy}>
            {submitLabel}
          </button>
        </div>

        {submitError ? <div className="status error">{submitError}</div> : null}
      </form>
    </ModalTemplate>
  );
}
