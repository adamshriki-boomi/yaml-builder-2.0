import { useEffect, useCallback } from 'react';
import { useConnector, useConnectorDispatch } from '../context/ConnectorContext';
import { configToYaml, yamlToConfig } from '../engine/yamlSync';

type ConnectorDispatch = ReturnType<typeof useConnectorDispatch>;

// Module-level so every caller (the editor's debounced typing AND a programmatic apply from the
// chat agent) shares ONE pending timer. This lets applyYamlText() cancel a stale editor parse,
// preventing it from overwriting a just-applied config ~1s later.
let editorDebounce: ReturnType<typeof setTimeout> | undefined;

export function useYamlSync() {
  const { config, syncSource } = useConnector();
  const dispatch = useConnectorDispatch();

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

    if (editorDebounce) {
      clearTimeout(editorDebounce);
    }

    editorDebounce = setTimeout(() => {
      try {
        const newConfig = yamlToConfig(yamlText);
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

// Apply a complete YAML document to the editor immediately (used by the AI chat "Apply" action).
// Cancels any pending editor debounce first, then sets the text and parses it to config in one go
// so the editor and the form both reflect the applied YAML without the 1s delay or a stale overwrite.
export function applyYamlText(dispatch: ConnectorDispatch, yamlText: string) {
  if (editorDebounce) {
    clearTimeout(editorDebounce);
    editorDebounce = undefined;
  }
  dispatch({ type: 'SET_YAML_TEXT', payload: yamlText });
  try {
    const newConfig = yamlToConfig(yamlText);
    dispatch({ type: 'SET_CONFIG', payload: newConfig });
    dispatch({ type: 'SET_YAML_ERROR', payload: null });
  } catch (e) {
    dispatch({ type: 'SET_YAML_ERROR', payload: (e as Error).message });
  }
}
