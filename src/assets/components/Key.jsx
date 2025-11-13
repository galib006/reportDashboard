import React, { useRef, useState } from "react";
import { toast, ToastContainer } from "react-toastify";

function Key() {
  const modalref1 = useRef(null);
  const [apiKey, setApiKey] = useState("");

  const btnSave = () => {
    if (apiKey.trim() === "") {
      toast.error("Field Empty!");
    } else {
      // save to localStorage
      localStorage.setItem("apiKey", apiKey);

      toast.success("Key Add Successful!");

      modalref1.current.close();
      setApiKey("");
    }
  };

  return (
    <div>
      <dialog id="my_modal_1" className="modal" ref={modalref1}>
        <ToastContainer />
        <div className="modal-box">
          <div className="join w-full">
            <div className="w-full">
              <label className="validator join-item">
                <input
                  type="text"
                  placeholder="Key"
                  className="input input-neutral no-outline w-full"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                  }}
                />
              </label>
              <div className="validator-hint hidden">Enter key</div>
            </div>
            <button className="btn btn-success join-item" onClick={btnSave}>
              Save
            </button>
          </div>

          {/* <div className="modal-action mt-0">
            <form method="dialog">
              <button className="btn">Close</button>
            </form>
          </div> */}
        </div>
      </dialog>
    </div>
  );
}

export default Key;
