import React from "react";
import { Outlet } from "react-router";
import Header from "../components/Header";

function Root() {
  return (
    <div>
      <Header></Header>
      <Outlet></Outlet>
    </div>
  );
}

export default Root;
