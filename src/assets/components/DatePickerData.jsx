import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function DateRangePicker() {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  return (
    <div className="flex gap-4">
      <div>
        <label>Start Date:</label>
        <DatePicker
          selected={startDate}
          onChange={(date) => setStartDate(date)}
          selectsStart
          startDate={startDate}
          endDate={endDate}
          maxDate={endDate} // start date end date er por jete parbe na
          placeholderText="Select start date"
          dateFormat="dd/MM/yyyy"
        />
      </div>

      <div>
        <label>End Date:</label>
        <DatePicker
          selected={endDate}
          onChange={(date) => setEndDate(date)}
          selectsEnd
          startDate={startDate}
          endDate={endDate}
          minDate={startDate} // end date start date er age jete parbe na
          placeholderText="Select end date"
          dateFormat="dd/MM/yyyy"
        />
      </div>
    </div>
  );
}

export default DateRangePicker;
