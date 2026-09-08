import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.css";
import { Provider } from "react-redux";
import { store } from "./store";
import { ToastProvider } from "@/design/components/feedback";
import { ConfirmProvider } from "@/design/components/dialogs";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ToastProvider>
        <ConfirmProvider>
          <App />
        </ConfirmProvider>
      </ToastProvider>
    </Provider>
  </React.StrictMode>
);
