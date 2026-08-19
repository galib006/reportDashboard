import React, { useRef, useState, useContext } from "react";
import { toast, ToastContainer } from "react-toastify";
import { GetDataContext } from "../components/DataContext";

function Key() {
  const modalref1 = useRef(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const { updateApiKey } = useContext(GetDataContext);

  const btnSave = () => {
    if (apiKeyInput.trim() === "") {
      toast.error("Field Empty!");
    } else {
      const success = updateApiKey(apiKeyInput);
      if (success) {
        toast.success("Key Add Successful!");
        modalref1.current.close();
        setApiKeyInput("");
      }
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
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                />
              </label>
              <div className="validator-hint hidden">Enter key</div>
            </div>
            <button className="btn btn-success join-item" onClick={btnSave}>
              Save
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}

export default Key;