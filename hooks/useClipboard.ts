import { useEffect, useState } from "react";
import { AppState, Platform } from "react-native";
import { clipboard } from "../utils/clipboard";

export const useClipboard = () => {
  const [clipboardContent, setClipboardContent] = useState<string>("");
  const [hasCopiedText, setHasCopiedText] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [previousContent, setPreviousContent] = useState<string>("");

  const checkClipboard = async () => {
    try {
      const content = await clipboard.getString();
      if (content !== previousContent) {
        setPreviousContent(content);
        setClipboardContent(content);
        setHasCopiedText(content.length > 0);
        addToHistory(content);
      }
    } catch (error) {
      console.error("Error checking clipboard:", error);
    }
  };

  const addToHistory = (content: string) => {
    if (content.trim() && content !== history[0]) {
      setHistory((prev) => [content, ...prev.slice(0, 49)]); // Keep last 50 items
    }
  };

  //   useEffect(() => {
  //     const initialLoad = async () => {
  //       const content = await clipboard.getString();
  //       setClipboardContent(content);
  //       setHasCopiedText(content.length > 0);
  //       addToHistory(content);
  //     };
  //     initialLoad();

  //     const subscription = clipboard.addListener((content) => {
  //       setClipboardContent(content);
  //       setHasCopiedText(content.length > 0);
  //       addToHistory(content);
  //     });

  //     return () => {
  //       clipboard.removeListener(subscription);
  //     };
  //   }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        checkClipboard();
      }
    });

    // Initial check
    checkClipboard();

    if (Platform.OS === "ios") {
      // Poll clipboard every 1.5 seconds for iOS
      intervalId = setInterval(checkClipboard, 1500);
    } else {
      // Android listener
      const listenerSubscription = clipboard.addListener((content) => {
        setClipboardContent(content);
        setHasCopiedText(content.length > 0);
        addToHistory(content);
      });

      return () => {
        clipboard.removeListener(listenerSubscription);
      };
    }

    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, [previousContent]);

  const copyToClipboard = async (text: string) => {
    await clipboard.copy(text);
    addToHistory(text);
  };

  const getLatestClipboard = async () => {
    return await clipboard.getString();
  };

  const clearClipboard = async () => {
    await clipboard.clear();
    setClipboardContent("");
    setHasCopiedText(false);
  };

  return {
    clipboardContent,
    hasCopiedText,
    copyToClipboard,
    getLatestClipboard,
    clearClipboard,
    history,
  };
};
