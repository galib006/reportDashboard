import React from 'react'
import SingleOrderData from './SingleOrderData'

function SingleOrderContent({data}) {
    const modalID = `modal_${data}`;
    
  return (
    <>
      {/* Open the modal using document.getElementById('ID').showModal() method */}
<button className="btn btn-success btn-xs" onClick={()=>document.getElementById(modalID).showModal()}>Details</button>
<dialog id={modalID} className="modal">
  <div className="modal-box max-w-full">
    {data}
    <SingleOrderData data={data}></SingleOrderData>
    <div className="modal-action">
      <form method="dialog">
        {/* if there is a button in form, it will close the modal */}
        <button className="btn">Close</button>
      </form>
    </div>
  </div>
</dialog>
    </>
  )
}

export default SingleOrderContent
