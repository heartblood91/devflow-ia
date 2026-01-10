import { create } from "zustand";

// DevFlow: No global dialogs for MVP, extend this type as needed
export type DialogType = string;

export const useGlobalDialogStore = create<{
  openDialog: DialogType | null;
  setOpenDialog: (dialog: DialogType | null) => void;
}>((set) => ({
  openDialog: null,
  setOpenDialog: (dialog) => set({ openDialog: dialog }),
}));

export const openGlobalDialog = (dialog: DialogType) => {
  useGlobalDialogStore.getState().setOpenDialog(dialog);
};

export const closeGlobalDialog = () => {
  useGlobalDialogStore.getState().setOpenDialog(null);
};
