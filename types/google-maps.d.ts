// Global Google Maps JavaScript API ambient type declarations
declare global {
  interface Window {
    google?: any;
    initGoogleMapCallback?: () => void;
  }
}

export {};
