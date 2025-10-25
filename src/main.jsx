import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Home from "./assets/pages/Home.jsx";
import Root from "./assets/layout/Root.jsx";
import OrderReport from "./assets/pages/OrderReport.jsx";
const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [{ index: true, Component: Home },
      {
      path: "OrderReport",
      Component:OrderReport
    }],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
