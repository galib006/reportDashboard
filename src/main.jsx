import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Home from "./assets/pages/Home.jsx";
import Root from "./assets/layout/Root.jsx";
import OrderReport from "./assets/pages/OrderReport.jsx";
import DataContext from "./assets/components/DataContext.jsx";
import Inventory from "./assets/pages/Inventory.jsx";
const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [{ index: true, Component: Home },
      {
      path: "OrderReport",
      Component:OrderReport
    },
  {path: "Inventory",
    Component:Inventory
  }
],
  },
]);

createRoot(document.getElementById("root")).render(
  // <StrictMode>
    <DataContext>
    <RouterProvider router={router} />
    </DataContext>
  // </StrictMode>
);
