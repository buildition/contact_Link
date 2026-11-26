/// <reference types="google.maps" />

import { useState, useEffect, useRef } from "react";
import "./ExcelUserData.css";
import ExcelData from "./ExcelUserData";
import { setOptions } from "@googlemaps/js-api-loader";
import contactLinkLogo from "./assets/images/Contact_Link_Logo.png";
import Select from "react-select";

type User = {
  name: string;
  profession: string;
  description: string;
  contact: string;
  // email: string;
  address: string;
  password: string;
};

setOptions({
  key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  v: "weekly",
});

type StoredUser = Omit<User, "password">;

const STORAGE_KEY = "contactLinkUser";

const getStoredUser = (): StoredUser | null => {
  try {
    const savedUser = localStorage.getItem(STORAGE_KEY);

    if (!savedUser) return null;

    const parsedUser = JSON.parse(savedUser);

    if (!parsedUser.contact) return null;

    return {
      name: parsedUser.name || "",
      profession: parsedUser.profession || "",
      description: parsedUser.description || "",
      contact: parsedUser.contact,
      address: parsedUser.address || "",
    };
  } catch {
    return null;
  }
};

function App() {

const API_URL = "https://script.google.com/macros/s/AKfycbz31F1mGIE_8SfDKiNcPy0fslv8qB7ZViq0jZsneiqRVbjqXXVLvYDNx-FHlUvaz3Y2pg/exec";

const locationRef = useRef<HTMLDivElement>(null);
const [isSignup, setIsSignup] = useState(true);

const [user, setUser] = useState<User>(() => {
  const savedUser = getStoredUser();

  return savedUser
    ? { ...savedUser, password: "" }
    : {
        name: "",
        profession: "",
        description: "",
        contact: "",
        address: "",
        password: "",
      };
});

const [loggedIn, setLoggedIn] = useState(
  () => getStoredUser() !== null
);
const [message, setMessage] = useState("");

const [contactStatus, setContactStatus] = useState("");
const [checkingContact, setCheckingContact] = useState(false);
const [contactExists, setContactExists] = useState(false);
const [nameError, setNameError] = useState("");



  const isValidMobile = /^[6-9]\d{9}$/.test(user.contact);

  const showMobileError =
    user.contact.length > 0 && !isValidMobile;

const isValidName = /^[A-Za-z\s]+$/.test(user.name.trim());

const showNameError =
  user.name.length > 0 && !isValidName;

const isSignupDisabled =
  !user.name.trim() ||
  !isValidName ||
  user.name.length > 50 ||
  !!nameError ||
  !user.profession ||
  !/^[6-9]\d{9}$/.test(user.contact) ||
  user.password.length < 8 ||
  !user.address.trim() ||
  contactExists ||
  checkingContact ||
  !contactStatus.toLowerCase().includes("available");

const isLoginDisabled =
  !user.contact.trim() ||
  !/^[6-9]\d{9}$/.test(user.contact) ||
  !user.password.trim(); 

useEffect(() => {
  // Initialize autocomplete only on the signup form
  if (loggedIn || !isSignup || !locationRef.current) return;

  let autocomplete:
    | google.maps.places.PlaceAutocompleteElement
    | null = null;

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
}, [loggedIn, isSignup]);

useEffect(() => {
  if (!isSignup || loggedIn) {
    setContactStatus("");
    setContactExists(false);
    setCheckingContact(false);
    return;
  }

  const contact = user.contact;

  if (!/^\d{10}$/.test(contact)) {
    setContactStatus("");
    setContactExists(false);
    setCheckingContact(false);
    return;
  }

  let cancelled = false;

  const timer = setTimeout(async () => {
    try {
      setCheckingContact(true);
      setContactStatus("");

      const response = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "checkContact",
          contact,
        }),
      });

      const result = await response.json();

      if (cancelled) return;

      if (!result.success) {
        setContactStatus(result.message || "Unable to verify contact number.");
        setContactExists(false);
        return;
      }

if (result.exists) {
  setContactExists(true);
  setContactStatus("Contact number already registered.");
} else {
  setContactExists(false);
  setContactStatus("Contact number is available.");
}
    } catch (error) {
      if (!cancelled) {
        console.error("Contact check error:", error);
        setContactStatus("Unable to check contact number.");
        setContactExists(false);
      }
    } finally {
      if (!cancelled) {
        setCheckingContact(false);
      }
    }
  }, 500);

  return () => {
    cancelled = true;
    clearTimeout(timer);
  };
}, [user.contact, isSignup, loggedIn]);


const handleChange = (
  event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
) => {
  const { name, value } = event.target;

  if (name === "contact") {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 10);

    setUser((previous) => ({
      ...previous,
      contact: digitsOnly,
    }));

    setContactStatus("");
    setContactExists(false);
    setCheckingContact(false);
    return;
  }

if (name === "name" && value.length > 50) {
  setNameError("Name cannot contain more than 50 characters.");
  return;
}

if (name === "name") {
  setNameError("");
}

  setUser((prev) => ({
    ...prev,
    [name]: value,
  }));
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
  if (user.contact.length !== 10 || contactExists || checkingContact) {
  setMessage("Please enter a valid, available 10-digit contact number.");
  return;
}
  setMessage("");

  if (!/^\d{10}$/.test(user.contact)) {
  setMessage("Please enter exactly 10 digits in the contact number.");
  return;
}

if (contactExists || checkingContact) {
  setMessage("Please enter an available contact number.");
  return;
}

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
      description: "",
      // email: "",
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
      // email: result.user.email || "",
      address: result.user.address || "",
      password: "",
    }));

    const loggedInUser: StoredUser = {
      name: result.user.name || "",
      profession: result.user.profession || "",
      description: result.user.description || "",
      contact: result.user.contact || "",
      address: result.user.address || "",
    };

    // Save user profile in localStorage
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(loggedInUser)
    );

    // Update React state
    setUser({
      ...loggedInUser,
      password: "",
    });

    setLoggedIn(true);
    setMessage("");
  } catch (error) {
    console.error("Login error:", error);
    setMessage("Unable to connect to the server.");
  }
};



const handleLogout = () => {

  // Clear saved login session
  localStorage.removeItem(STORAGE_KEY);

  // Reset login state
  setLoggedIn(false);
  setIsSignup(false);

  // Reset user details
  setUser({
    name: "",
    profession: "",
    description: "",
    contact: "",
    address: "",
    password: "",
  });

  setMessage("");
};



const handleUpdateUser = async (updatedDetails: {
  name: string;
  profession: string;
  description: string;
  contact: string;
  address: string;
}) => {
  try {
    const originalContact = user.contact;

    const payload = {
      action: "updateProfile",
      originalContact,
      name: updatedDetails.name,
      profession: updatedDetails.profession,
      description: updatedDetails.description,
      contact: updatedDetails.contact,
      address: updatedDetails.address,
    };

    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Unable to update profile.");
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Profile update failed.");
    }

    const updatedUser: StoredUser = {
      name: result.user.name || "",
      profession: result.user.profession || "",
      description: result.user.description || "",
      contact: result.user.contact || "",
      address: result.user.address || "",
    };

    setUser({
      ...updatedUser,
      password: "",
    });

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updatedUser)
    );

  } catch (error) {
    console.error("Profile update error:", error);
    throw error;
  }
};





if (loggedIn) {
  return (
    <ExcelData
      user={user}
      onLogout={handleLogout}
      onUpdateUser={handleUpdateUser}
    />
  );
}

console.log({
  name: user.name,
  profession: user.profession,
  contact: user.contact,
  passwordLength: user.password.length,
  address: user.address,
  contactStatus,
  contactExists,
  checkingContact,
  isSignupDisabled,
});
  return (
    <div className="auth-container">

<form
  className="auth-form"
  onSubmit={isSignup ? handleSignup : handleLogin}
>
  <div className="auth-brand">
    <img src={contactLinkLogo} alt="Contact Link" className="brand-logo auth-logo" />
    {/* <p className="brand-tagline">Connect. Share. Grow.</p> */}
  </div>
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

{(showNameError || nameError) && (
  <small className="contact-validation error">
    {nameError || "Name should contain letters only."}
  </small>
)}



<label htmlFor="profession">
  Profession<span>*</span>
</label>

<Select
  inputId="profession"
  options={[
    {
      label: "Healthcare & Medicine",
      options: [
        { value: "doctor", label: "Doctor / Physician" },
        { value: "nurse", label: "Nurse" },
        { value: "pharmacist", label: "Pharmacist" },
        { value: "dentist", label: "Dentist" },
        { value: "surgeon", label: "Surgeon" },
        { value: "psychologist", label: "Psychologist / Therapist" },
        { value: "physiotherapist", label: "Physiotherapist" },
        { value: "veterinarian", label: "Veterinarian" },
        { value: "paramedic", label: "Paramedic / EMT" },
        { value: "lab_technician", label: "Medical Lab Technician" },
      ],
    },
    {
      label: "Technology & IT",
      options: [
        { value: "software_engineer", label: "Software Engineer / Developer" },
        { value: "data_scientist", label: "Data Scientist / Analyst" },
        { value: "it_support", label: "IT Support Specialist" },
        { value: "cybersecurity", label: "Cybersecurity Analyst" },
        { value: "web_developer", label: "Web Developer" },
        { value: "network_engineer", label: "Network Engineer" },
        { value: "ui_ux_designer", label: "UI/UX Designer" },
        { value: "product_manager", label: "Product Manager" },
        { value: "ai_ml_engineer", label: "AI / Machine Learning Engineer" },
      ],
    },
    {
      label: "Engineering & Architecture",
      options: [
        { value: "civil_engineer", label: "Civil Engineer" },
        { value: "mechanical_engineer", label: "Mechanical Engineer" },
        { value: "electrical_engineer", label: "Electrical Engineer" },
        { value: "chemical_engineer", label: "Chemical Engineer" },
        { value: "architect", label: "Architect" },
        { value: "surveyor", label: "Surveyor" },
        { value: "industrial_designer", label: "Industrial Designer" },
      ],
    },
    {
      label: "Business, Finance & Management",
      options: [
        { value: "accountant", label: "Accountant" },
        { value: "auditor", label: "Auditor" },
        { value: "financial_analyst", label: "Financial Analyst" },
        { value: "banker", label: "Banker" },
        { value: "hr_manager", label: "Human Resources (HR) Manager" },
        { value: "business_analyst", label: "Business Analyst" },
        { value: "marketing_manager", label: "Marketing Manager" },
        { value: "sales_executive", label: "Sales Executive" },
        { value: "entrepreneur", label: "Entrepreneur / Business Owner" },
        { value: "consultant", label: "Management Consultant" },
      ],
    },
    {
      label: "Education & Academia",
      options: [
        { value: "teacher", label: "School Teacher" },
        { value: "professor", label: "University Professor / Lecturer" },
        { value: "tutor", label: "Private Tutor" },
        { value: "researcher", label: "Academic Researcher" },
        { value: "librarian", label: "Librarian" },
        { value: "principal", label: "School Principal / Administrator" },
      ],
    },
    {
      label: "Law & Public Policy",
      options: [
        { value: "lawyer", label: "Lawyer / Advocate" },
        { value: "judge", label: "Judge / Magistrate" },
        { value: "paralegal", label: "Paralegal" },
        { value: "civil_servant", label: "Civil Servant / Government Officer" },
        { value: "police_officer", label: "Police Officer" },
        { value: "military", label: "Military / Armed Forces Personnel" },
        { value: "firefighter", label: "Firefighter" },
      ],
    },
    {
      label: "Arts, Media & Entertainment",
      options: [
        { value: "graphic_designer", label: "Graphic Designer" },
        { value: "journalist", label: "Journalist / Reporter" },
        { value: "writer", label: "Writer / Author / Editor" },
        { value: "photographer", label: "Photographer / Videographer" },
        { value: "actor", label: "Actor / Performer" },
        { value: "musician", label: "Musician / Singer" },
        { value: "fashion_designer", label: "Fashion Designer" },
        { value: "content_creator", label: "Content Creator / Influencer" },
      ],
    },
    {
      label: "Science & Environment",
      options: [
        { value: "scientist", label: "Scientist" },
        { value: "biologist", label: "Biologist" },
        { value: "chemist", label: "Chemist" },
        { value: "physicist", label: "Physicist" },
        { value: "environmental_scientist", label: "Environmental Scientist" },
        { value: "geologist", label: "Geologist" },
      ],
    },
    {
      label: "Hospitality, Tourism & Service",
      options: [
        { value: "chef", label: "Chef / Cook" },
        { value: "hotel_manager", label: "Hotel Manager" },
        { value: "flight_attendant", label: "Flight Attendant" },
        { value: "pilot", label: "Pilot" },
        { value: "travel_agent", label: "Travel Agent / Tour Guide" },
        { value: "customer_service", label: "Customer Service Representative" },
        { value: "retail_worker", label: "Retail Salesperson" },
      ],
    },
    {
      label: "Skilled Trades & Construction",
      options: [
        { value: "electrician", label: "Electrician" },
        { value: "plumber", label: "Plumber" },
        { value: "carpenter", label: "Carpenter" },
        { value: "mechanic", label: "Automotive Mechanic" },
        { value: "welder", label: "Welder" },
        { value: "construction_worker", label: "Construction Worker" },
        { value: "driver", label: "Driver / Chauffeur" },
        { value: "farmer", label: "Farmer / Agriculturist" },
      ],
    },
    {
      label: "Other",
      options: [
        { value: "student", label: "Student" },
        { value: "homemaker", label: "Homemaker" },
        { value: "freelancer", label: "Freelancer" },
        { value: "retired", label: "Retired" },
        { value: "unemployed", label: "Unemployed" },
        { value: "other", label: "Other" },
      ],
    },
  ]}
  value={
    user.profession
      ? { value: user.profession, label: user.profession.replace(/_/g, " ") }
      : null
  }
  onChange={(selectedOption) =>
    setUser((previous) => ({
      ...previous,
      profession: selectedOption?.value || "",
    }))
  }
  placeholder="Search or select your profession..."
  isSearchable
  isClearable
  required
/>
   

  <label htmlFor="description">Description</label>
<textarea
  id="description"
  name="description"
  placeholder="Enter your description (optional)"
  value={user.description}
  onChange={handleChange}
  maxLength={300}
  rows={3}
/>

{user.description.length > 0 && (
  <small className="character-count">
    {user.description.length}/300 characters
  </small>
)}

  <label>Service Location<span>*</span></label>
<div ref={locationRef}></div>
 </>
  )}
  {/* COMMON CONTACT FIELD */}
  <label htmlFor="contact">Contact Number<span>*</span></label>
<input
  id="contact"
  name="contact"
  type="tel"
  placeholder="Enter 10-digit mobile number"
  value={user.contact}
  onChange={handleChange}
  inputMode="numeric"
  pattern="[6-9][0-9]{9}"
  minLength={10}
  maxLength={10}
  title="Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9"
  required
/>
{showMobileError && (
  <small className="contact-validation error">
    Please enter a valid 10-digit mobile number.
  </small>
)}

{isSignup && user.contact.length === 10 && (
  <small
    className={
      contactExists
        ? "contact-validation error"
        : contactStatus.includes("available")
          ? "contact-validation success"
          : "contact-validation"
    }
  >
    {checkingContact ? "Checking contact number..." : contactStatus}
  </small>
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

<button
  type="submit"
  disabled={isSignup ? isSignupDisabled : isLoginDisabled}
>
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
          description: "",
          contact: "",
          // email: "",
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