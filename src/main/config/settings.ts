import Store from "electron-store";
import type { TranslationSettings } from "../../shared/types.js";

const defaults: TranslationSettings = {
  baseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
  apiKey: "",
  model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  useMock: false
};

const store = new Store<TranslationSettings>({
  name: "booktrans-desk-settings",
  defaults
});

export function getSettings(): TranslationSettings {
  return {
    baseUrl: store.get("baseUrl", defaults.baseUrl),
    apiKey: store.get("apiKey", defaults.apiKey),
    model: store.get("model", defaults.model),
    useMock: store.get("useMock", defaults.useMock ?? false)
  };
}

export function saveSettings(settings: TranslationSettings): TranslationSettings {
  store.set("baseUrl", settings.baseUrl);
  store.set("apiKey", settings.apiKey);
  store.set("model", settings.model);
  store.set("useMock", Boolean(settings.useMock));
  return getSettings();
}

export function redactedSettings(settings: TranslationSettings): Omit<TranslationSettings, "apiKey"> & { apiKey: string } {
  return {
    ...settings,
    apiKey: settings.apiKey ? "********" : ""
  };
}
