import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "leaflet/dist/leaflet.css";

const root = document.getElementById("root");
if (!root) throw new Error("No root element found");

createRoot(root).render(<App />);
