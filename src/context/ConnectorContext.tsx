import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react';
import { type ConnectorConfig, createDefaultConnector } from '../types/connector';

type SyncSource = 'ui' | 'editor' | null;

interface ConnectorState {
  config: ConnectorConfig;
  yamlText: string;
  yamlError: string | null;
  syncSource: SyncSource;
}

type ConnectorAction =
  | { type: 'UPDATE_CONFIG'; payload: Partial<ConnectorConfig> }
  | { type: 'SET_CONFIG'; payload: ConnectorConfig }
  | { type: 'SET_YAML_TEXT'; payload: string }
  | { type: 'SET_YAML_ERROR'; payload: string | null }
  | { type: 'SET_SYNC_SOURCE'; payload: SyncSource }
  | { type: 'RESET'; payload?: ConnectorConfig };

const initialState: ConnectorState = {
  config: createDefaultConnector(),
  yamlText: '',
  yamlError: null,
  syncSource: null,
};

function connectorReducer(state: ConnectorState, action: ConnectorAction): ConnectorState {
  switch (action.type) {
    case 'UPDATE_CONFIG':
      return {
        ...state,
        config: { ...state.config, ...action.payload },
        syncSource: 'ui',
      };
    case 'SET_CONFIG':
      return {
        ...state,
        config: action.payload,
      };
    case 'SET_YAML_TEXT':
      return {
        ...state,
        yamlText: action.payload,
        syncSource: 'editor',
      };
    case 'SET_YAML_ERROR':
      return {
        ...state,
        yamlError: action.payload,
      };
    case 'SET_SYNC_SOURCE':
      return {
        ...state,
        syncSource: action.payload,
      };
    case 'RESET':
      return {
        ...initialState,
        config: action.payload || createDefaultConnector(),
      };
    default:
      return state;
  }
}

const ConnectorContext = createContext<ConnectorState>(initialState);
const ConnectorDispatchContext = createContext<Dispatch<ConnectorAction>>(() => {});

export function ConnectorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(connectorReducer, initialState);

  return (
    <ConnectorContext.Provider value={state}>
      <ConnectorDispatchContext.Provider value={dispatch}>
        {children}
      </ConnectorDispatchContext.Provider>
    </ConnectorContext.Provider>
  );
}

export function useConnector() {
  return useContext(ConnectorContext);
}

export function useConnectorDispatch() {
  return useContext(ConnectorDispatchContext);
}
