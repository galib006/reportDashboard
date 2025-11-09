import React from "react";

function Gtotal({ title, Value, fontStyle, bgStyle, sign }) {
  return (
    <div>
      <div className={`p-5 bg-blue-500 rounded-2xl text-center ${bgStyle}`}>
        <p className={`text-xl ${fontStyle}`}>{title}</p>
        <div className="divider divider-Neutral"></div>
        <p className={`font-bold text-4xl ${fontStyle}`}>
          {sign}
          {Value}
        </p>
      </div>
    </div>
  );
}

export default Gtotal;
