import React, { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { GoArrowDown } from "react-icons/go";
import Key from "./Key";

function Navbar() {
  const [openDropdown, setOpenDropdown] = useState(null); // which dropdown is open
  const [mobileOpen, setMobileOpen] = useState(false); // sidebar for mobile
  const dropdownRef = useRef(null);

  // Example: user role coming from auth/API
  const userRole = "user"; // change to "admin" to see full menu

  // Outside click closes dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Full menu with your original items
  const menuItems = [
    { name: "Order Report", path: "OrderReport", roles: ["admin", "user"] },
    {
      name: "Summary",
      roles: ["admin", "user"],
      dropdown: [
        { name: "Order Summary", path: "OrderSummary", roles: ["admin", "user"] },
        { name: "Balance Summary", path: "BalanceSummary", roles: ["admin", "user"] },
      ],
    },
    { name: "Inventory Status", path: "Inventory", roles: ["admin", "user"] },
    { name: "Issue Report", path: "InventoryIssue", roles: ["admin", "user"] },
    { name: "Employee", path: "Employee-LIst", roles: ["admin", "user"] },
  ];

  // Filter menu by role
  const filteredMenu = menuItems
    .filter((item) => item.roles.includes(userRole))
    .map((item) => {
      if (item.dropdown) {
        return {
          ...item,
          dropdown: item.dropdown.filter((sub) => sub.roles.includes(userRole)),
        };
      }
      return item;
    });

  return (
    <div>
      {/* NAVBAR */}
      <div className="navbar bg-base-100 shadow-sm">
        {/* LEFT */}
        <div className="navbar-start">
          {/* Mobile hamburger */}
          <button
            className="btn btn-ghost lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            ☰
          </button>
          <NavLink to="/" className="btn btn-ghost text-xl">
            DashBoard
          </NavLink>
        </div>

        {/* CENTER (Desktop Menu) */}
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1 font-bold" ref={dropdownRef}>
            {filteredMenu.map((item, idx) => (
              <li key={idx} className="relative">
                {!item.dropdown ? (
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `px-3 py-2 rounded ${
                        isActive ? "bg-blue-500 text-white" : "hover:bg-gray-200"
                      }`
                    }
                  >
                    {item.name}
                  </NavLink>
                ) : (
                  <>
                    <div
                      onClick={() =>
                        setOpenDropdown(openDropdown === item.name ? null : item.name)
                      }
                      className={`flex items-center gap-1 cursor-pointer px-3 py-2 rounded hover:bg-gray-200`}
                    >
                      {item.name}
                      <GoArrowDown
                        className={`transition-transform ${
                          openDropdown === item.name ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                    <ul
                      className={`absolute left-0 mt-10 w-52 bg-white border border-gray-300 rounded shadow z-50 transition-all duration-200 ${
                        openDropdown === item.name
                          ? "opacity-100 visible translate-y-0"
                          : "opacity-0 invisible -translate-y-2"
                      }`}
                    >
                      {item.dropdown.map((sub, i) => (
                        <li key={i}>
                          <NavLink
                            to={sub.path}
                            className={({ isActive }) =>
                              `block px-3 py-2 ${
                                isActive ? "bg-blue-500 text-white" : "hover:bg-gray-200"
                              }`
                            }
                            onClick={() => setOpenDropdown(null)}
                          >
                            {sub.name}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* RIGHT */}
        <div className="navbar-end">
          <button
            className="btn px-9 btn-success text-neutral"
            onClick={() => document.getElementById("my_modal_1").showModal()}
          >
            Key
          </button>
          <Key />
        </div>
      </div>

      {/* MOBILE SIDEBAR */}
      <div
        className={`fixed inset-0 z-50 transition ${
          mobileOpen ? "visible" : "invisible"
        }`}
      >
        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-black transition-opacity ${
            mobileOpen ? "opacity-40" : "opacity-0"
          }`}
          onClick={() => setMobileOpen(false)}
        ></div>

        {/* Drawer */}
        <div
          className={`absolute left-0 top-0 h-full w-64 bg-white shadow transform transition-transform ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-4 font-bold text-lg border-b">Menu</div>
          <ul className="p-2 space-y-2 font-semibold">
            {filteredMenu.map((item, idx) => (
              <React.Fragment key={idx}>
                {!item.dropdown ? (
                  <li>
                    <NavLink
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.name}
                    </NavLink>
                  </li>
                ) : (
                  <>
                    <li className="font-bold">{item.name}</li>
                    {item.dropdown.map((sub, i) => (
                      <li key={i} className="pl-4">
                        <NavLink
                          to={sub.path}
                          onClick={() => setMobileOpen(false)}
                        >
                          {sub.name}
                        </NavLink>
                      </li>
                    ))}
                  </>
                )}
              </React.Fragment>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Navbar;