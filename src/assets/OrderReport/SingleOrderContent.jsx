import React from "react";
import SingleOrderData from "./SingleOrderData";

function SingleOrderContent({ Wrk, data }) {
  const modalID = `modal_${Wrk}`;
  console.log(data);

  return (
    <>
      {/* Open the modal using document.getElementById('ID').showModal() method */}
      <button
        className="btn btn-success btn-xs"
        onClick={() => document.getElementById(modalID).showModal()}
      >
        Details
      </button>
      <dialog id={modalID} className="modal">
        <div className="modal-box max-w-full">
          <div className="text-center text-4xl font-bold underline">{Wrk}</div>
          <div className="flex justify-between my-8 py-8 px-4 bg-indigo-100 text-xl">
            <div>Customer: {data.CustomerName}</div>
            <div>Buyer: {data.Buyer}</div>
            <div>Section: {data.Category}</div>
            <div>Order Date: {data.OrderReceiveDate}</div>
          </div>

          <SingleOrderData data={Wrk}></SingleOrderData>
          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn">Close</button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}

export default SingleOrderContent;
