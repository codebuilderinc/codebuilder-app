import * as Clipboard from 'expo-clipboard';

export const clipboard = {
  async getString() {
    return await Clipboard.getStringAsync();
  },
  async copy(text: string) {
    await Clipboard.setStringAsync(text);
  },
  async clear() {
    await Clipboard.setStringAsync('');
  },
  addListener(callback: (text: string) => void) {
    return Clipboard.addClipboardListener(({ content }) => callback(content));
  },
  removeListener(subscription: Clipboard.Subscription) {
    return Clipboard.removeClipboardListener(subscription);
  },
};