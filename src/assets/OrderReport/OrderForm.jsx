import React from "react";
import DateRangePicker from "../components/DatePickerData";
function OrderForm() {
  const dateSubmit = (e) => e.preventDefault();
  return (
    <>
      <form
        onSubmit={(e) => dateSubmit(e)}
        action=""
        method="get"
        className="flex gap-5 content-center align-middle justify-center items-center"
      >
        <DateRangePicker></DateRangePicker>
        <input type="submit" value="Submit" className="btn btn-info" />
      </form>
    </>
  );
}

export default OrderForm;
