import { useEffect, useState } from "react";

type RowData = Record<string, string | number | boolean | null | undefined>;

type ExcelDataProps = {
  userContact: string;
  userName: string;
};

const API_URL =
  "https://script.google.com/macros/s/AKfycbz31F1mGIE_8SfDKiNcPy0fslv8qB7ZViq0jZsneiqRVbjqXXVLvYDNx-FHlUvaz3Y2pg/exec";

function ExcelData({ userContact , userName }: ExcelDataProps) {
  const [filterType, setFilterType] = useState<"my" | "all">("my");
  const [rows, setRows] = useState<RowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<RowData>({});
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  // Find the contact column regardless of capitalization.
const getContactHeader = (row: RowData) =>
  Object.keys(row).find((header) =>
    ["contact", "contact number", "mobile", "phone"].includes(
      header.trim().toLowerCase()
    )
  );

  // Keep each row's original index for edit/delete operations.

const getOwnerHeader = (row: RowData) =>
  Object.keys(row).find(
    (header) =>
      header.trim().toLowerCase().replace(/\s+/g, "") === "addedby"
  );

const filteredRows = rows
  .map((row, originalIndex) => ({ row, originalIndex }))
  .filter(({ row }) => {
    if (filterType === "all") return true;

    const ownerHeader = getOwnerHeader(row);

    if (!ownerHeader) return false;

    const addedBy = String(row[ownerHeader] ?? "").trim();
    const contact = String(userContact ?? "").trim();

    return (
      addedBy === contact ||
      addedBy.endsWith(`(${contact})`)
    );
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
    <div style={{ padding: "20px", overflowX: "auto" }}>
      <h1 style={{ textAlign: "center" }}>User Data</h1>

      {error && (
        <p style={{ color: "red" }} role="alert">
          {error}
        </p>
      )}

      <div style={{ marginBottom: "15px" }}>
        <button
          style={{
            ...buttonStyle,
            backgroundColor: filterType === "my" ? "#2563eb" : "#ddd",
            color: filterType === "my" ? "white" : "black",
          }}
          onClick={() => setFilterType("my")}
        >
          My Contacts
        </button>

        <button
          style={{
            ...buttonStyle,
            backgroundColor: filterType === "all" ? "#2563eb" : "#ddd",
            color: filterType === "all" ? "white" : "black",
          }}
          onClick={() => setFilterType("all")}
        >
          All Contacts
        </button>
      </div>

      <button
        style={{
          ...buttonStyle,
          marginBottom: "12px",
          backgroundColor: "green",
          color: "white",
          border: "none",
        }}
        onClick={handleAdd}
        disabled={isAdding || editingIndex !== null || saving}
      >
        + Add Row
      </button>

      {rows.length === 0 ? (
        <p>
          No data found. Make sure your Google Sheet has column headers and
          your API returns the expected data.
        </p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
          }}
        >
          <thead>
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  style={{
                    border: "1px solid #ccc",
                    padding: "10px",
                    backgroundColor: "#eee",
                  }}
                >
                  {header}
                </th>
              ))}
              <th style={{ border: "1px solid #ccc", padding: "10px" }}>
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {isAdding && (
              <tr>
                {headers.map((header) => (
                  <td
                    key={header}
                    style={{ border: "1px solid #ccc", padding: "8px" }}
                  >
                    <input
                      value={String(editRow[header] ?? "")}
                      onChange={(event) =>
                        handleChange(header, event.target.value)
                      }
                      style={{ width: "100%", boxSizing: "border-box" }}
                    />
                  </td>
                ))}
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  <button onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button onClick={handleCancel} disabled={saving}>
                    Cancel
                  </button>
                </td>
              </tr>
            )}

            {filteredRows.map(({ row, originalIndex }) => (
              <tr key={originalIndex}>
                {headers.map((header) => (
                  <td
                    key={header}
                    style={{ border: "1px solid #ccc", padding: "8px" }}
                  >
                    {editingIndex === originalIndex ? (
                      <input
                        value={editRow[header] ?? ""}
                        onChange={(event) =>
                          handleChange(header, event.target.value)
                        }
                        style={{ width: "100%", boxSizing: "border-box" }}
                      />
                    ) : (
                      header.trim().toLowerCase().replace(/\s+/g, "") === "addedby"
                        ? String(row[header] ?? "")
                        : row[header] ?? ""
                      
                    )}
                  </td>
                ))}

                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {editingIndex === originalIndex ? (
                    <>
                      <button onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button onClick={handleCancel} disabled={saving}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(originalIndex)}
                        disabled={isAdding || saving}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(originalIndex)}
                        disabled={isAdding || saving}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}

            {!isAdding && filteredRows.length === 0 && (
              <tr>
                <td
                  colSpan={headers.length + 1}
                  style={{ padding: "12px", textAlign: "center" }}
                >
                  No contacts found for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ExcelData;