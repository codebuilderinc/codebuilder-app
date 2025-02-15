import { useEffect, useState, useRef } from "react";
import { AppState, Platform } from "react-native";
import { clipboard } from "../utils/clipboard";

export const useClipboard = () => {
  const [clipboardContent, setClipboardContent] = useState<string>("");
  const [hasCopiedText, setHasCopiedText] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const previousContentRef = useRef<string>("");
  const isMounted = useRef(true);

  const checkClipboard = async () => {
    try {
      const content = await clipboard.getString();
      if (content !== previousContentRef.current) {
        previousContentRef.current = content;
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
      setHistory((prev) => [content, ...prev.slice(0, 49)]);
    }
  };

  useEffect(() => {
    isMounted.current = true;

    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === "active" && isMounted.current) {
        checkClipboard();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    // Initial check
    checkClipboard();

    let intervalId: NodeJS.Timeout | null = null;
    let listener: any;
    if (Platform.OS === "ios") {
      intervalId = setInterval(checkClipboard, 1500);
    } else {
      listener = clipboard.addListener((content: string) => {
        if (isMounted.current) {
          previousContentRef.current = content;
          setClipboardContent(content);
          setHasCopiedText(content.length > 0);
          addToHistory(content);
        }
      });
    }

    return () => {
      isMounted.current = false;
      subscription.remove();
      if (intervalId) clearInterval(intervalId);
      if (Platform.OS === "android") {
        clipboard.removeListener(listener);
      }
    };
  }, []);

  const copyToClipboard = async (text: string) => {
    await clipboard.copy(text);
    if (isMounted.current) {
      previousContentRef.current = text;
      setClipboardContent(text);
      setHasCopiedText(true);
      addToHistory(text);
    }
  };

  const getLatestClipboard = async () => {
    return await clipboard.getString();
  };

  const clearClipboard = async () => {
    await clipboard.clear();
    if (isMounted.current) {
      previousContentRef.current = "";
      setClipboardContent("");
      setHasCopiedText(false);
    }
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
