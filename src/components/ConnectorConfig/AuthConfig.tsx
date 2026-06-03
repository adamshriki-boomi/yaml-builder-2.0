import { ExInput, ExSelect, ExToggle, ExLabel, ExMenuItem } from '@boomi/exosphere';
import { useConnector, useConnectorDispatch } from '../../context/ConnectorContext';
import type { AuthType, OAuthGrantType } from '../../types/connector';

export default function AuthConfigSection() {
  const { config } = useConnector();
  const dispatch = useConnectorDispatch();

  const setAuthType = (type: AuthType) => {
    dispatch({
      type: 'UPDATE_CONFIG',
      payload: {
        auth: {
          ...config.auth,
          type,
          ...(type === 'oauth2' ? {
            oauth: config.auth.oauth || {
              grant_type: 'authorization_code' as OAuthGrantType,
              token_url: '',
              refresh_token: '',
              use_base64: false,
            },
          } : {}),
        },
      },
    });
  };

  const updateOAuth = (field: string, value: string | boolean) => {
    dispatch({
      type: 'UPDATE_CONFIG',
      payload: {
        auth: {
          ...config.auth,
          oauth: {
            ...config.auth.oauth!,
            [field]: value,
          },
        },
      },
    });
  };

  return (
    <div>
      <div className="form-field">
        <ExSelect
          label="Auth Type"
          selected={config.auth.type}
          valueBasedSelection
          onChange={(e: any) => {
            const val = e.detail?.value;
            if (val) setAuthType(val as AuthType);
          }}
        >
          <ExMenuItem value="bearer">Bearer Token</ExMenuItem>
          <ExMenuItem value="basic_http">Basic HTTP</ExMenuItem>
          <ExMenuItem value="api_key">API Key</ExMenuItem>
          <ExMenuItem value="oauth2">OAuth 2.0</ExMenuItem>
        </ExSelect>
      </div>

      {config.auth.type === 'oauth2' && config.auth.oauth && (
        <div className="form-indent">
          <div className="form-field">
            <ExSelect
              label="Grant Type"
              selected={config.auth.oauth.grant_type}
              valueBasedSelection
              onChange={(e: any) => {
                const val = e.detail?.value;
                if (val) updateOAuth('grant_type', val);
              }}
            >
              <ExMenuItem value="authorization_code">Authorization Code</ExMenuItem>
              <ExMenuItem value="client_credentials">Client Credentials</ExMenuItem>
            </ExSelect>
          </div>
          <div className="form-field">
            <ExInput
              label="Token URL"
              value={config.auth.oauth.token_url}
              placeholder="e.g., https://auth.example.com/token"
              onInput={(e: any) => updateOAuth('token_url', e.target.value)}
            />
          </div>
          <div className="form-field">
            <ExInput
              label="Refresh Token"
              value={config.auth.oauth.refresh_token}
              placeholder="Refresh token value"
              onInput={(e: any) => updateOAuth('refresh_token', e.target.value)}
            />
          </div>
          <div className="toggle-row">
            <ExToggle
              on={config.auth.oauth.use_base64}
              onChange={() => updateOAuth('use_base64', !config.auth.oauth!.use_base64)}
            />
            <ExLabel>Use Base64 Encoding</ExLabel>
          </div>
        </div>
      )}
    </div>
  );
}
