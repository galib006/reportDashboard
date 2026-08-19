import { Component, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Home from "./assets/pages/Home.jsx";
import Root from "./assets/layout/Root.jsx";
import OrderReport from "./assets/pages/OrderReport.jsx";
import DataContext from "./assets/components/DataContext.jsx";
import Inventory from "./assets/pages/Inventory.jsx";
import "react-toastify/dist/ReactToastify.css";
import InventoryIssue from "./assets/pages/InventoryIssue.jsx";
import EmployeeLIst from "./assets/pages/EmployeeLIst.jsx";
// import OrderSummary from "./assets/pages/OrderSummary.jsx";
import BalanceSummary from "./assets/pages/BalanceSummary.jsx";
import OfficeStaffList from "./assets/pages/OfficeStaffList.jsx";
import ChallanDashboard from "./assets/pages/ChallanDashboard.jsx";



const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [{ index: true, Component: Home },
      {
      path: "OrderReport",
      Component:OrderReport
    },
    // {
    //   path: "OrderSummary",
    //   Component:OrderSummary
    // },
    {
      path: "PISummary",
      Component: BalanceSummary
    },
    {
      path: "Dispatch",
      Component: ChallanDashboard
    },
  {path: "Inventory",
    Component:Inventory
  },
  {
    path: "InventoryIssue",
    Component: InventoryIssue
  },
  {
    path: "Employee-LIst",
    Component: EmployeeLIst
  },
  {
    path: "Staff-LIst",
    Component: OfficeStaffList
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
