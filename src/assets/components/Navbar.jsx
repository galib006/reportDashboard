import React, { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  GoArrowDown,
  GoHome,
  GoGraph,
  GoPackage,
  GoIssueClosed,
  GoPeople,
  GoChevronRight,
  GoKey,
} from "react-icons/go";
import { motion, AnimatePresence } from "framer-motion";
import Key from "./Key";

function Navbar() {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);

  const userRole = "user";

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  // Menu items with icons
  const menuItems = [
    {
      name: "Home2",
      path: "Home2",
      roles: ["admin", "user"],
      icon: GoGraph,
    },
    {
      name: "Order Report",
      path: "OrderReport",
      roles: ["admin", "user"],
      icon: GoGraph,
    },
    {
      name: "Summary",
      roles: ["admin", "user"],
      icon: GoPackage,
      dropdown: [
        { name: "PI Summary", path: "PISummary", roles: ["admin", "user"] },
        // {
        //   name: "Order Summary",
        //   path: "OrderSummary",
        //   roles: ["admin", "user"],
        // },
        {
          name: "Dispatch",
          path: "Dispatch",
          roles: ["admin", "user"],
        },
      ],
    },
    {
      name: "Inventory Status",
      path: "Inventory",
      roles: ["admin", "user"],
      icon: GoPackage,
    },
    {
      name: "Issue Report",
      path: "InventoryIssue",
      roles: ["admin", "user"],
      icon: GoIssueClosed,
    },
    {
      name: "Employee",
      roles: ["admin", "user"],
      icon: GoPeople,
      dropdown: [
        { name: "Worker", path: "Employee-List", roles: ["admin", "user"] },
        { name: "Staff", path: "Staff-List", roles: ["admin", "user"] },
      ],
    },
  ];

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

  // Animation variants
  const dropdownVariants = {
    hidden: {
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: { duration: 0.15 },
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.2, ease: "easeOut" },
    },
  };

  const mobileVariants = {
    hidden: { x: "-100%" },
    visible: {
      x: 0,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 0.5,
      transition: { duration: 0.3 },
    },
  };

  return (
    <div className="z-50 mb-5 relative">
      {/* NAVBAR */}
      <motion.nav
        className={`top-0 left-0 right-0 z-50 transition-all duration-300  ${
          scrolled
            ? "bg-white/90 backdrop-blur-md shadow-lg"
            : "bg-gradient-to-r from-blue-600 to-blue-700 shadow-md"
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* LEFT */}
            <div className="flex items-center space-x-4">
              {/* Mobile hamburger */}
              <motion.button
                className={`lg:hidden p-2 rounded-lg ${
                  scrolled ? "hover:bg-gray-100" : "hover:bg-blue-500"
                } transition-colors`}
                onClick={() => setMobileOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="space-y-1.5 w-6">
                  <span
                    className={`block h-0.5 w-6 ${
                      scrolled ? "bg-gray-800" : "bg-white"
                    } transition-all`}
                  ></span>
                  <span
                    className={`block h-0.5 w-6 ${
                      scrolled ? "bg-gray-800" : "bg-white"
                    } transition-all`}
                  ></span>
                  <span
                    className={`block h-0.5 w-6 ${
                      scrolled ? "bg-gray-800" : "bg-white"
                    } transition-all`}
                  ></span>
                </div>
              </motion.button>

              <NavLink to="/" className="flex items-center space-x-2 group">
                <div
                  className={`p-1.5 rounded-lg ${
                    scrolled ? "bg-blue-600" : "bg-white/20"
                  }`}
                >
                  <GoHome
                    className={`w-5 h-5 ${
                      scrolled ? "text-white" : "text-white"
                    }`}
                  />
                </div>
                <span
                  className={`text-xl font-bold tracking-tight ${
                    scrolled ? "text-gray-800" : "text-white"
                  }`}
                >
                  Dashboard
                </span>
              </NavLink>
            </div>

            {/* CENTER (Desktop Menu) */}
            <div className="hidden lg:flex items-center">
              <ul className="flex space-x-1" ref={dropdownRef}>
                {filteredMenu.map((item, idx) => {
                  // Check if this item is active
                  const isItemActive = (match, location) => {
                    if (!item.path) return false;
                    return location.pathname.includes(item.path);
                  };

                  return (
                    <li key={idx} className="relative">
                      {!item.dropdown ? (
                        <NavLink
                          to={item.path}
                          className={({ isActive }) =>
                            `relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2
                            ${
                              isActive
                                ? scrolled
                                  ? "bg-blue-600 text-white shadow-md"
                                  : "bg-white/20 text-white shadow-lg"
                                : scrolled
                                  ? "text-gray-700 hover:bg-gray-100"
                                  : "text-white/90 hover:bg-white/10"
                            }`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              {item.icon && <item.icon className="w-4 h-4" />}
                              <span>{item.name}</span>
                              {isActive && (
                                <motion.div
                                  layoutId="activeIndicator"
                                  className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-white rounded-full"
                                />
                              )}
                            </>
                          )}
                        </NavLink>
                      ) : (
                        <>
                          <button
                            onClick={() =>
                              setOpenDropdown(
                                openDropdown === item.name ? null : item.name,
                              )
                            }
                            className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 group
                              ${
                                openDropdown === item.name
                                  ? scrolled
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "bg-white/20 text-white"
                                  : scrolled
                                    ? "text-gray-700 hover:bg-gray-100"
                                    : "text-white/90 hover:bg-white/10"
                              }`}
                          >
                            {item.icon && <item.icon className="w-4 h-4" />}
                            <span>{item.name}</span>
                            <GoArrowDown
                              className={`w-3 h-3 transition-transform duration-200 ${
                                openDropdown === item.name ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          <AnimatePresence>
                            {openDropdown === item.name && (
                              <motion.ul
                                variants={dropdownVariants}
                                initial="hidden"
                                animate="visible"
                                exit="hidden"
                                className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden"
                              >
                                {item.dropdown.map((sub, i) => (
                                  <motion.li
                                    key={i}
                                    whileHover={{ x: 4 }}
                                    transition={{ duration: 0.15 }}
                                  >
                                    <NavLink
                                      to={sub.path}
                                      className={({ isActive }) =>
                                        `block px-4 py-3 text-sm transition-all duration-200 flex items-center space-x-2
                                        ${
                                          isActive
                                            ? "bg-blue-50 text-blue-700 font-medium"
                                            : "text-gray-700 hover:bg-gray-50"
                                        }`
                                      }
                                      onClick={() => setOpenDropdown(null)}
                                    >
                                      {({ isActive }) => (
                                        <>
                                          <GoChevronRight
                                            className={`w-3 h-3 ${
                                              isActive
                                                ? "text-blue-600"
                                                : "text-gray-400"
                                            }`}
                                          />
                                          <span>{sub.name}</span>
                                        </>
                                      )}
                                    </NavLink>
                                  </motion.li>
                                ))}
                              </motion.ul>
                            )}
                          </AnimatePresence>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* RIGHT */}
            <div className="flex items-center space-x-3">
              <motion.button
                className={`relative group px-5 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2
                  ${
                    scrolled
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg"
                      : "bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
                  }`}
                onClick={() =>
                  document.getElementById("my_modal_1").showModal()
                }
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <GoKey className="w-4 h-4" />
                <span>Key</span>
              </motion.button>
              <Key />

              {/* User avatar */}
              <div className="hidden sm:flex items-center space-x-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    scrolled ? "bg-blue-600" : "bg-white/20"
                  }`}
                >
                  <span
                    className={`text-sm font-semibold ${
                      scrolled ? "text-white" : "text-white"
                    }`}
                  >
                    JD
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* MOBILE SIDEBAR */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {/* Overlay */}
            <motion.div
              variants={overlayVariants}
              className="absolute inset-0 bg-black"
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              variants={mobileVariants}
              className="absolute left-0 top-0 h-full w-80 bg-gradient-to-b from-white to-gray-50 shadow-2xl"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center">
                      <GoHome className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-gray-800">
                      Menu
                    </span>
                  </div>
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg
                      className="w-5 h-5 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="mt-4 flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center">
                    <span className="text-white font-bold">JD</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      John Doe
                    </p>
                    <p className="text-xs text-gray-600">Administrator</p>
                  </div>
                </div>
              </div>

              <ul className="p-4 space-y-1 overflow-y-auto h-[calc(100%-180px)]">
                {filteredMenu.map((item, idx) => (
                  <React.Fragment key={idx}>
                    {!item.dropdown ? (
                      <motion.li
                        whileHover={{ x: 4 }}
                        transition={{ duration: 0.15 }}
                      >
                        <NavLink
                          to={item.path}
                          className={({ isActive }) =>
                            `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200
                            ${
                              isActive
                                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
                                : "text-gray-700 hover:bg-gray-100"
                            }`
                          }
                          onClick={() => setMobileOpen(false)}
                        >
                          {({ isActive }) => (
                            <>
                              {item.icon && (
                                <item.icon
                                  className={`w-5 h-5 ${
                                    isActive ? "text-white" : "text-gray-500"
                                  }`}
                                />
                              )}
                              <span className="font-medium">{item.name}</span>
                            </>
                          )}
                        </NavLink>
                      </motion.li>
                    ) : (
                      <div>
                        <div className="flex items-center space-x-3 px-4 py-3">
                          {item.icon && (
                            <item.icon className="w-5 h-5 text-gray-500" />
                          )}
                          <span className="font-bold text-gray-800 text-sm uppercase tracking-wider">
                            {item.name}
                          </span>
                        </div>
                        <div className="ml-4 space-y-1 border-l-2 border-blue-200 pl-3">
                          {item.dropdown.map((sub, i) => (
                            <motion.li
                              key={i}
                              whileHover={{ x: 4 }}
                              transition={{ duration: 0.15 }}
                            >
                              <NavLink
                                to={sub.path}
                                className={({ isActive }) =>
                                  `flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm
                                  ${
                                    isActive
                                      ? "bg-blue-50 text-blue-700 font-medium"
                                      : "text-gray-600 hover:bg-gray-50"
                                  }`
                                }
                                onClick={() => setMobileOpen(false)}
                              >
                                <GoChevronRight className="w-3 h-3 text-gray-400" />
                                <span>{sub.name}</span>
                              </NavLink>
                            </motion.li>
                          ))}
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </ul>

              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white/50 backdrop-blur-sm">
                <button className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:shadow-lg transition-all">
                  <GoKey className="inline-block mr-2" />
                  Access Key
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Navbar;
