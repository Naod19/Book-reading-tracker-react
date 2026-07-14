import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import BookTracker from "./BookTracker";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BookTracker />
  </StrictMode>,
);
