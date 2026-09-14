import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../services/client';
import useAuthStore from '../store/useAuthStore';

const DeveloperApi = () => {
  const { user, refreshProfile } = useAuthStore();
  const [token, setToken] = useState('');
  const [ips, setIps] = useState((user?.whitelistIps || []).join('\n'));
  const [webhookUrl, setWebhookUrl] = useState(user?.webhookUrl || '');
  const [message, setMessage] = useState('');
  const enabled = Boolean(user?.isApiEnabled);
  const generate = async () => { try { const result = await apiClient.auth.generateApiToken(); setToken(result?.apiToken || ''); await refreshProfile(); } catch (error) { setMessage(error?.message || 'Unable to generate token.'); } };
  const save = async () => { try { await apiClient.auth.updateApiSettings({ whitelistIps: ips.split(/\n|,/).map((value) => value.trim()).filter(Boolean), webhookUrl: webhookUrl.trim() || null }); await refreshProfile(); setMessage('API settings saved.'); } catch (error) { setMessage(error?.message || 'Unable to save settings.'); } };
  const copy = async () => { try { await navigator.clipboard.writeText(token); setMessage('Token copied.'); } catch (_) { setMessage('Copy the token manually.'); } };
  return <main className="mx-auto max-w-3xl p-5"><div className="rounded-2xl border border-[color:rgb(var(--color-border-rgb)/.7)] bg-[color:rgb(var(--color-card-rgb))] p-6"><div className="flex items-center justify-between gap-4"><div><h1 className="text-2xl font-bold">Developer API</h1><p className="mt-1 text-sm text-[var(--color-text-secondary)]">Manage Canonical B2B access for your MS STORE account.</p></div><Link className="text-sm font-semibold text-[var(--color-primary)]" to="/api-docs">API documentation</Link></div><p className="mt-5 text-sm">API access is <b>{enabled ? 'enabled' : 'not enabled'}</b>.</p><button className="mt-3 rounded-xl bg-[var(--color-primary)] px-4 py-2 font-semibold text-[var(--color-button-text)] disabled:opacity-50" disabled={!enabled} onClick={generate}>Generate / regenerate token</button>{token && <div className="mt-4"><p className="text-sm font-semibold">Copy this token now. It will not be shown again.</p><textarea readOnly value={token} className="mt-2 w-full rounded-lg border p-2 font-mono text-xs" rows="3" /><button className="mt-2 rounded-lg border px-3 py-1.5 text-sm font-semibold" onClick={copy}>Copy token</button></div>}<label className="mt-5 block text-sm font-semibold">Allowed IP addresses (one per line)</label><textarea disabled={!enabled} value={ips} onChange={(event) => setIps(event.target.value)} className="mt-2 w-full rounded-lg border p-2" rows="4" /><label className="mt-4 block text-sm font-semibold">Webhook URL</label><input disabled={!enabled} value={webhookUrl} onChange={(event) => setWebhookUrl(event.target.value)} className="mt-2 w-full rounded-lg border p-2" placeholder="https://example.com/webhook" /><button className="mt-4 rounded-xl border px-4 py-2 font-semibold disabled:opacity-50" disabled={!enabled} onClick={save}>Save API settings</button>{message && <p className="mt-3 text-sm">{message}</p>}</div></main>;
};
export default DeveloperApi;
