import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { GetDataContext } from "../components/DataContext";
import DateRangePicker from "../components/DatePickerData";
import { FourSquare } from "react-loading-indicators";

function EmployeeLIst() {
  const { cndata, setcndata, loading, setLoading } = useContext(GetDataContext);
  const [apiData, setApiData] = useState([]);
  const DateFormat = (e) => {
    const dateObj = new Date(e);
    return dateObj.toLocaleDateString("en-GB"); // DD/MM/YYYY
  };

  const stDate = cndata?.startDate
    ? cndata.startDate.toISOString().split("T")[0]
    : "";
  const edDate = cndata?.endDate
    ? cndata.endDate.toISOString().split("T")[0]
    : "";

  const apiKey = localStorage.getItem("apiKey");

  const emplst = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.get(
        `https://tpl-api.ebs365.info/api/HRMBI/HRM_GET_EmployeeInformation_ReportExcel?CompanyID=1&DepartmentID=2&SectionID=0&LineID=0&FloorID=0&EmpTypeID=4&CommandID=1&MM=November&YYYY=2025`,
        {
          headers: { Authorization: `${apiKey}` },
        }
      );
      setApiData(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const uniqueSection = [...new Set(apiData.map((item) => item.SectionName))];
  console.log(uniqueSection);
  const grpData = uniqueSection.map((section) => ({
    Section: section,
    Employee: apiData.filter((data) => data.SectionName == section),
  }));
  console.log(grpData);

  // item.filter((data) => data.SectionName == item.SectionName);

  // console.log(dataSection);

  // console.log(dataFilter);

  return (
    <>
      <form action="" onSubmit={(e) => emplst(e)}>
        <div className="flex justify-center items-center gap-4">
          <DateRangePicker />
          <input type="submit" value="Submit" className="btn btn-success" />
        </div>
      </form>

      {loading && (
        <div className="flex justify-center items-center h-screen w-full text-center">
          <FourSquare color="#32cd32" size="large" />
        </div>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>SL</th>
            <th>Employee ID</th>
            <th>Employee Name</th>
            <th>Joining Date</th>
            <th>Section</th>
            <th>Designation</th>
          </tr>
        </thead>
        <tbody className="w-full">
          {grpData.map((emp, idx) => (
            <React.Fragment key={idx}>
              <tr>
                <th className="text-xl">{emp?.Section}</th>
              </tr>
              {emp.Employee.map((data, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{data.EmpIDNo}</td>
                  <td>{data.EmpName}</td>
                  <td>{DateFormat(data.DateOfJoining)}</td>
                  <td>{data.SectionName}</td>
                  <td>{data.Designation}</td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </>
  );
}

export default EmployeeLIst;
