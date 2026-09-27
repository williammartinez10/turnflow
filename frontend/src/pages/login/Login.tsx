import "./Login.css";
import { ClockCheck } from "lucide-react";

function Login() {
    return (
        <div className="login-page">
            {/* Header */}
            <header className="login-header">
                <a className="login-brand" href="/">
                    <span className="login-brand-icon">
                        <ClockCheck size={24} />
                    </span>
                    <span>TurnFlow</span>
                </a>
            </header>

            {/* Login form */}
            <main className="login-main">
                <div className="login-content">
                    <h1>Log In</h1>
                    <p>Log in to your Staff or Admin account.</p>

                    <form className="login-form" onSubmit={(e) => e.preventDefault()}>
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            required
                        />

                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            required
                        />

                        <button type="submit">Log In</button>
                    </form>

                    <p className="login-signup-label">Don't have an account?</p>

                    <div className="login-signup-links">
                        <a href="/signup/staff/staff_code">Sign Up as Staff</a>
                        <a href="/signup/admin">Sign Up as Admin</a>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Login;