"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";
import type { PlayerConfig } from "@/lib/types";

type ConfigResponse = {
  config: PlayerConfig;
  defaults?: PlayerConfig;
};

export default function PlayerConfigPage() {
  const [config, setConfig] = useState<PlayerConfig | null>(null);
  const [backupText, setBackupText] = useState("");
  const [publicUrl, setPublicUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const applyConfig = useCallback((next: PlayerConfig) => {
    setConfig(next);
    setBackupText(next.backup_server_urls.join("\n"));
  }, []);

  useEffect(() => {
    setPublicUrl(`${window.location.origin}/api/player/config`);
  }, []);

  useEffect(() => {
    let active = true;
    adminFetch<ConfigResponse>("/api/admin/config")
      .then((result) => {
        if (!active) return;
        applyConfig(result.config);
      })
      .catch((caught) => {
        if (!active) return;
        setError(
          caught instanceof Error ? caught.message : "Could not load player config",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [applyConfig]);

  function patch<K extends keyof PlayerConfig>(key: K, value: PlayerConfig[K]) {
    setConfig((current) => (current ? { ...current, [key]: value } : current));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!config) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const payload: PlayerConfig = {
        ...config,
        backup_server_urls: backupText
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
      };
      const result = await adminFetch<ConfigResponse>("/api/admin/config", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      applyConfig(result.config);
      setNotice("Player configuration saved. Devices pick it up on next start.");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not save player config",
      );
    } finally {
      setSaving(false);
    }
  }

  async function resetToDefaults() {
    if (!window.confirm("Replace all values with the built-in defaults?")) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await adminFetch<ConfigResponse>("/api/admin/config");
      const next = result.defaults ?? result.config;
      const saved = await adminFetch<ConfigResponse>("/api/admin/config", {
        method: "PUT",
        body: JSON.stringify(next),
      });
      applyConfig(saved.config);
      setNotice("Reset to defaults.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not reset config");
    } finally {
      setSaving(false);
    }
  }

  async function copyPublicUrl() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Could not copy to clipboard");
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">
            Player remote config
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            App configuration
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            These values are served to every player. The app downloads them on
            launch, so changes apply the next time a device starts. Secrets are
            stored server-side and only sent to the public endpoint the player
            already reads.
          </p>
        </div>
        <button type="button" className="btn-secondary" onClick={resetToDefaults}>
          Reset to defaults
        </button>
      </div>

      <div className="admin-card mt-5 flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <span className="admin-label">Public config endpoint</span>
          <p className="truncate font-mono text-xs text-cyan-200">{publicUrl}</p>
        </div>
        <button
          type="button"
          className="btn-secondary shrink-0"
          onClick={copyPublicUrl}
        >
          {copied ? "Copied" : "Copy URL"}
        </button>
      </div>

      {notice ? (
        <div className="mt-5 flex items-center justify-between rounded-xl border border-emerald-300/20 bg-emerald-300/[0.07] px-4 py-3 text-sm text-emerald-200">
          <span>{notice}</span>
          <button
            type="button"
            className="text-xs font-semibold text-emerald-300"
            onClick={() => setNotice("")}
          >
            Dismiss
          </button>
        </div>
      ) : null}
      {error ? (
        <div className="mt-5 rounded-xl border border-rose-300/20 bg-rose-300/[0.07] px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {loading || !config ? (
        <div className="admin-card mt-5 px-5 py-12 text-center text-sm text-slate-500">
          {error ? "Could not load configuration." : "Loading configuration..."}
        </div>
      ) : (
        <form className="mt-5 space-y-5" onSubmit={submit}>
          <Section
            title="Server"
            hint="Default Xtream server the player suggests, plus optional backups."
          >
            <label className="block sm:col-span-2">
              <span className="admin-label">Primary server URL</span>
              <input
                className="admin-input"
                value={config.server_url}
                onChange={(event) => patch("server_url", event.target.value)}
                placeholder="http://your-panel.com:8080"
                spellCheck={false}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="admin-label">
                Backup server URLs (one per line)
              </span>
              <textarea
                className="admin-input font-mono text-xs"
                rows={3}
                value={backupText}
                onChange={(event) => setBackupText(event.target.value)}
                placeholder={"http://backup1.com:8080\nhttp://backup2.com:8080"}
                spellCheck={false}
              />
            </label>
            <Toggle
              label="Hide the server URL input"
              checked={config.hide_server_url_input}
              onChange={(value) => patch("hide_server_url_input", value)}
            />
          </Section>

          <Section
            title="Branding text"
            hint="Marketing line and pricing note shown on the login screen."
          >
            <Toggle
              label="Show marketing text"
              checked={config.show_marketing_text}
              onChange={(value) => patch("show_marketing_text", value)}
            />
            <label className="block sm:col-span-2">
              <span className="admin-label">Marketing text</span>
              <textarea
                className="admin-input"
                rows={2}
                value={config.marketing_text}
                onChange={(event) => patch("marketing_text", event.target.value)}
                maxLength={500}
              />
            </label>
            <Toggle
              label="Show pricing text"
              checked={config.show_pricing}
              onChange={(value) => patch("show_pricing", value)}
            />
            <label className="block sm:col-span-2">
              <span className="admin-label">Pricing text</span>
              <input
                className="admin-input"
                value={config.pricing_text}
                onChange={(event) => patch("pricing_text", event.target.value)}
                maxLength={500}
              />
            </label>
          </Section>

          <Section
            title="QR setup"
            hint="QR code shown to help users add a playlist on the website."
          >
            <label className="block">
              <span className="admin-label">QR setup URL</span>
              <input
                className="admin-input"
                value={config.qr_setup_url}
                onChange={(event) => patch("qr_setup_url", event.target.value)}
                placeholder="https://vxpremium.com"
                spellCheck={false}
              />
            </label>
            <label className="block">
              <span className="admin-label">QR instructions</span>
              <input
                className="admin-input"
                value={config.qr_instructions}
                onChange={(event) => patch("qr_instructions", event.target.value)}
                maxLength={300}
              />
            </label>
            <Toggle
              label="Use a custom QR image"
              checked={config.use_custom_qr_image}
              onChange={(value) => patch("use_custom_qr_image", value)}
            />
            <label className="block sm:col-span-2">
              <span className="admin-label">Custom QR image URL</span>
              <input
                className="admin-input"
                value={config.custom_qr_image_url}
                onChange={(event) =>
                  patch("custom_qr_image_url", event.target.value)
                }
                placeholder="https://vxpremium.com/qr.png"
                spellCheck={false}
                disabled={!config.use_custom_qr_image}
              />
            </label>
          </Section>

          <Section
            title="Analytics & testing"
            hint="Leave the analytics key empty to disable analytics entirely. Testing mode pre-fills credentials on the login screen."
          >
            <label className="block sm:col-span-2">
              <span className="admin-label">Analytics API key (optional)</span>
              <input
                className="admin-input font-mono text-xs"
                value={config.amplitude_api_key}
                onChange={(event) => patch("amplitude_api_key", event.target.value)}
                placeholder="Leave empty to disable"
                spellCheck={false}
              />
            </label>
            <Toggle
              label="Testing mode"
              checked={config.testing_mode}
              onChange={(value) => patch("testing_mode", value)}
            />
            <label className="block">
              <span className="admin-label">Test username</span>
              <input
                className="admin-input"
                value={config.test_username}
                onChange={(event) => patch("test_username", event.target.value)}
                disabled={!config.testing_mode}
                spellCheck={false}
              />
            </label>
            <label className="block">
              <span className="admin-label">Test password</span>
              <input
                className="admin-input font-mono text-xs"
                value={config.test_password}
                onChange={(event) => patch("test_password", event.target.value)}
                disabled={!config.testing_mode}
                spellCheck={false}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="admin-label">Test server URL</span>
              <input
                className="admin-input"
                value={config.test_server_url}
                onChange={(event) => patch("test_server_url", event.target.value)}
                disabled={!config.testing_mode}
                spellCheck={false}
              />
            </label>
          </Section>

          <Section
            title="App updates"
            hint="Advertise a newer player build. Devices compare the version code below with their own and offer the update in Settings. Leave the URL empty to disable."
          >
            <label className="block">
              <span className="admin-label">Latest version code</span>
              <input
                className="admin-input"
                type="number"
                min={0}
                value={config.update_version_code}
                onChange={(event) =>
                  patch("update_version_code", Number(event.target.value) || 0)
                }
              />
            </label>
            <label className="block">
              <span className="admin-label">Latest version name</span>
              <input
                className="admin-input"
                value={config.update_version_name}
                onChange={(event) =>
                  patch("update_version_name", event.target.value)
                }
                placeholder="1.2.1"
                maxLength={40}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="admin-label">APK download URL</span>
              <input
                className="admin-input font-mono text-xs"
                value={config.update_apk_url}
                onChange={(event) => patch("update_apk_url", event.target.value)}
                placeholder="https://vxpremium.com/downloads/VX-Premium-1.2.0-release.apk"
                spellCheck={false}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="admin-label">What&apos;s new (optional)</span>
              <textarea
                className="admin-input"
                rows={2}
                value={config.update_notes}
                onChange={(event) => patch("update_notes", event.target.value)}
                maxLength={600}
              />
            </label>
            <Toggle
              label="Force update (users cannot skip)"
              checked={config.force_update}
              onChange={(value) => patch("force_update", value)}
            />
          </Section>

          <div className="admin-card sticky bottom-4 flex flex-col-reverse items-center gap-3 px-5 py-4 sm:flex-row sm:justify-end">
            <p className="mr-auto max-w-md text-xs text-slate-500">
              Devices fetch this at startup. Nothing here is pushed to a running
              app; restart the app to apply.
            </p>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save configuration"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="admin-card px-5 py-5">
      <div className="border-b border-white/[0.06] pb-4">
        <h2 className="text-sm font-bold text-white">{title}</h2>
        <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-3.5 py-3 text-sm text-slate-300 transition hover:bg-white/[0.04]">
      <input
        type="checkbox"
        className="h-4 w-4 accent-cyan-300"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="font-medium">{label}</span>
    </label>
  );
}
