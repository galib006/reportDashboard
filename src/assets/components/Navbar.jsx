import React from "react";
import { NavLink } from "react-router";
import Key from "./Key";

function Navbar() {
  return (
    <div>
      <div className="navbar bg-base-100 shadow-sm">
        <div className="navbar-start">
          <div className="dropdown">
            <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {" "}
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h8m-8 6h16"
                />{" "}
              </svg>
            </div>
            <ul
              tabIndex="-1"
              className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
            >
              <li>
                <a>Home</a>
              </li>
              <li>
                <a>Parent</a>
                <ul className="p-2">
                  <li>
                    <a>Submenu 1</a>
                  </li>
                  <li>
                    <a>Submenu 2</a>
                  </li>
                </ul>
              </li>
              <li>
                <a>Item 3</a>
              </li>
            </ul>
          </div>
          <NavLink to={"/"} className="btn btn-ghost text-xl">
            DashBoard
          </NavLink>
        </div>
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1">
            <li>
              <NavLink to={"/"}>Home</NavLink>
            </li>
            <li>
              <NavLink to={"OrderReport"}>Order Report</NavLink>
            </li>

            <li>
              <NavLink to={"Inventory"}>Inventory Status</NavLink>
            </li>

            <li>
              <NavLink to={"InventoryIssue"}>Issue Report</NavLink>
            </li>
             <li>
              <NavLink to={"Delivery"}>Delivery</NavLink>
            </li>
            <li>
              <NavLink to={"Employee-LIst"}>Employee</NavLink>
            </li>
          </ul>
        </div>
        <div className="navbar-end">
          {/* Open the modal using document.getElementById('ID').showModal() method */}
          <button
            className="btn px-9 btn-success text-neutral"
            onClick={() => document.getElementById("my_modal_1").showModal()}
          >
            Key
          </button>
          <Key></Key>
        </div>
      </div>
    </div>
  );
}

export default Navbar;
