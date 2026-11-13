/// <reference types="google.maps" />

import { useState, useEffect, useRef } from "react";
import "./App.css";
import ExcelData from "./ExcelUserData";
import { setOptions } from "@googlemaps/js-api-loader";

type User = {
  name: string;
  profession: string;
  contact: string;
  email: string;
  address: string;
  password: string;
};

setOptions({
  key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  v: "weekly",
});

function App() {

  const API_URL = "https://script.google.com/macros/s/AKfycbz31F1mGIE_8SfDKiNcPy0fslv8qB7ZViq0jZsneiqRVbjqXXVLvYDNx-FHlUvaz3Y2pg/exec";

const locationRef = useRef<HTMLDivElement>(null);
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


useEffect(() => {
  let autocomplete: google.maps.places.PlaceAutocompleteElement | null = null;
  let cancelled = false;

  const initializeAutocomplete = async () => {
    const { PlaceAutocompleteElement } =
      (await google.maps.importLibrary(
        "places"
      )) as google.maps.PlacesLibrary;

    if (cancelled || !locationRef.current) return;

    autocomplete = new PlaceAutocompleteElement();

    autocomplete.placeholder = "Search your service location...";
    autocomplete.includedRegionCodes = ["in"];

    autocomplete.addEventListener(
      "gmp-select",
      async (event: google.maps.places.PlacePredictionSelectEvent) => {
        try {
          const place = event.placePrediction.toPlace();

          await place.fetchFields({
            fields: ["formattedAddress", "location"],
          });

          setUser((previous) => ({
            ...previous,
            address: place.formattedAddress || "",
          }));
        } catch (error) {
          console.error("Place selection error:", error);
          setMessage("Unable to fetch the selected location.");
        }
      }
    );

    locationRef.current.replaceChildren(autocomplete);
  };

  initializeAutocomplete().catch((error) => {
    console.error("Google Maps initialization error:", error);
    setMessage("Unable to load Google Maps. Please try again.");
  });

  return () => {
    cancelled = true;
    autocomplete?.remove();
  };
}, []);



  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setUser({
      ...user,
      [event.target.name]: event.target.value,
    });
  };

// const getCurrentLocation = () => {
//   if (!navigator.geolocation) {
//     setMessage("Geolocation is not supported by your browser.");
//     return;
//   }

//   setMessage("Getting your current location...");

//   navigator.geolocation.getCurrentPosition(
//     async (position) => {
//       const { latitude, longitude } = position.coords;

//       setUser((previous) => ({
//         ...previous,
//         address: `Latitude: ${latitude}, Longitude: ${longitude}`,
//       }));

//       setMessage("Location captured successfully!");
//     },
//     (error) => {
//       console.error("Location error:", error);
//       setMessage("Unable to get location. Please allow location access.");
//     }
//   );
// };

 
const handleSignup = async (
  event: React.FormEvent<HTMLFormElement>
) => {
  event.preventDefault();
  setMessage("");

  if (!user.address.trim()) {
  setMessage("Please select your service location.");
  return;
}

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
  <h1>Contact Link</h1>
  <h2>{isSignup ? "Create Account" : "Login"}</h2>

  {message && <p className="message">{message}</p>}

  {/* SIGNUP FIELDS */}
  {isSignup && (
    <>
      <label htmlFor="name">Name<span>*</span></label>
      <input
        id="name"
        name="name"
        type="text"
        placeholder="Enter your name"
        value={user.name}
        onChange={handleChange}
        required
      />

      <label htmlFor="profession">Profession<span>*</span></label>
      <select
        id="profession"
        name="profession"
        value={user.profession}
        onChange={(event) =>
          setUser({
            ...user,
            profession: event.target.value,
          })
        }
        required
      >
      <option value="" disabled>-- Select a Profession --</option>

      <optgroup label="Healthcare & Medicine">
        <option value="doctor">Doctor / Physician</option>
        <option value="nurse">Nurse</option>
        <option value="pharmacist">Pharmacist</option>
        <option value="dentist">Dentist</option>
        <option value="surgeon">Surgeon</option>
        <option value="psychologist">Psychologist / Therapist</option>
        <option value="physiotherapist">Physiotherapist</option>
        <option value="veterinarian">Veterinarian</option>
        <option value="paramedic">Paramedic / EMT</option>
        <option value="lab_technician">Medical Lab Technician</option>
      </optgroup>

      <optgroup label="Technology & IT">
        <option value="software_engineer">Software Engineer / Developer</option>
        <option value="data_scientist">Data Scientist / Analyst</option>
        <option value="it_support">IT Support Specialist</option>
        <option value="cybersecurity">Cybersecurity Analyst</option>
        <option value="web_developer">Web Developer</option>
        <option value="network_engineer">Network Engineer</option>
        <option value="ui_ux_designer">UI/UX Designer</option>
        <option value="product_manager">Product Manager</option>
        <option value="ai_ml_engineer">AI / Machine Learning Engineer</option>
      </optgroup>

      <optgroup label="Engineering & Architecture">
        <option value="civil_engineer">Civil Engineer</option>
        <option value="mechanical_engineer">Mechanical Engineer</option>
        <option value="electrical_engineer">Electrical Engineer</option>
        <option value="chemical_engineer">Chemical Engineer</option>
        <option value="architect">Architect</option>
        <option value="surveyor">Surveyor</option>
        <option value="industrial_designer">Industrial Designer</option>
      </optgroup>

      <optgroup label="Business, Finance & Management">
        <option value="accountant">Accountant</option>
        <option value="auditor">Auditor</option>
        <option value="financial_analyst">Financial Analyst</option>
        <option value="banker">Banker</option>
        <option value="hr_manager">Human Resources (HR) Manager</option>
        <option value="business_analyst">Business Analyst</option>
        <option value="marketing_manager">Marketing Manager</option>
        <option value="sales_executive">Sales Executive</option>
        <option value="entrepreneur">Entrepreneur / Business Owner</option>
        <option value="consultant">Management Consultant</option>
      </optgroup>

      <optgroup label="Education & Academia">
        <option value="teacher">School Teacher</option>
        <option value="professor">University Professor / Lecturer</option>
        <option value="tutor">Private Tutor</option>
        <option value="researcher">Academic Researcher</option>
        <option value="librarian">Librarian</option>
        <option value="principal">School Principal / Administrator</option>
      </optgroup>

      <optgroup label="Law & Public Policy">
        <option value="lawyer">Lawyer / Advocate</option>
        <option value="judge">Judge / Magistrate</option>
        <option value="paralegal">Paralegal</option>
        <option value="civil_servant">Civil Servant / Government Officer</option>
        <option value="police_officer">Police Officer</option>
        <option value="military">Military / Armed Forces Personnel</option>
        <option value="firefighter">Firefighter</option>
      </optgroup>

      <optgroup label="Arts, Media & Entertainment">
        <option value="graphic_designer">Graphic Designer</option>
        <option value="journalist">Journalist / Reporter</option>
        <option value="writer">Writer / Author / Editor</option>
        <option value="photographer">Photographer / Videographer</option>
        <option value="actor">Actor / Performer</option>
        <option value="musician">Musician / Singer</option>
        <option value="fashion_designer">Fashion Designer</option>
        <option value="content_creator">Content Creator / Influencer</option>
      </optgroup>

      <optgroup label="Science & Environment">
        <option value="scientist">Scientist</option>
        <option value="biologist">Biologist</option>
        <option value="chemist">Chemist</option>
        <option value="physicist">Physicist</option>
        <option value="environmental_scientist">Environmental Scientist</option>
        <option value="geologist">Geologist</option>
      </optgroup>

      <optgroup label="Hospitality, Tourism & Service">
        <option value="chef">Chef / Cook</option>
        <option value="hotel_manager">Hotel Manager</option>
        <option value="flight_attendant">Flight Attendant</option>
        <option value="pilot">Pilot</option>
        <option value="travel_agent">Travel Agent / Tour Guide</option>
        <option value="customer_service">Customer Service Representative</option>
        <option value="retail_worker">Retail Salesperson</option>
      </optgroup>

      <optgroup label="Skilled Trades & Construction">
        <option value="electrician">Electrician</option>
        <option value="plumber">Plumber</option>
        <option value="carpenter">Carpenter</option>
        <option value="mechanic">Automotive Mechanic</option>
        <option value="welder">Welder</option>
        <option value="construction_worker">Construction Worker</option>
        <option value="driver">Driver / Chauffeur</option>
        <option value="farmer">Farmer / Agriculturist</option>
      </optgroup>

      <optgroup label="Other">
        <option value="student">Student</option>
        <option value="homemaker">Homemaker</option>
        <option value="freelancer">Freelancer</option>
        <option value="retired">Retired</option>
        <option value="unemployed">Unemployed</option>
        <option value="other">Other</option>
      </optgroup>
      </select>
    </>
  )}

  {/* COMMON CONTACT FIELD */}
  <label htmlFor="contact">Contact Number<span>*</span></label>
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
        
      />

      <label htmlFor="address">
        Service Location<span>*</span>
      </label>

      {/* Google Maps autocomplete */}
      <div ref={locationRef}></div>

      {/* Manual location entry */}
      {/* <p>OR</p>
      <input
        id="address"
        name="address"
        type="text"
        placeholder="Enter your service location manually"
        value={user.address}
        onChange={handleChange}
        required
      /> */}

     

      {/* <button
        type="button"
        onClick={getCurrentLocation}
        className="location-button"
      >
        📍 Get Current Location
      </button> */}
    </>
  )}

  {/* COMMON PASSWORD FIELD */}
  <label htmlFor="password">Password<span>*</span></label>
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