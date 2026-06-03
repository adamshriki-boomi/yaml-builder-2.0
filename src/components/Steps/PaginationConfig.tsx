import { ExInput, ExSelect, ExButton, ExIconButton, ExMenuItem, ButtonType, ButtonFlavor, IconButtonType, IconButtonFlavor } from '@boomi/exosphere';
import type { RestStep, BreakCondition } from '../../types/connector';

interface Props {
  step: RestStep;
  onChange: (updates: Partial<RestStep>) => void;
}

export default function PaginationConfig({ step, onChange }: Props) {
  const hasPagination = !!step.pagination;

  const enablePagination = () => {
    onChange({
      pagination: {
        type: 'page',
        page_param_name: 'page',
        page_size_param_name: 'page_size',
        start_value: 1,
        increment: 1,
        parameter_location: 'query',
        token_path: '',
        total_items_path: '',
        break_conditions: [],
      },
    });
  };

  const removePagination = () => {
    onChange({ pagination: undefined });
  };

  const updatePagination = (field: string, value: any) => {
    if (!step.pagination) return;
    onChange({ pagination: { ...step.pagination, [field]: value } });
  };

  const addBreakCondition = () => {
    if (!step.pagination) return;
    const cond: BreakCondition = {
      id: crypto.randomUUID(),
      type: 'empty_response',
      key: '',
      value: '',
    };
    updatePagination('break_conditions', [...step.pagination.break_conditions, cond]);
  };

  const updateBreakCondition = (id: string, field: keyof BreakCondition, value: any) => {
    if (!step.pagination) return;
    const updated = step.pagination.break_conditions.map(c =>
      c.id === id ? { ...c, [field]: value } : c
    );
    updatePagination('break_conditions', updated);
  };

  const removeBreakCondition = (id: string) => {
    if (!step.pagination) return;
    updatePagination('break_conditions', step.pagination.break_conditions.filter(c => c.id !== id));
  };

  return (
    <div className="form-section">
      <div className="form-section-title form-section-title--inline">
        Pagination
        {!hasPagination ? (
          <ExButton type={ButtonType.SECONDARY} flavor={ButtonFlavor.BASE} onClick={enablePagination}>Enable</ExButton>
        ) : (
          <ExButton type={ButtonType.SECONDARY} flavor={ButtonFlavor.RISKY} onClick={removePagination}>Remove</ExButton>
        )}
      </div>

      {hasPagination && step.pagination && (
        <div className="form-indent">
          <div className="form-row">
            <ExSelect
              label="Pagination Type"
              selected={step.pagination.type}
              valueBasedSelection
              onChange={(e: any) => {
                const val = e.detail?.value;
                if (val) updatePagination('type', val);
              }}
            >
              <ExMenuItem value="page">Page-based</ExMenuItem>
              <ExMenuItem value="offset">Offset-based</ExMenuItem>
              <ExMenuItem value="cursor">Cursor-based</ExMenuItem>
            </ExSelect>
            <ExSelect
              label="Parameter Location"
              selected={step.pagination.parameter_location}
              valueBasedSelection
              onChange={(e: any) => {
                const val = e.detail?.value;
                if (val) updatePagination('parameter_location', val);
              }}
            >
              <ExMenuItem value="query">Query String</ExMenuItem>
              <ExMenuItem value="headers">Headers</ExMenuItem>
              <ExMenuItem value="body">Body</ExMenuItem>
            </ExSelect>
          </div>

          {step.pagination.type === 'cursor' ? (
            <div className="form-field">
              <ExInput
                label="Token Path"
                value={step.pagination.token_path}
                placeholder="e.g., $.links.next"
                onInput={(e: any) => updatePagination('token_path', e.target.value)}
              />
            </div>
          ) : (
            <>
              <div className="form-row">
                <ExInput
                  label="Page Param Name"
                  value={step.pagination.page_param_name}
                  placeholder="page"
                  onInput={(e: any) => updatePagination('page_param_name', e.target.value)}
                />
                <ExInput
                  label="Page Size Param"
                  value={step.pagination.page_size_param_name}
                  placeholder="page_size"
                  onInput={(e: any) => updatePagination('page_size_param_name', e.target.value)}
                />
              </div>
              <div className="form-row">
                <ExInput
                  label="Start Value"
                  type="number"
                  value={String(step.pagination.start_value)}
                  onInput={(e: any) => updatePagination('start_value', Number(e.target.value))}
                />
                <ExInput
                  label="Increment"
                  type="number"
                  value={String(step.pagination.increment)}
                  onInput={(e: any) => updatePagination('increment', Number(e.target.value))}
                />
              </div>
            </>
          )}

          {/* Break Conditions */}
          <div className="form-section">
            <div className="form-section-title form-section-title--inline">
              <span>Break Conditions</span>
              <ExButton type={ButtonType.SECONDARY} flavor={ButtonFlavor.BASE} onClick={addBreakCondition}>Add</ExButton>
            </div>
            {step.pagination.break_conditions.map(cond => (
              <div key={cond.id} className="form-row" style={{ alignItems: 'flex-end' }}>
                <ExSelect
                  label="Type"
                  selected={cond.type}
                  valueBasedSelection
                  onChange={(e: any) => {
                    const val = e.detail?.value;
                    if (val) updateBreakCondition(cond.id, 'type', val);
                  }}
                >
                  <ExMenuItem value="empty_response">Empty Response</ExMenuItem>
                  <ExMenuItem value="page_size_mismatch">Page Size Mismatch</ExMenuItem>
                  <ExMenuItem value="total_items_reached">Total Items Reached</ExMenuItem>
                  <ExMenuItem value="boolean_field">Boolean Field</ExMenuItem>
                </ExSelect>
                <ExInput
                  label="Key"
                  value={cond.key}
                  placeholder="e.g., $.has_more"
                  onInput={(e: any) => updateBreakCondition(cond.id, 'key', e.target.value)}
                />
                <ExIconButton type={IconButtonType.SECONDARY} flavor={IconButtonFlavor.RISKY} icon="delete" label="Delete condition" onClick={() => removeBreakCondition(cond.id)} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
