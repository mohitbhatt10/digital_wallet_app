import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ExpenseFilters from "./pages/ExpenseFilters";
import Profile from "./pages/Profile";
import OAuthCallback from "./pages/OAuthCallback";
import Protected from "./components/Protected";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";

const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },
  {
    element: <Protected />,
    children: [
      { path: "/dashboard", element: <Dashboard /> },
      { path: "/expenses/filter", element: <ExpenseFilters /> },
      { path: "/profile", element: <Profile /> },
    ],
  },
  { path: "/oauth2/callback", element: <OAuthCallback /> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
