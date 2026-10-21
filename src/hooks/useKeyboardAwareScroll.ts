import { useCallback, useEffect, useRef } from "react";
import { Keyboard, Platform, TextInput, Dimensions } from "react-native";

type Scrollable = {
  scrollTo: (options: { y?: number; x?: number; animated?: boolean }) => void;
};

type ScrollRef = React.RefObject<Scrollable | null>;

export function useKeyboardAwareScroll(scrollRef: ScrollRef) {
  const keyboardHeightRef = useRef(0);
  const scrollYRef = useRef(0);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (event) => {
      keyboardHeightRef.current = event.endCoordinates?.height ?? 0;
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      keyboardHeightRef.current = 0;
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const onScroll = useCallback((event: any) => {
    scrollYRef.current = event.nativeEvent.contentOffset.y ?? 0;
  }, []);

  const ensureVisible = useCallback(
    (input: TextInput | null, extraGap = 24) => {
      if (!input) return;

      requestAnimationFrame(() => {
        setTimeout(() => {
          input.measureInWindow((x, y, width, height) => {
            const keyboardHeight = keyboardHeightRef.current;
            const windowHeight = Dimensions.get("window").height;

            if (!height) return;

            const fieldBottom = y + height;
            const visibleBottom = windowHeight - keyboardHeight - extraGap;

            if (fieldBottom <= visibleBottom) {
              return; // already visible — no scroll needed
            }

            const overlap = fieldBottom - visibleBottom;

            scrollRef.current?.scrollTo({
              y: Math.max(0, scrollYRef.current + overlap),
              animated: true,
            });
          });
        }, 60);
      });
    },
    [scrollRef]
  );

  return { onScroll, ensureVisible };
}