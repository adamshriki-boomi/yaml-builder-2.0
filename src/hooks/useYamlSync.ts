import { useEffect, useRef, useCallback } from 'react';
import { useConnector, useConnectorDispatch } from '../context/ConnectorContext';
import { configToYaml, yamlToConfig } from '../engine/yamlSync';

export function useYamlSync() {
  const { config, syncSource } = useConnector();
  const dispatch = useConnectorDispatch();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isUpdatingFromEditor = useRef(false);

  // UI → YAML: When config changes from UI, generate YAML
  useEffect(() => {
    if (syncSource === 'ui' || syncSource === null) {
      const yaml = configToYaml(config);
      dispatch({ type: 'SET_YAML_TEXT', payload: yaml });
      // Reset sync source after updating
      dispatch({ type: 'SET_SYNC_SOURCE', payload: null });
    }
  }, [config, syncSource]);

  // Editor → UI: When YAML text changes from editor, parse and update config
  const handleEditorChange = useCallback((yamlText: string) => {
    dispatch({ type: 'SET_YAML_TEXT', payload: yamlText });

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      try {
        const newConfig = yamlToConfig(yamlText);
        isUpdatingFromEditor.current = true;
        dispatch({ type: 'SET_CONFIG', payload: newConfig });
        dispatch({ type: 'SET_YAML_ERROR', payload: null });
        // Note: leave syncSource as 'editor' so the UI→YAML effect doesn't
        // regenerate canonical YAML and overwrite the user's typed/formatted text.
        // The next UI change will flip syncSource to 'ui' and regenerate normally.
      } catch (e) {
        dispatch({ type: 'SET_YAML_ERROR', payload: (e as Error).message });
      }
    }, 1000);
  }, [dispatch]);

  return { handleEditorChange };
}
