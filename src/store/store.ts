import { create } from 'zustand';
import type { FileItem, ProgressState, AppState } from '@/types';

const initialProgress: ProgressState = {
  isActive: false,
  progress: 0,
  message: '',
  type: 'upload',
};

export const useStore = create<AppState>((set, get) => ({
  files: [],
  selectedFiles: [],
  progress: initialProgress,
  error: null,
  
  addFiles: (newFiles) => {
    set((state) => {
      const existingNames = new Set(state.files.map(f => f.name));
      const filteredFiles = newFiles.filter(f => !existingNames.has(f.name));
      return {
        files: [...state.files, ...filteredFiles],
      };
    });
  },
  
  removeFile: (filename) => {
    set((state) => ({
      files: state.files.filter(f => f.name !== filename),
      selectedFiles: state.selectedFiles.filter(f => f !== filename),
    }));
  },
  
  toggleSelectFile: (filename) => {
    set((state) => {
      const isSelected = state.selectedFiles.includes(filename);
      return {
        selectedFiles: isSelected
          ? state.selectedFiles.filter(f => f !== filename)
          : [...state.selectedFiles, filename],
        files: state.files.map(f =>
          f.name === filename ? { ...f, selected: !isSelected } : f
        ),
      };
    });
  },
  
  selectAllFiles: () => {
    set((state) => {
      const allNames = state.files.map(f => f.name);
      return {
        selectedFiles: allNames,
        files: state.files.map(f => ({ ...f, selected: true })),
      };
    });
  },
  
  clearSelectedFiles: () => {
    set((state) => ({
      selectedFiles: [],
      files: state.files.map(f => ({ ...f, selected: false })),
    }));
  },
  
  setProgress: (progress) => {
    set({ progress });
  },
  
  clearProgress: () => {
    set({ progress: initialProgress });
  },
  
  setError: (error) => {
    set({ error });
  },
  
  refreshFiles: (files) => {
    set((state) => ({
      files: files.map(f => ({
        ...f,
        selected: state.selectedFiles.includes(f.name),
      })),
    }));
  },
}));