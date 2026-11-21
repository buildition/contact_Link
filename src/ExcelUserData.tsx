import { useEffect, useState, useRef } from "react";
import "./App.css";
import contactLinkLogo from "./assets/images/Contact_Link_Logo.png";

type RowData = Record<string, string | number | boolean | null | undefined>;

type ExcelDataProps = {
  user: {
    name: string;
    profession: string;
    contact: string;
    // email: string;
    address: string;
    password: string;
  };
  onLogout: () => void;
};

const API_URL =
  "https://script.google.com/macros/s/AKfycbz31F1mGIE_8SfDKiNcPy0fslv8qB7ZViq0jZsneiqRVbjqXXVLvYDNx-FHlUvaz3Y2pg/exec";

function ExcelData({ user, onLogout }: ExcelDataProps) {
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

const getOwnerHeader = (row: RowData) =>
  Object.keys(row).find(
    (header) =>
      header.trim().toLowerCase().replace(/\s+/g, "") === "addedby"
  );

const filteredRows = rows
  .map((row, originalIndex) => ({ row, originalIndex }))
  .filter(({ row }) => {
    // My Contacts / All Contacts filter
    if (filterType === "my") {
      const ownerHeader = getOwnerHeader(row);

      if (!ownerHeader) return false;

      const addedBy = String(row[ownerHeader] ?? "").trim();
      const contact = String(userContact ?? "").trim();

      if (
        addedBy !== contact &&
        !addedBy.endsWith(`(${contact})`)
      ) {
        return false;
      }
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

  const headers = Object.keys(rows[0] ?? editRow);

const handleAdd = () => {
  setError("");

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
};

  const handleEdit = (originalIndex: number) => {
    setError("");
    setEditingIndex(originalIndex);
    setEditRow({ ...rows[originalIndex] });
    setIsAdding(false);
  };

  const handleChange = (header: string, value: string) => {
    setEditRow((previous) => ({
      ...previous,
      [header]: value,
    }));
  };

  const handleSave = async () => {
    if (saving) return;

    if (!isAdding && editingIndex === null) return;

    setError("");
    // Validate required fields when adding a new contact
if (isAdding) {
  const requiredHeaders = headers.filter((header) => {
    const normalized = header.trim().toLowerCase().replace(/\s+/g, "");

    return (
      normalized !== "addedby" &&
      normalized !== "email" &&
      normalized !== "emailaddress"
    );
  });

  const emptyFields = requiredHeaders.filter(
    (header) => !String(editRow[header] ?? "").trim()
  );

  if (emptyFields.length > 0) {
    setError(
      `Please fill in all required fields: ${emptyFields.join(", ")}`
    );
    return;
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

  const buttonStyle = {
    padding: "7px 12px",
    margin: "3px",
    cursor: "pointer",
  } as const;

  if (loading) return <p>Loading spreadsheet data...</p>;

return (
  <div className="contacts-dashboard">

    {/* Page heading */}
{/* Top header: Logo and Logout */}
<div className="welcome-header">
  <div className="dashboard-brand">
    <img
      src={contactLinkLogo}
      alt="Contact Link"
      className="brand-logo dashboard-logo"
    />
  </div>

  <button className="logout-btn" onClick={onLogout}>
    <span>↪</span> Logout
  </button>
</div>

{/* Welcome section and Add Contact button */}
<div className="dashboard-welcome-row">
  <div className="profile-info">
    <div className="user-avatar">
      {user.name?.charAt(0).toUpperCase() || "U"}
    </div>

    <div className="welcome-text">
      <span>Welcome back!</span>
      <h2>{user.name}</h2>
    </div>

    <details className="profile-dropdown">
      <summary>
        My Profile <span className="dropdown-arrow">⌄</span>
      </summary>

      <div className="profile-card">
        <div className="profile-card-heading">
          <div className="user-avatar small">
            {user.name?.charAt(0).toUpperCase() || "U"}
          </div>

          <div>
            <h3>{user.name}</h3>
            <span>{user.profession || "Member"}</span>
          </div>
        </div>

        <hr />

        <p><strong>Contact:</strong> {user.contact}</p>
        {/* <p><strong>Email:</strong> {user.email || "—"}</p> */}
        <p><strong>Profession:</strong> {user.profession || "—"}</p>
        <p><strong>Service Location:</strong> {user.address || "—"}</p>
      </div>
    </details>
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
                <h3>{contactName}</h3>

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

                      {editingIndex === originalIndex ? (
                        <input
                          className="card-input"
                          value={String(editRow[header] ?? "")}
                          onChange={(event) =>
                            handleChange(header, event.target.value)
                          }
                        />
                      ) : (
                        <span>
                          {header.trim().toLowerCase().replace(/\s+/g, "") === "addedby"
                            ? (() => {
                                const addedBy = String(row[header] ?? "").trim();
                                const currentUser = `${userName} (${userContact})`;

                                return addedBy.toLowerCase() === currentUser.toLowerCase()
                                  ? "You"
                                  : addedBy || "—";
                              })()
                            : String(row[header] ?? "—") || "—"}
                        </span>
                      )}
                    </div>
                  ))}
              </div>

              {filterType === "my" && (
                <div className="contact-card-actions">
                  {editingIndex === originalIndex ? (
                    <>
                      <button
                        className="action-btn save-btn"
                        onClick={handleSave}
                        disabled={saving}
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>

                      <button
                        className="action-btn cancel-btn"
                        onClick={handleCancel}
                        disabled={saving}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="action-btn edit-btn"
                        onClick={() => handleEdit(originalIndex)}
                        disabled={isAdding || saving}
                      >
                        Edit
                      </button>

                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDelete(originalIndex)}
                        disabled={isAdding || saving}
                      >
                        Delete
                      </button>
                    </>
                  )}
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
              <h2 id="add-contact-title">Add New Contact</h2>
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
                  {header} <span className="required-star">*</span>
                </label>
                {header.trim().toLowerCase() === "profession" ? (
                  <select
                    required
                    value={String(editRow[header] ?? "")}
                    onChange={(event) =>
                      handleChange(header, event.target.value)
                    }
                  >
                    <option value="">Select Your Profession</option>

                    {professionGroups.map((group) => (
                      <optgroup label={group.label} key={group.label}>
                        {group.options.map(([value, label]) => (
                          <option value={value} key={value}>
                            {label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  ) : (
                    header.trim().toLowerCase().replace(/\s+/g, "") ===
                    "address" ||
                    header.trim().toLowerCase().replace(/\s+/g, "") ===
                    "servicelocation"
                  ) ? (
                    <div ref={locationRef}></div>
                  ) : (
                    <input
                      type="text"
                      required
                      value={String(editRow[header] ?? "")}
                      onChange={(event) =>
                        handleChange(header, event.target.value)
                      }
                      placeholder={`Enter ${header}`}
                    />
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
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Contact"}
            </button>
          </div>
        </div>
      </div>
    )}

  </div>
);
}

export default ExcelData;