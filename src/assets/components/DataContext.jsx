import React, { createContext, useState } from 'react'
export const GetDataContext = createContext()
function DataContext({children}) {
    const {data,setData} = useState([]);
  return (
    <GetDataContext.Provider value={{data,setData}}>
        {children}
    </GetDataContext.Provider>
  )
}

export default DataContext
