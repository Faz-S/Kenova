import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PDFHistoryState {
  pdfs: {
    name: string;
    url: string;
    uploadedAt: string;
  }[];
  addPdf: (name: string, url: string) => void;
  removePdf: (url: string) => void;
  clearHistory: () => void;
}

export const usePdfHistoryStore = create<PDFHistoryState>()(
  persist(
    (set) => ({
      pdfs: [],
      addPdf: (name, url) => set((state) => ({
        pdfs: [
          {
            name,
            url,
            uploadedAt: new Date().toISOString(),
          },
          ...state.pdfs,
        ].slice(0, 6), // Keep only the 6 most recent PDFs
      })),
      removePdf: (url) => set((state) => ({
        pdfs: state.pdfs.filter((pdf) => pdf.url !== url),
      })),
      clearHistory: () => set({ pdfs: [] }),
    }),
    {
      name: 'pdf-history',
    }
  )
);
