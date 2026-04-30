import React from "react";
import { View, Text, Pressable, Modal as RNModal, StyleSheet, Dimensions } from "react-native";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const { width, height } = Dimensions.get("window");

export default function Modal({ open, onClose, children }: ModalProps) {
  return (
    <RNModal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Overlay */}
      <Pressable
        style={styles.overlay}
        onPress={onClose}
      />

      {/* Modal Content */}
      <View className="absolute top-1/4 left-4 right-4 bg-white dark:bg-[#1c1c1c] rounded-xl p-5 shadow-lg">
        {children}
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    width,
    height,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
});