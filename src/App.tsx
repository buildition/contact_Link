import { useState } from "react";
import "./App.css";
import ExcelData from "./ExcelUserData";

type User = {
  name: string;
  profession: string;
  contact: string;
  email: string;
  address: string;
  password: string;
};
function App() {

  const API_URL = "https://script.google.com/macros/s/AKfycbz31F1mGIE_8SfDKiNcPy0fslv8qB7ZViq0jZsneiqRVbjqXXVLvYDNx-FHlUvaz3Y2pg/exec";

  const [isSignup, setIsSignup] = useState(true);
  const [user, setUser] = useState<User>({
    name: "",
    profession: "",
    contact: "",
    email: "",
    address: "",
    password: "",
  });
  const [loggedIn, setLoggedIn] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setUser({
      ...user,
      [event.target.name]: event.target.value,
    });
  };

 
const handleSignup = async (
  event: React.FormEvent<HTMLFormElement>
) => {
  event.preventDefault();
  setMessage("");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "signup",
        ...user,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage(result.message || "Signup failed.");
      return;
    }

    setMessage("Signup successful! Please log in.");
    setIsSignup(false);

    setUser({
      name: "",
      profession: "",
      contact: "",
      email: "",
      address: "",
      password: "",
    });
  } catch {
    setMessage("Unable to connect to the server.");
  }
};


const handleLogin = async (
  event: React.FormEvent<HTMLFormElement>
) => {
  event.preventDefault();
  setMessage("");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "login",
        contact: user.contact,
        password: user.password,
      }),
    });

    const result = await response.json();

    console.log("Login API response:", result);

    if (!result.success) {
      setMessage(
        result.message || "Invalid login credentials."
      );
      return;
    }

    if (!result.user) {
      setMessage(
        "Login successful, but profile details were not returned by the API. Please update your Google Apps Script."
      );
      return;
    }

    setUser((previous) => ({
      ...previous,
      name: result.user.name || "",
      profession: result.user.profession || "",
      contact: result.user.contact || "",
      email: result.user.email || "",
      address: result.user.address || "",
      password: "",
    }));

    setLoggedIn(true);
    setMessage("");
  } catch (error) {
    console.error("Login error:", error);
    setMessage("Unable to connect to the server.");
  }
};



  const handleLogout = () => {
    setLoggedIn(false);
    setIsSignup(false);
    setUser({     name: "",
    profession: "",
    contact: "",
    email: "",
    address: "",
    password: "", });
  };


if (loggedIn) {
  return (
    <div>
      <header className="welcome-header">
        <div className="profile-info">
          <h2>Welcome, {user.name}!</h2>

          <details className="profile-dropdown">
            <summary>My Profile</summary>

            <div className="profile-card">
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Profession:</strong> {user.profession || "—"}</p>
              <p><strong>Contact:</strong> {user.contact}</p>
              <p><strong>Email:</strong> {user.email || "—"}</p>
              <p><strong>Address:</strong> {user.address || "—"}</p>
            </div>
          </details>
        </div>

        <button onClick={handleLogout}>Logout</button>
      </header>

      <ExcelData userContact={user.contact} userName={user.name} />
    </div>
  );
}


  return (
    <div className="auth-container">

<form
  className="auth-form"
  onSubmit={isSignup ? handleSignup : handleLogin}
>
  <h2>{isSignup ? "Create Account" : "Login"}</h2>

  {message && <p className="message">{message}</p>}

  {/* SIGNUP FIELDS */}
  {isSignup && (
    <>
      <label htmlFor="name">Name</label>
      <input
        id="name"
        name="name"
        type="text"
        placeholder="Enter your name"
        value={user.name}
        onChange={handleChange}
        required
      />

      <label htmlFor="profession">Profession</label>
      <input
        id="profession"
        name="profession"
        type="text"
        placeholder="Enter your profession"
        value={user.profession}
        onChange={handleChange}
        required
      />
    </>
  )}

  {/* COMMON CONTACT FIELD */}
  <label htmlFor="contact">Contact Number</label>
  <input
    id="contact"
    name="contact"
    type="tel"
    placeholder="Enter contact number"
    value={user.contact}
    onChange={handleChange}
    pattern="[0-9]{10}"
    maxLength={10}
    minLength={10}
    required
  />

  {/* SIGNUP EMAIL AND ADDRESS */}
  {isSignup && (
    <>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        name="email"
        type="email"
        placeholder="Enter your email"
        value={user.email}
        onChange={handleChange}
        required
      />

      <label htmlFor="address">Address</label>
      <input
        id="address"
        name="address"
        type="text"
        placeholder="Enter your address"
        value={user.address}
        onChange={handleChange}
        required
      />
    </>
  )}

  {/* COMMON PASSWORD FIELD */}
  <label htmlFor="password">Password</label>
  <input
    id="password"
    name="password"
    type="password"
    placeholder="Enter password"
    value={user.password}
    onChange={handleChange}
    minLength={8}
    required
  />

  <button type="submit">
    {isSignup ? "Sign Up" : "Login"}
  </button>

  <p>
    {isSignup
      ? "Already have an account?"
      : "Don't have an account?"}{" "}

    <button
      type="button"
      className="switch-button"
      onClick={() => {
        setIsSignup(!isSignup);
        setMessage("");
        setUser({
          name: "",
          profession: "",
          contact: "",
          email: "",
          address: "",
          password: "",
        });
      }}
    >
      {isSignup ? "Login" : "Sign Up"}
    </button>
  </p>
</form>

    </div>
  );
}

export default App;