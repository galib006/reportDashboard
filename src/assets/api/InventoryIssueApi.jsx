import { useContext } from "react"
import { GetDataContext } from "../components/DataContext"

const InventoryIssueApi = () => {
  const {cndata, setcndata, setLoading} = useContext(GetDataContext)

  return (
    <div>
      <h1>Inventory issue api</h1>
    </div>
  )
}

export default InventoryIssueApi
