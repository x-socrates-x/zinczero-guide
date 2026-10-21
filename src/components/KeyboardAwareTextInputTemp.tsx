import React, { useRef } from "react";
import { TextInput, TextInputProps } from "react-native";

type Props = TextInputProps & {
  ensureVisible?: (input: TextInput | null, extraGap?: number) => void;
  extraGap?: number;
};

export default function KeyboardAwareTextInput({
  ensureVisible,
  extraGap = 24,
  onFocus,
  ...props
}: Props) {
  const inputRef = useRef<TextInput>(null);

  return (
    <TextInput
      ref={inputRef}
      {...props}
      onFocus={(e) => {
        ensureVisible?.(inputRef.current, extraGap);
        onFocus?.(e);
      }}
    />
  );
}