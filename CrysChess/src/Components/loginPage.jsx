import { useEffect, useState } from "react";
import "./loginPage.css";

export default function loginPage() {
  const [tab, setTab] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({
    email: "",
    password: "",
    username: "",
    confirm: "",
  });
  const [errors, setErrors] = useState({});

  // Kill page scrollbars on the auth screen
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = prevOverflow);
  }, []);

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    const e = {};
    // Email
    if (!form.email) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email";

    // Password (8+, upper/lower/number)
    if (!form.password) e.password = "Password is required";
    else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.password))
      e.password = "Min 8 chars with upper, lower & number";

    if (tab === "register") {
      if (!form.username) e.username = "Username is required";
      else if (!/^[a-zA-Z0-9_]{3,16}$/.test(form.username))
        e.username = "3–16 chars, letters/numbers/_ only";
      if (!form.confirm) e.confirm = "Confirm your password";
      else if (form.confirm !== form.password)
        e.confirm = "Passwords do not match";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    if (tab === "login") {
      // handle real login here
      alert("Logged in to CrysChess 🧊♟️");
    } else {
      // handle real registration here
      alert("Account created — welcome to CrysChess! 🎉");
    }
  };

  return (
    <div
      className="auth-page"
      // put your local bg image at /public/assets/cryschess-bg.jpg
      style={{ "--bg-url": "url(/assets/cryschess-bg.jpg)" }}
    >
      <div className="auth-card">
        {/* Brand */}
        <div className="brand">
          <span className="crys">Crys</span>
          <span className="chess">Chess</span>
        </div>

        {/* Tabs */}
        <div className="tabs" role="tablist" aria-label="Auth Tabs">
          <button
            role="tab"
            aria-selected={tab === "login"}
            className={`tab ${tab === "login" ? "active" : ""}`}
            onClick={() => setTab("login")}
          >
            Login
          </button>
          <button
            role="tab"
            aria-selected={tab === "register"}
            className={`tab ${tab === "register" ? "active" : ""}`}
            onClick={() => setTab("register")}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form className="form" onSubmit={submit} noValidate>
          {tab === "register" && (
            <div className="group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                value={form.username}
                onChange={onChange}
                placeholder="e.g. shankizumi"
                autoComplete="username"
              />
              {errors.username && <small className="err">{errors.username}</small>}
            </div>
          )}

          <div className="group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              value={form.email}
              onChange={onChange}
              placeholder="you@example.com"
              autoComplete="email"
              inputMode="email"
            />
            {errors.email && <small className="err">{errors.email}</small>}
          </div>

          <div className="group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={onChange}
              placeholder="••••••••"
              autoComplete={tab === "login" ? "current-password" : "new-password"}
            />
            {errors.password && <small className="err">{errors.password}</small>}
          </div>

          {tab === "register" && (
            <div className="group">
              <label htmlFor="confirm">Confirm Password</label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                value={form.confirm}
                onChange={onChange}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              {errors.confirm && <small className="err">{errors.confirm}</small>}
            </div>
          )}

          <button type="submit" className="btn primary">
            {tab === "login" ? "Log In" : "Create Account"}
          </button>

          <div className="or">or</div>

          <button type="button" className="btn google" onClick={() => alert("Google OAuth…")}>
            {/* you can swap this with an actual Google icon */}
            <span className="gdot" aria-hidden />
            Continue with Google
          </button>
        </form>
      </div>
    </div>
  );
}
