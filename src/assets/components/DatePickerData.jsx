import React, { useContext, useEffect, useState } from "react";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { enGB } from "date-fns/locale";
import { TextField } from "@mui/material";
import { GetDataContext } from "../components/DataContext";

function DateRangePicker() {
  const { cndata, setcndata } = useContext(GetDataContext);

  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);

  const [startDate, setStartDate] = useState(cndata?.startDate || sevenDaysAgo);
  const [endDate, setEndDate] = useState(cndata?.endDate || today);

  useEffect(() => {
    if (setcndata) {
      setcndata((prev) => ({
        ...prev,
        startDate,
        endDate,
      }));
    }
  }, [startDate, endDate, setcndata]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
      <div
        style={{
          display: "flex",
          gap: "16px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <DatePicker
          label="Start Date"
          value={startDate}
          onChange={(newValue) => setStartDate(newValue)}
          maxDate={endDate}
          renderInput={(params) => (
            <TextField {...params} size="small" sx={{ width: "180px" }} />
          )}
        />
        <span style={{ color: "#666", fontWeight: "bold" }}>to</span>
        <DatePicker
          label="End Date"
          value={endDate}
          onChange={(newValue) => setEndDate(newValue)}
          minDate={startDate}
          renderInput={(params) => (
            <TextField {...params} size="small" sx={{ width: "180px" }} />
          )}
        />
      </div>
    </LocalizationProvider>
  );
}

export default DateRangePicker;
