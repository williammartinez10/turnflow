import Home from "./pages/Home/Home";
import Login from "./pages/login/Login";

function App() {
    if (window.location.pathname === "/login") {
        return <Login />;
    }

    return <Home />;
}

export default App;