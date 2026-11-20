import { useEffect, useState } from "react";
import "./App.css";
import contactLinkLogo from "./assets/images/Contact_Link_Logo.png";

type RowData = Record<string, string | number | boolean | null | undefined>;

type ExcelDataProps = {
  user: {
    name: string;
    profession: string;
    contact: string;
    email: string;
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
        <p><strong>Email:</strong> {user.email || "—"}</p>
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

    {error && (
      <p className="error-message" role="alert">
        {error}
      </p>
    )}

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

          return (
            <div className="contact-card" key={originalIndex}>
              <div className="contact-card-header">
                <div className="contact-avatar">
                  {contactName.charAt(0).toUpperCase()}
                </div>

                <div className="contact-card-title">
                  <h3>{contactName}</h3>
                  <span>{profession.replace(/_/g, " ")}</span>
                </div>
              </div>


              <div className="contact-card-details">
                {headers
.filter((header) => {
  const normalizedHeader = header
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");

  // Hide Name and Profession in both tabs
  if (
    normalizedHeader === "name" ||
    normalizedHeader === "profession"
  ) {
    return false;
  }

  // Hide AddedBy only in My Contacts
  if (filterType === "my" && normalizedHeader === "addedby") {
    return false;
  }

  return true;
})
                  .map((header) => (
                    <div className="contact-detail" key={header}>
                      <label>{header}</label>

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
            </div>
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
            {headers.map((header) => (
              <div className="popup-field" key={header}>
                <label>{header}</label>
                <input
                  type="text"
                  value={String(editRow[header] ?? "")}
                  onChange={(event) =>
                    handleChange(header, event.target.value)
                  }
                  placeholder={`Enter ${header}`}
                  disabled={
                    header.trim().toLowerCase().replace(/\s+/g, "") ===
                    "addedby"
                  }
                />
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