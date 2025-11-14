import React, { useContext, useEffect, useState } from "react";
import TextField from "@mui/material/TextField";
import { LocalizationProvider, DesktopDatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { enGB } from "date-fns/locale";
import { GetDataContext } from "../components/DataContext";

function DateRangePicker() {
  const { cndata, setcndata } = useContext(GetDataContext);

  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);

  const [startDate, setStartDate] = useState(cndata?.startDate || sevenDaysAgo);
  const [endDate, setEndDate] = useState(cndata?.endDate || today);

  // Update context whenever date changes
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
      <div style={{ display: "flex", gap: "16px" }}>
        <DesktopDatePicker
          label="Start Date"
          value={startDate}
          onChange={(newValue) => setStartDate(newValue)}
          maxDate={endDate}
          inputFormat="dd/MM/yyyy"
          mask="__/__/____"
          renderInput={(params) => <TextField {...params} />}
        />
        <DesktopDatePicker
          label="End Date"
          value={endDate}
          onChange={(newValue) => setEndDate(newValue)}
          minDate={startDate}
          inputFormat="dd/MM/yyyy"
          mask="__/__/____"
          renderInput={(params) => <TextField {...params} />}
        />
      </div>
    </LocalizationProvider>
  );
}

export default DateRangePicker;
