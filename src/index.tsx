import './index.css';
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// Polyfill for Node.js globals in browser
import { Buffer } from 'buffer';
window.Buffer = Buffer;

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(<App />);