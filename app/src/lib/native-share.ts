// Android app (Capacitor, @capacitor/share + @capacitor/filesystem): the WebView has no Web Share API, so the share
// card is written to the app's cache folder and handed to the system share sheet. App versions without the plugins
// fall back to the web behaviour (Save image and Copy text only).
interface SharePlugin { share(o: { title?: string; text?: string; files?: string[]; dialogTitle?: string }): Promise<unknown> }
interface FilesystemPlugin {
  writeFile(o: { path: string; data: string; directory: string; recursive?: boolean }): Promise<{ uri: string }>;
  rmdir?(o: { path: string; directory: string; recursive?: boolean }): Promise<void>;
}
interface Cap { isNativePlatform?: () => boolean; Plugins?: { Share?: SharePlugin; Filesystem?: FilesystemPlugin } }

function plugins() {
  if (typeof window === 'undefined') return null;
  const c = (window as { Capacitor?: Cap }).Capacitor;
  const p = c?.isNativePlatform?.() ? c.Plugins : undefined;
  return p?.Share && p.Filesystem ? { share: p.Share, fs: p.Filesystem } : null;
}

/** True inside an app version that can share files natively. */
export const canShareNatively = () => !!plugins();

const base64 = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(String(r.result).replace(/^data:[^,]*,/, ''));
  r.onerror = () => reject(r.error);
  r.readAsDataURL(blob);
});

/** Opens the Android share sheet with the image and text. */
export async function shareFileNatively(file: File, text: string, dialogTitle: string): Promise<'shared' | 'cancelled' | 'failed'> {
  const p = plugins();
  if (!p) return 'failed';
  try {
    // Clear earlier share images first, so they don't pile up in the cache folder.
    try { await p.fs.rmdir?.({ path: 'share', directory: 'CACHE', recursive: true }); } catch { /* nothing to clear */ }
    const { uri } = await p.fs.writeFile({ path: `share/${file.name}`, data: await base64(file), directory: 'CACHE', recursive: true });
    await p.share.share({ title: 'sisma', text, files: [uri], dialogTitle });
    return 'shared';
  } catch (e) {
    return /cancel/i.test(String((e as Error)?.message ?? e)) ? 'cancelled' : 'failed';
  }
}

/** Opens the Android share sheet with text only (the post and its link), when there is no image to share. */
export async function shareTextNatively(text: string, dialogTitle: string): Promise<'shared' | 'cancelled' | 'failed'> {
  const p = plugins();
  if (!p) return 'failed';
  try {
    await p.share.share({ title: 'sisma', text, dialogTitle });
    return 'shared';
  } catch (e) {
    return /cancel/i.test(String((e as Error)?.message ?? e)) ? 'cancelled' : 'failed';
  }
}
