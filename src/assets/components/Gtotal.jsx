import React from "react";

function Gtotal({ title, Value, fontStyle, bgStyle, sign, Icons }) {
  return (
    <>
      <div className={`py-5 px-2 bg-[#204462] rounded-2xl text-center shadow-xl flex justify-center align-middle items-center gap-5 ${bgStyle}`}>
       <div className="text-2xl text-white font-bold">
        {Icons}
       </div>
       <div className="w-[226px]">
         <p className={`text-xl font-bold ${fontStyle}`}>{title}</p>
        <div className="divider divider-Neutral"></div>
        <p className={`font-bold text-4xl ${fontStyle}`}>
          {sign}
          {Value}
        </p>
       </div>
      </div>
    </>
  );
}

export default Gtotal;
