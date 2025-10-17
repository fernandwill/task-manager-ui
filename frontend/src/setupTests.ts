import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Provide minimal URL APIs used by the PDF report download.
if (!window.URL.createObjectURL) {
  window.URL.createObjectURL = vi.fn(() => 'blob:mock');
}

if (!window.URL.revokeObjectURL) {
  window.URL.revokeObjectURL = vi.fn();
}
