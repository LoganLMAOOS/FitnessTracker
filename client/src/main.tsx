import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register service worker for PWA capabilities
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log("ServiceWorker registration successful");
      })
      .catch((error) => {
        console.error("ServiceWorker registration failed:", error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
