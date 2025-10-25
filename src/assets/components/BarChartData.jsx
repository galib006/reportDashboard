import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

function Chart({ grpData }) {
  if (!grpData || !Array.isArray(grpData) || grpData.length === 0) {
    return <p>Loading chart data...</p>;
  }

  // Parse date from string "dd/mm/yyyy" or ISO format
  const parseDate = (dateStr) => new Date(dateStr);

  // Get last 7 days range
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);

  // Filter last 7 days data
  const last7DaysData = grpData;

  if (last7DaysData.length === 0) {
    return <p>No data available for the last 7 days.</p>;
  }

  // Aggregate data by date
  const aggregatedData = last7DaysData.reduce((acc, item) => {
    const date = parseDate(item.OrderDate || item.Date).toLocaleDateString(
      "en-GB"
    );
    const existing = acc.find((d) => d.OrderDate === date);
    if (existing) {
      existing.OrderQty += item.OrderQty || 0;
      existing.ChallanQTY += item.ChallanQTY || 0;
    } else {
      acc.push({
        OrderDate: date,
        OrderQty: item.OrderQty || 0,
        ChallanQTY: item.ChallanQTY || 0,
      });
    }
    return acc;
  }, []);

  // Sort by date ascending
  aggregatedData.sort((a, b) => new Date(a.OrderDate) - new Date(b.OrderDate));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={aggregatedData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="OrderDate" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="OrderQty" stroke="#8884d8" />
        <Line type="monotone" dataKey="ChallanQTY" stroke="#82ca9d" />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default Chart;
