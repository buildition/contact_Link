import { useEffect, useState, useRef } from "react";
import "./App.css";
import contactLinkLogo from "./assets/images/Contact_Link_Logo.png";
import Select from "react-select";
import ProfilePage from "./ProfilePage";
import "./ProfilePage.css";

type RowData = Record<string, string | number | boolean | null | undefined>;

type ExcelDataProps = {
  user: {
    name: string;
    profession: string;
    description: string;
    contact: string;
    address: string;
    password: string;
  };
  onLogout: () => void;
  onUpdateUser: (updatedDetails: {
    name: string;
    profession: string;
    description: string;
    contact: string;
    address: string;
  }) => Promise<void>;
};

const API_URL =
  "https://script.google.com/macros/s/AKfycbz31F1mGIE_8SfDKiNcPy0fslv8qB7ZViq0jZsneiqRVbjqXXVLvYDNx-FHlUvaz3Y2pg/exec";

function ExcelData({ user, onLogout, onUpdateUser }: ExcelDataProps) {
  const userContact = user.contact;
  const userName = user.name;
  const [filterType, setFilterType] = useState<"my" | "all">("my");
  const [rows, setRows] = useState<RowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<RowData>({});
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchProfession, setSearchProfession] = useState("");
  const [showAddPopup, setShowAddPopup] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);
  const editProfileLocationRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDetailsElement>(null);
  const [duplicateContact, setDuplicateContact] = useState(false);
  const [nameError, setNameError] = useState("");
  const [contactError, setContactError] = useState("");
  const [showProfileDetails, setShowProfileDetails] = useState(false);

  const professionGroups = [
    {
      label: "Healthcare & Medicine",
      options: [
        ["doctor", "Doctor / Physician"],
        ["nurse", "Nurse"],
        ["pharmacist", "Pharmacist"],
        ["dentist", "Dentist"],
        ["surgeon", "Surgeon"],
        ["psychologist", "Psychologist / Therapist"],
        ["physiotherapist", "Physiotherapist"],
        ["veterinarian", "Veterinarian"],
        ["paramedic", "Paramedic / EMT"],
        ["lab_technician", "Medical Lab Technician"],
      ],
    },
    {
      label: "Technology & IT",
      options: [
        ["software_engineer", "Software Engineer / Developer"],
        ["data_scientist", "Data Scientist / Analyst"],
        ["it_support", "IT Support Specialist"],
        ["cybersecurity", "Cybersecurity Analyst"],
        ["web_developer", "Web Developer"],
        ["network_engineer", "Network Engineer"],
        ["ui_ux_designer", "UI/UX Designer"],
        ["product_manager", "Product Manager"],
        ["ai_ml_engineer", "AI / Machine Learning Engineer"],
      ],
    },
    {
      label: "Engineering & Architecture",
      options: [
        ["civil_engineer", "Civil Engineer"],
        ["mechanical_engineer", "Mechanical Engineer"],
        ["electrical_engineer", "Electrical Engineer"],
        ["chemical_engineer", "Chemical Engineer"],
        ["architect", "Architect"],
        ["surveyor", "Surveyor"],
        ["industrial_designer", "Industrial Designer"],
      ],
    },
    {
      label: "Business, Finance & Management",
      options: [
        ["accountant", "Accountant"],
        ["auditor", "Auditor"],
        ["financial_analyst", "Financial Analyst"],
        ["banker", "Banker"],
        ["hr_manager", "Human Resources (HR) Manager"],
        ["business_analyst", "Business Analyst"],
        ["marketing_manager", "Marketing Manager"],
        ["sales_executive", "Sales Executive"],
        ["entrepreneur", "Entrepreneur / Business Owner"],
        ["consultant", "Management Consultant"],
      ],
    },
    {
      label: "Education & Academia",
      options: [
        ["teacher", "School Teacher"],
        ["professor", "University Professor / Lecturer"],
        ["tutor", "Private Tutor"],
        ["researcher", "Academic Researcher"],
        ["librarian", "Librarian"],
        ["principal", "School Principal / Administrator"],
      ],
    },
    {
      label: "Law & Public Policy",
      options: [
        ["lawyer", "Lawyer / Advocate"],
        ["judge", "Judge / Magistrate"],
        ["paralegal", "Paralegal"],
        ["civil_servant", "Civil Servant / Government Officer"],
        ["police_officer", "Police Officer"],
        ["military", "Military / Armed Forces Personnel"],
        ["firefighter", "Firefighter"],
      ],
    },
    {
      label: "Arts, Media & Entertainment",
      options: [
        ["graphic_designer", "Graphic Designer"],
        ["journalist", "Journalist / Reporter"],
        ["writer", "Writer / Author / Editor"],
        ["photographer", "Photographer / Videographer"],
        ["actor", "Actor / Performer"],
        ["musician", "Musician / Singer"],
        ["fashion_designer", "Fashion Designer"],
        ["content_creator", "Content Creator / Influencer"],
      ],
    },
    {
      label: "Science & Environment",
      options: [
        ["scientist", "Scientist"],
        ["biologist", "Biologist"],
        ["chemist", "Chemist"],
        ["physicist", "Physicist"],
        ["environmental_scientist", "Environmental Scientist"],
        ["geologist", "Geologist"],
      ],
    },
    {
      label: "Hospitality, Tourism & Service",
      options: [
        ["chef", "Chef / Cook"],
        ["hotel_manager", "Hotel Manager"],
        ["flight_attendant", "Flight Attendant"],
        ["pilot", "Pilot"],
        ["travel_agent", "Travel Agent / Tour Guide"],
        ["customer_service", "Customer Service Representative"],
        ["retail_worker", "Retail Salesperson"],
      ],
    },
    {
      label: "Skilled Trades & Construction",
      options: [
        ["electrician", "Electrician"],
        ["plumber", "Plumber"],
        ["carpenter", "Carpenter"],
        ["mechanic", "Automotive Mechanic"],
        ["welder", "Welder"],
        ["construction_worker", "Construction Worker"],
        ["driver", "Driver / Chauffeur"],
        ["farmer", "Farmer / Agriculturist"],
      ],
    },
    {
      label: "Other",
      options: [
        ["student", "Student"],
        ["homemaker", "Homemaker"],
        ["freelancer", "Freelancer"],
        ["retired", "Retired"],
        ["unemployed", "Unemployed"],
        ["other", "Other"],
      ],
    },
  ];

  const [showEditProfile, setShowEditProfile] = useState(false);

const [editProfile, setEditProfile] = useState({
  name: user.name || "",
  profession: user.profession || "",
  description: user.description || "",
  contact: user.contact || "",
  address: user.address || "",
});

const [profileNameError, setProfileNameError] = useState("");
const [profileContactError, setProfileContactError] = useState("");
const [profileError, setProfileError] = useState("");

const handleProfileChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
) => {
  const { name } = e.target;
  let { value } = e.target;

  if (name === "name") {
    if (value.length > 50) {
      setProfileNameError("Name cannot exceed 50 characters.");
      return;
    }

    setProfileNameError(
      value.length > 0 && !/^[A-Za-z\s]+$/.test(value)
        ? "Name should contain letters only."
        : ""
    );
  }

  if (name === "contact") {
    value = value.replace(/\D/g, "").slice(0, 10);

    if (value.length > 0 && value.length < 10) {
      setProfileContactError("Please enter a valid 10-digit mobile number.");
    } else if (
      value.length === 10 &&
      !/^[6-9]\d{9}$/.test(value)
    ) {
      setProfileContactError(
        "Mobile number must start with 6, 7, 8, or 9."
      );
    } else {
      setProfileContactError("");
    }
  }

  setEditProfile((prev) => ({
    ...prev,
    [name]: value,
  }));
};

const handleSaveProfile = async () => {
  setProfileError("");

  const enteredName = editProfile.name.trim();
  const enteredContact = editProfile.contact.trim();

  if (!enteredName) {
    setProfileNameError("Name is required.");
    return;
  }

  if (!/^[A-Za-z\s]+$/.test(enteredName)) {
    setProfileNameError("Name should contain letters only.");
    return;
  }

  if (enteredName.length > 50) {
    setProfileNameError("Name cannot exceed 50 characters.");
    return;
  }

  if (!editProfile.profession) {
    setProfileError("Please select your profession.");
    return;
  }

  if (!/^[6-9]\d{9}$/.test(enteredContact)) {
    setProfileContactError(
      "Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9."
    );
    return;
  }

  if (!editProfile.address.trim()) {
    setProfileError("Please select your service location.");
    return;
  }

  if (editProfile.description.length > 300) {
    setProfileError("Description cannot exceed 300 characters.");
    return;
  }

  try {
    await onUpdateUser({
      name: enteredName,
      profession: editProfile.profession,
      description: editProfile.description,
      contact: enteredContact,
      address: editProfile.address,
    });

    setShowEditProfile(false);
    setError("");
  } catch (error) {
    setProfileError(
      error instanceof Error
        ? error.message
        : "Unable to update profile."
    );
  }
};

const handleDeleteAccount = async () => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "deleteAccount",
        contact: user.contact,
      }),
    });

    if (!response.ok) {
      throw new Error("Unable to delete account.");
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Account deletion failed.");
    }

    // Logout after successful account deletion
    onLogout();
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("Unable to delete account. Please try again.");
  }
};

const getCityState = (address: string) => {
  if (!address) return "";

  const parts = address.split(",").map((item) => item.trim());

  // Return only the city name (second-last part)
  return parts.length >= 2 ? parts[parts.length - 3] : parts[0];
};


  // Find the contact column regardless of capitalization.
// const getContactHeader = (row: RowData) =>
//   Object.keys(row).find((header) =>
//     ["contact", "contact number", "mobile", "phone"].includes(
//       header.trim().toLowerCase()
//     )
//   );

  // Keep each row's original index for edit/delete operations.
const getContactHeader = (row: RowData) =>
  Object.keys(row).find((header) =>
    [
      "contact",
      "contactnumber",
      "mobile",
      "mobilenumber",
      "phone",
      "phonenumber",
    ].includes(header.trim().toLowerCase().replace(/[\s_-]/g, ""))
  );

// Check whether this contact has registered an account.
const isVerifiedContact = (row: RowData) => {
  const contactHeader = getContactHeader(row);
  const ownerHeader = getOwnerHeader(row);

  if (!contactHeader || !ownerHeader) return false;

  const contactNumber = normalizeContact(row[contactHeader]);

  const addedBy = String(row[ownerHeader] ?? "");

  const ownerNumbers = addedBy.match(/\((\d{10})\)/g) || [];

  return ownerNumbers.some(
    (owner) => normalizeContact(owner) === contactNumber
  );
};

const getOwnerHeader = (row: RowData) =>
  Object.keys(row).find(
    (header) =>
      header.trim().toLowerCase().replace(/\s+/g, "") === "addedby"
  );

const getVerifiedByName = (row: RowData) => {
  const contactHeader = getContactHeader(row);
  const ownerHeader = getOwnerHeader(row);

  if (!contactHeader || !ownerHeader) return "";

  const contactNumber = normalizeContact(row[contactHeader]);
  const addedBy = String(row[ownerHeader] ?? "");

  const owners = addedBy.split(";");

  const verifiedOwner = owners.find((owner) => {
    const match = owner.match(/\((\d{10})\)/);

    return match && normalizeContact(match[1]) === contactNumber;
  });

  return verifiedOwner
    ? verifiedOwner.replace(/\s*\(\d{10}\)/, "").trim()
    : "";
};

const filteredRows = rows
  .map((row, originalIndex) => ({ row, originalIndex }))
  .filter(({ row }) => {
    // My Contacts / All Contacts filter
    if (filterType === "my") {
      const ownerHeader = getOwnerHeader(row);

      if (!ownerHeader) return false;

      const addedBy = String(row[ownerHeader] ?? "").trim();
      const contact = String(userContact ?? "").trim();

   const ownerNumbers = addedBy.match(/\((\d{10})\)/g) || [];

    const isOwner = ownerNumbers.some(
      owner => owner.replace(/[()]/g, "") === contact
    );

    if (!isOwner) return false;
    }

    // Profession filter
    if (searchProfession) {
      const professionHeader = Object.keys(row).find(
        (header) => header.trim().toLowerCase() === "profession"
      );

      if (!professionHeader) return false;

      const profession = String(row[professionHeader] ?? "")
        .trim()
        .toLowerCase();

      if (!profession.includes(searchProfession.toLowerCase())) {
        return false;
      }
    }

    return true;
  });


  useEffect(() => {
    async function fetchExcelData() {
      try {
        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error("Unable to fetch spreadsheet data.");
        }

        const data: unknown = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("The API did not return a row array.");
        }

        setRows(data as RowData[]);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading data."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchExcelData();
    
  }, []);

useEffect(() => {
  if (!showAddPopup || !locationRef.current) return;

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

          if (place.formattedAddress) {
            const addressHeader = headers.find((header) => {
              const normalized = header
                .trim()
                .toLowerCase()
                .replace(/\s+/g, "");

              return (
                normalized === "address" ||
                normalized === "servicelocation"
              );
            });

            if (addressHeader) {
              handleChange(addressHeader, place.formattedAddress);
            }
          }
        } catch (error) {
          console.error("Place selection error:", error);
          setError("Unable to fetch the selected location.");
        }
      }
    );

    locationRef.current.replaceChildren(autocomplete);
  };

  initializeAutocomplete().catch((error) => {
    console.error("Google Maps initialization error:", error);
    setError("Unable to load Google Maps. Please try again.");
  });

  return () => {
    cancelled = true;
    autocomplete?.remove();
  };
}, [showAddPopup]);

useEffect(() => {
  if (!showEditProfile || !editProfileLocationRef.current) return;

  let autocomplete:
    | google.maps.places.PlaceAutocompleteElement
    | null = null;

  let cancelled = false;

  const initializeAutocomplete = async () => {
    const { PlaceAutocompleteElement } =
      (await google.maps.importLibrary(
        "places"
      )) as google.maps.PlacesLibrary;

    if (cancelled || !editProfileLocationRef.current) return;

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

          if (place.formattedAddress) {
            setEditProfile((prev) => ({
              ...prev,
              address: place.formattedAddress!,
            }));
          }
        } catch (error) {
          console.error("Profile location selection error:", error);
        }
      }
    );

    editProfileLocationRef.current.replaceChildren(autocomplete);
  };

  initializeAutocomplete().catch((error) => {
    console.error("Google Places initialization error:", error);
  });

  return () => {
    cancelled = true;
    autocomplete?.remove();
  };
}, [showEditProfile]);

useEffect(() => {
  const handleOutsideClick = (event: MouseEvent) => {
    const dropdown = profileDropdownRef.current;

    if (
      dropdown &&
      !dropdown.contains(event.target as Node)
    ) {
      dropdown.open = false;
    }
  };

  document.addEventListener("mousedown", handleOutsideClick);

  return () => {
    document.removeEventListener("mousedown", handleOutsideClick);
  };
}, []);

  const headers = Object.keys(rows[0] ?? editRow);

const handleAdd = () => {
  setError("");
  setDuplicateContact(false);

  if (rows.length === 0) {
    setError("No column headers are available.");
    return;
  }

  const currentHeaders = Object.keys(rows[0]);
  const newRow: RowData = {};

  currentHeaders.forEach((header) => {
    newRow[header] = "";
  });

  const addedByHeader = currentHeaders.find(
    (header) =>
      header.trim().toLowerCase().replace(/\s+/g, "") === "addedby"
  );

  if (addedByHeader) {
    newRow[addedByHeader] = `${userName} (${userContact})`;
  }

  setEditRow(newRow);
  setEditingIndex(null);
  setIsAdding(true);
  setShowAddPopup(true);
  setNameError("");
  setContactError("");
};


const handleEdit = (originalIndex: number) => {
  setError("");
  setEditingIndex(originalIndex);
  setEditRow({ ...rows[originalIndex] });
  setIsAdding(false);
  setShowAddPopup(true);
};

const normalizeContact = (value: unknown) =>
  String(value ?? "").replace(/\D/g, "");

const isContactHeader = (header: string) =>
  ["contact", "contactnumber", "mobile", "mobilenumber", "phone", "phonenumber"]
    .includes(header.trim().toLowerCase().replace(/\s+/g, ""));

const isNameHeader = (header: string) =>
  header.trim().toLowerCase() === "name";

const handleChange = (header: string, value: string) => {

  // Name validation
  if (isNameHeader(header)) {
    if (value.length > 50) {
      setNameError("Name cannot exceed 50 characters.");
      return;
    }

    setNameError(
      value.length > 0 && !/^[A-Za-z\s]+$/.test(value)
        ? "Name should contain letters only."
        : ""
    );
  }

  // Mobile number validation - same as Signup
  if (isContactHeader(header)) {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 10);

    value = digitsOnly;

    if (digitsOnly.length > 0 && !/^[6-9]\d{9}$/.test(digitsOnly)) {
      setContactError(
        digitsOnly.length < 10
          ? "Please enter a valid 10-digit mobile number."
          : "Mobile number must start with 6, 7, 8, or 9."
      );
    } else {
      setContactError("");
    }
  }

  setEditRow((previous) => ({
    ...previous,
    [header]: value,
  }));

  // Check duplicate mobile number only while adding
  if (isAdding && isContactHeader(header)) {
    const enteredContact = normalizeContact(value);

    if (enteredContact.length === 10) {
      const contactHeader = Object.keys(rows[0] || {}).find(
        (column) => isContactHeader(column)
      );

      const alreadyExists = rows.some((row) => {
        const existingContact = normalizeContact(
          contactHeader ? row[contactHeader] : ""
        );

        return existingContact === enteredContact;
      });

      setDuplicateContact(alreadyExists);
    } else {
      setDuplicateContact(false);
    }
  }
};

const isRequiredField = (header: string) => {
  const normalized = header.trim().toLowerCase().replace(/\s+/g, "");

  return (
    normalized !== "description" &&
    normalized !== "email" &&
    normalized !== "emailaddress" &&
    normalized !== "addedby"
  );
};

const isFormValid = () => {
  if (!isAdding) return true;

  const requiredFieldsValid = headers
    .filter(isRequiredField)
    .every((header) => String(editRow[header] ?? "").trim() !== "");

  const contactHeader = headers.find((header) =>
    isContactHeader(header)
  );

  const contact = contactHeader
    ? String(editRow[contactHeader] ?? "")
    : "";

  const validContact = /^[6-9]\d{9}$/.test(contact);

  return requiredFieldsValid && validContact;
};

  const handleSave = async () => {
    if (isAdding && duplicateContact) {
  setError("Mobile number already exists!");
  return;
}

    if (saving) return;

    if (!isAdding && editingIndex === null) return;

    setError("");
    // Validate required fields when adding a new contact
if (isAdding) {
  const nameHeader = headers.find((header) => isNameHeader(header));

  if (nameHeader) {
    const enteredName = String(editRow[nameHeader] ?? "").trim();

    if (!enteredName) {
      setNameError("Name is required.");
      return;
    }

    if (!/^[A-Za-z\s]+$/.test(enteredName)) {
      setNameError("Name should contain letters only.");
      return;
    }

    if (enteredName.length > 50) {
      setNameError("Name cannot exceed 50 characters.");
      return;
    }
  }
}
    setSaving(true);

    try {
      const payload = isAdding
        ? { action: "add", row: editRow }
        : {
            action: "update",
            index: editingIndex,
            row: editRow,
          };

      const response = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save the row.");
      }

      // Apps Script may return HTTP 200 even when its own code reports an error.
      const result = await response.json();

      if (result?.success === false) {
        throw new Error(result.message || "The server could not save the row.");
      }

      if (isAdding) {
        setRows((previous) => [...previous, { ...editRow }]);
      } else {
        setRows((previous) =>
          previous.map((row, index) =>
            index === editingIndex ? { ...editRow } : row
          )
        );
      }

      setEditingIndex(null);
      setEditRow({});
      setIsAdding(false);
      setShowAddPopup(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save the row. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

const handleCancel = () => {
  setEditingIndex(null);
  setEditRow({});
  setIsAdding(false);
  setShowAddPopup(false);
  setError("");
  setNameError("");
  setContactError("");
};

  const handleDelete = async (originalIndex: number) => {
    if (saving) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this row?"
    );

    if (!confirmed) return;

    setError("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "delete",
          index: originalIndex,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete the row.");
      }

      const result = await response.json();

      if (result?.success === false) {
        throw new Error(result.message || "The server could not delete the row.");
      }

      setRows((previous) =>
        previous.filter((_, index) => index !== originalIndex)
      );

      if (editingIndex === originalIndex) {
        setEditingIndex(null);
        setEditRow({});
      } else if (
        editingIndex !== null &&
        editingIndex > originalIndex
      ) {
        setEditingIndex(editingIndex - 1);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete the row."
      );
    }
  };

  // const buttonStyle = {
  //   padding: "7px 12px",
  //   margin: "3px",
  //   cursor: "pointer",
  // } as const;

if (showProfileDetails) {
  return (
    <ProfilePage
      user={{
        name: user.name,
        profession: user.profession,
        description: user.description,
        contact: user.contact,
        address: user.address,
      }}
      onBack={() => setShowProfileDetails(false)}
      onLogout={onLogout}
      onDeleteAccount={handleDeleteAccount}
      onEdit={() => {
        setEditProfile({
          name: user.name || "",
          profession: user.profession || "",
          description: user.description || "",
          contact: user.contact || "",
          address: user.address || "",
        });

        setProfileNameError("");
        setProfileContactError("");
        setProfileError("");
        setShowEditProfile(true);
      }}
      showEditProfile={showEditProfile}
      editProfile={editProfile}
      professionGroups={professionGroups}
      editProfileLocationRef={editProfileLocationRef}
      profileNameError={profileNameError}
      profileContactError={profileContactError}
      profileError={profileError}
      handleProfileChange={handleProfileChange}
      setEditProfile={setEditProfile}
      handleSaveProfile={handleSaveProfile}
      onCancelEdit={() => {
        setShowEditProfile(false);
        setProfileNameError("");
        setProfileContactError("");
        setProfileError("");
      }}
    />
  );
}

if (loading) return <p>Loading spreadsheet data...</p>;

return (
  <div className="contacts-dashboard">

    {/* Page heading */}

{/* Top header: Logo left, user profile right */}
<div className="welcome-header">
  <div className="dashboard-brand">
    <img
      src={contactLinkLogo}
      alt="Contact Link"
      className="brand-logo dashboard-logo"
    />
  </div>

  <details
  className="header-profile-dropdown"
  ref={profileDropdownRef}
>
    <summary className="header-profile-trigger">
      <div className="header-user-avatar">
        {user.name?.charAt(0).toUpperCase() || "U"}
      </div>
      {/* <span className="header-user-name">
        {user.name || "User"}
      </span> */}
      <span className="header-dropdown-arrow">⋮</span>
    </summary>

<div className="header-profile-card">
  <div className="header-profile-heading">
    <div className="header-user-avatar large">
      {user.name?.charAt(0).toUpperCase() || "U"}
    </div>

    <div className="header-profile-user-info">
      <h3>{user.name || "User"}</h3>

      <span>
        {user.profession?.replace(/_/g, " ") || "Member"}
      </span>
    </div>


  </div>

 
<div className="profile-menu-options">

<button
  type="button"
  className="profile-menu-item"
  onClick={() => {
    setShowProfileDetails(true);
    profileDropdownRef.current?.removeAttribute("open");
  }}
>
  <span>Profile</span>
  <span className="profile-menu-arrow">›</span>
</button>

  {/* <button
    type="button"
    className="profile-menu-item"
  >
    <span>Settings</span>
    <span className="profile-menu-arrow">›</span>
  </button> */}

</div>
 <hr />
  <button
    type="button"
    className="profile-logout-btn"
    onClick={onLogout}
  >
    <span>↪</span>
    Logout
  </button>
</div>
  </details>
</div>


{/* Welcome section and Add Contact button */}

<div className="dashboard-welcome-row">
  <div className="welcome-text">
    <span>Welcome back!</span>
    <h2>{user.name}</h2>
  </div>

  <button
    className="add-contact-btn"
    onClick={handleAdd}
    disabled={isAdding || editingIndex !== null || saving}
  >
    + Add Contact
  </button>
</div>


    {/* {error && (
      <p className="error-message" role="alert">
        {error}
      </p>
    )} */}

    {/* Filters and search */}
    <div className="contacts-toolbar">
      <div className="filter-buttons">
        <button
          className={filterType === "my" ? "filter-btn active" : "filter-btn"}
          onClick={() => setFilterType("my")}
        >
          My Contacts
        </button>

        <button
          className={filterType === "all" ? "filter-btn active" : "filter-btn"}
          onClick={() => setFilterType("all")}
        >
          All Contacts
        </button>
      </div>

      <div className="profession-search">
        <input
          type="text"
          placeholder="Search by profession..."
          value={searchProfession}
          onChange={(event) => setSearchProfession(event.target.value)}
        />

        {searchProfession && (
          <button
            type="button"
            className="clear-search"
            onClick={() => setSearchProfession("")}
          >
            Clear
          </button>
        )}
      </div>
    </div>

    {/* Contact cards */}
    {rows.length === 0 ? (
      <div className="empty-state">
        <h3>No contacts available</h3>
        <p>Check your Google Sheet or add a contact.</p>
      </div>
    ) : filteredRows.length === 0 ? (
      <div className="empty-state">
        <h3>No contacts found</h3>
        <p>Try changing your filter or profession search.</p>
      </div>
    ) : (
      <div className="contacts-card-grid">
        {filteredRows.map(({ row, originalIndex }) => {
          const professionHeader = headers.find(
            (header) => header.trim().toLowerCase() === "profession"
          );

          const nameHeader = headers.find(
            (header) => header.trim().toLowerCase() === "name"
          );

          const contactName = nameHeader
            ? String(row[nameHeader] ?? "Unknown User")
            : "Contact";

          const profession = professionHeader
            ? String(row[professionHeader] ?? "Professional")
            : "Professional";

          const addressHeader = headers.find((header) => {
          const normalized = header.trim().toLowerCase().replace(/\s+/g, "");

          return normalized === "address" || normalized === "servicelocation";
          });

          const address = addressHeader
            ? String(row[addressHeader] ?? "")
            : "";

          const cityState = getCityState(address);

          return (
  
          <details className="contact-card">
            {/* Always-visible clickable header */}

            <summary className="contact-card-header">
              <div className="contact-avatar">
                {contactName.charAt(0).toUpperCase()}
              </div>

            <div className="contact-card-title">
              <h3>
                {contactName}

                {isVerifiedContact(row) && (
                  <span className="verified-badge">
                    ✓ Verified by {getVerifiedByName(row)}
                  </span>
                )}
              </h3>

                <div className="contact-profession-location">
                  <span className="contact-profession">
                    {profession.replace(/_/g, " ")}
                  </span> 

                  <span> | </span>
                  <span>
                   {cityState && (
                    <small className="contact-location">
                      📍 {cityState}
                    </small>
                  )}
                  </span>

                </div>
              </div>

              <span className="card-toggle-text">
                <span className="view-text">View</span>
                <span className="close-text">Hide</span>
              </span>
            </summary>


            {/* Expandable content */}
            <div className="contact-card-content">
              <div className="contact-card-details">
                {headers
                  .filter((header) => {
                    const normalizedHeader = header
                      .trim()
                      .toLowerCase()
                      .replace(/\s+/g, "");

                    if (
                      normalizedHeader === "name" ||
                      normalizedHeader === "profession" ||
                      normalizedHeader === "email" ||
                      normalizedHeader === "emailaddress"
                    ) {
                      return false;
                    }

                    if (filterType === "my" && normalizedHeader === "addedby") {
                      return false;
                    }

                    return true;
                  })
                  .map((header) => (
                                      <div
                    className={`contact-detail ${
                      ["contact", "servicelocation", "address", "addedby"].includes(
                        header.trim().toLowerCase().replace(/\s+/g, "")
                      )
                        ? "contact-detail-highlight"
                        : ""
                    }`}
                    key={header}
                  >
                      <label>
                        {header.trim().toLowerCase().replace(/\s+/g, "") === "address"
                          ? "Service Location"
                          : header}
                      </label>

                    <span>
                      {String(row[header] ?? "") || "Not provided"}
                    </span>
                    </div>
                  ))}
              </div>

              {filterType === "my" && !isVerifiedContact(row) && (
                <div className="contact-card-actions">
                  <button
                    type="button"
                    className="action-btn edit-btn"
                    onClick={() => handleEdit(originalIndex)}
                    disabled={isAdding || saving}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="action-btn delete-btn"
                    onClick={() => handleDelete(originalIndex)}
                    disabled={isAdding || saving}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </details>

          );
        })}
      </div>
    )}

    {/* Add Contact Popup */}
    {showAddPopup && (
      <div
        className="popup-overlay"
        onClick={(event) => {
          if (event.target === event.currentTarget && !saving) {
            handleCancel();
          }
        }}
      >
        <div
          className="add-contact-popup"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-contact-title"
        >
          <div className="popup-header">
            <div>
              <h2 id="add-contact-title">
                {isAdding ? "Add New Contact" : "Edit Contact"}
              </h2>
              <p>Enter professional contact details</p>

              {error && (
                <p className="popup-error-message" role="alert">
                  {error}
                </p>
              )}
            </div>

            <button
              className="popup-close"
              type="button"
              onClick={handleCancel}
              disabled={saving}
              aria-label="Close popup"
            >
              ×
            </button>
          </div>

          <div className="popup-form">
            {headers
            .filter((header) => {
              const normalizedHeader = header
                .trim()
                .toLowerCase()
                .replace(/\s+/g, "");

              return (
                normalizedHeader !== "email" &&
                normalizedHeader !== "emailaddress" &&
                normalizedHeader !== "addedby"
              );
            })
            .map((header) => (
              <div className="popup-field" key={header}>
                <label>
                {header.trim().toLowerCase().replace(/\s+/g, "") === "address" ||
                header.trim().toLowerCase().replace(/\s+/g, "") === "servicelocation"
                  ? "Service Location"
                  : header}
                {isRequiredField(header) && (
                  <span className="required-star">*</span>
                )}
              </label>
              {header.trim().toLowerCase() === "profession" ? (
                <Select
                  options={professionGroups.map((group) => ({
                    label: group.label,
                    options: group.options.map(([value, label]) => ({
                      value,
                      label,
                    })),
                  }))}
                  value={
                    editRow[header]
                      ? professionGroups
                          .flatMap((group) =>
                            group.options.map(([value, label]) => ({
                              value,
                              label,
                            }))
                          )
                          .find(
                            (option) => option.value === String(editRow[header])
                          ) || {
                            value: String(editRow[header]),
                            label: String(editRow[header]).replace(/_/g, " "),
                          }
                      : null
                  }
                  onChange={(selectedOption) =>
                    handleChange(header, selectedOption?.value || "")
                  }
                  placeholder="Search or select your profession..."
                  isSearchable
                  isClearable
                  className="profession-select"
                  classNamePrefix="profession-select"
                />
              ) : header.trim().toLowerCase() === "description" ? (
                <>
                  <textarea
                    value={String(editRow[header] ?? "")}
                    onChange={(event) =>
                      handleChange(header, event.target.value)
                    }
                    placeholder="Enter description (optional)"
                    maxLength={300}
                    rows={3}
                  />

                  <small className="character-count">
                    {String(editRow[header] ?? "").length}/300 characters
                  </small>
                </>
              ) : (
                header.trim().toLowerCase().replace(/\s+/g, "") === "address" ||
                header.trim().toLowerCase().replace(/\s+/g, "") === "servicelocation"
              ) ? (
                <>
                  <div ref={locationRef}></div>

                  {editRow[header] && (
                    <small className="selected-location">
                      Selected: {String(editRow[header])}
                    </small>
                  )}
                </>
              ) : (
                <>
            <input
              type={isContactHeader(header) ? "tel" : "text"}
              required={isRequiredField(header)}
              value={String(editRow[header] ?? "")}
              maxLength={isContactHeader(header) ? 10 : undefined}
              inputMode={isContactHeader(header) ? "numeric" : undefined}
              pattern={isContactHeader(header) ? "[6-9][0-9]{9}" : undefined}
              onChange={(event) =>
                handleChange(header, event.target.value)
              }
              placeholder={
                isContactHeader(header)
                  ? "Enter 10-digit mobile number"
                  : `Enter ${header}`
              }
            />

            {isAdding && isContactHeader(header) && contactError && (
              <small className="popup-error-message">
                {contactError}
              </small>
            )}

                  {isNameHeader(header) && nameError && (
                    <small className="popup-error-message">
                      {nameError}
                    </small>
                  )}

                  {isAdding && isContactHeader(header) && duplicateContact && (
                    <small className="popup-error-message">
                      Mobile number already exists!
                    </small>
                  )}
                </>
              )}
              </div>
            ))}
          </div>

          <div className="popup-actions">
            <button
              className="action-btn cancel-btn"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              className="action-btn save-btn"
              onClick={handleSave}
              disabled={
                saving ||
                (isAdding && (!isFormValid() || duplicateContact))
              }
            >
              {saving
                ? "Saving..."
                : isAdding
                  ? "Save Contact"
                  : "Update Contact"}
            </button>
          </div>
        </div>
      </div>
    )}

  </div>
);
}

export default ExcelData;