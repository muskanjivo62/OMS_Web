import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import App_User from "./pages/App_User";
import Sap_sync from "./pages/Sap_Sync";
import Add_Sales from "./pages/Add_Sales";
import View_Orders from "./pages/View_Orders";
import Auditor_orders from "./pages/Auditor_Order";
import Billing_orders from "./pages/Billing_Order";

function App() {
  return (
    <BrowserRouter>
       <Routes>
      
        <Route path="/" element={<Login />} />

        <Route
          path="/Dashboard"
          element={
            <Sidebar>
              <Dashboard />
              </Sidebar>}
        />      

        <Route
          path="/App_User"
          element={
            <Sidebar>
              <App_User />
              </Sidebar>}
        />      
        

        <Route
          path="/Sap_Sync"
          element={
            <Sidebar>
              <Sap_sync />
              </Sidebar>}
        />      

       <Route
          path="/Add_Sales"
          element={
            <Sidebar>
              <Add_Sales />
              </Sidebar>}
        />     

         <Route
          path="/View_Orders"
          element={
            <Sidebar>
              <View_Orders />
              </Sidebar>}
        />

        <Route
          path="/Auditor_orders"
          element={
            <Sidebar>
              <Auditor_orders />
            </Sidebar>}
        />

        <Route
          path="/Billing_orders"
          element={
            <Sidebar>
              <Billing_orders />
            </Sidebar>}
        />

       </Routes>
    </BrowserRouter>
  );
}

export default App;

