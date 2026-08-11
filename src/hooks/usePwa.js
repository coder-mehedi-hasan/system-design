import { useEffect, useState } from "react";

// Tracks the deferred install prompt and online/offline status for the PWA chrome.
export function usePwa() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isOnline, setIsOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  );

  useEffect(() => {
    const onBeforeInstall = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };
    const onInstalled = () => setDeferredPrompt(null);
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return { canInstall: !!deferredPrompt, promptInstall, isOnline };
}
