// components/home/utils/dateUtils.js

export const parseAPIDate = (dateStr) => {
  if (!dateStr) return new Date();

  if (typeof dateStr === "string" && dateStr.includes("T")) {
    const datePart = dateStr.split("T")[0];
    const parts = datePart.split("-");
    return new Date(
      parseInt(parts[0]),
      parseInt(parts[1]) - 1,
      parseInt(parts[2])
    );
  }

  if (typeof dateStr === "string" && dateStr.includes("-")) {
    const parts = dateStr.split("-");
    return new Date(
      parseInt(parts[0]),
      parseInt(parts[1]) - 1,
      parseInt(parts[2])
    );
  }

  return new Date(dateStr);
};

export const getDateKey = (dateStr) => {
  if (!dateStr) return "";
  if (typeof dateStr === "string" && dateStr.includes("T")) {
    return dateStr.split("T")[0];
  }
  if (typeof dateStr === "string" && dateStr.includes("-")) {
    return dateStr.split(" ")[0];
  }
  return dateStr;
};

export const formatDisplayDate = (dateStr) => {
  const date = parseAPIDate(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const getWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  );
};

export const getCurrentMonthDates = () => {
  const now = new Date();
  const bdNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);
  const startDate = new Date(bdNow.getFullYear(), bdNow.getMonth(), 1);
  const endDate = new Date(bdNow.getFullYear(), bdNow.getMonth() + 1, 0);
  return {
    startDate,
    endDate,
    stDate: startDate.toISOString().split("T")[0],
    edDate: endDate.toISOString().split("T")[0],
    month: bdNow.toLocaleString("default", { month: "short" }),
    year: bdNow.getFullYear(),
  };
};