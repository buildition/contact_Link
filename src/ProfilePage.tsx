import { useEffect, useRef, useState } from "react";
import "./ProfilePage.css";
import contactLinkLogo from "./assets/images/Contact_Link_Logo.png";
import Select from "react-select";

type ProfilePageProps = {
  user: {
    name: string;
    profession: string;
    description: string;
    contact: string;
    address: string;
  };
  onBack: () => void;
  onEdit: () => void;
  onLogout: () => void;

  showEditProfile: boolean;
  editProfile: {
    name: string;
    profession: string;
    description: string;
    contact: string;
    address: string;
  };
  professionGroups: {
    label: string;
    options: [string, string][];
  }[];
  editProfileLocationRef: React.RefObject<HTMLDivElement | null>;
  profileNameError: string;
  profileContactError: string;
  profileError: string;
  handleProfileChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  setEditProfile: React.Dispatch<React.SetStateAction<{
    name: string;
    profession: string;
    description: string;
    contact: string;
    address: string;
  }>>;
  handleSaveProfile: () => Promise<void>;
  onCancelEdit: () => void;
  onDeleteAccount: () => Promise<void>;
};

function ProfilePage({
  user,
  onBack,
  onEdit,
  onLogout,
  onDeleteAccount,
  showEditProfile,
  editProfile,
  professionGroups,
  editProfileLocationRef,
  profileNameError,
  profileContactError,
  profileError,
  handleProfileChange,
  setEditProfile,
  handleSaveProfile,
  onCancelEdit,
}: ProfilePageProps) {
  const profileDropdownRef = useRef<HTMLDetailsElement>(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        profileDropdownRef.current.open = false;
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const profession = user.profession?.replace(/_/g, " ") || "Member";

const handleConfirmDelete = async () => {
  if (isDeleting) return;

  try {
    setIsDeleting(true);
    setDeleteError("");

    await onDeleteAccount();

    // Close popup after successful deletion
    setShowDeletePopup(false);
  } catch (error) {
    setDeleteError(
      error instanceof Error
        ? error.message
        : "Unable to delete account. Please try again."
    );
  } finally {
    setIsDeleting(false);
  }
};

  return (
    <div className="contacts-dashboard profile-dashboard">

      {/* Dashboard Header */}
      <header className="welcome-header">
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
            <span className="header-dropdown-arrow">⋮</span>
          </summary>

          <div className="header-profile-card">
            <div className="header-profile-heading">
              <div className="header-user-avatar large">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </div>

              <div className="header-profile-user-info">
                <h3>{user.name || "User"}</h3>
                <span>{profession}</span>
              </div>

            </div>

            <div className="profile-menu-options">
              <button
                type="button"
                className="profile-menu-item"
                onClick={() =>
                  profileDropdownRef.current?.removeAttribute("open")
                }
              >
                <span>My Profile</span>
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
      </header>



      {/* Profile Content */}
      <main className="profile-page">

        <div className="profile-page-heading">
          <div>
            <button
              type="button"
              className="profile-back-btn"
              onClick={onBack}
            >
              <span>←</span> Back to Dashboard
            </button>

            <h1>My Profile</h1>
            <p>Manage and view your personal information</p>
          </div>

          <button
            type="button"
            className="profile-edit-main-btn"
            onClick={onEdit}
          >
            <span>✎</span> Edit Profile
          </button>
        </div>

        {/* Profile Banner */}
        <section className="profile-hero-card">
          <div className="profile-hero-pattern"></div>

          <div className="profile-hero-content">
            <div className="profile-page-avatar">
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>

            <div className="profile-hero-info">

              <h2>{user.name || "User"}</h2>

              <p>{profession}</p>
            </div>
          </div>
        </section>

        {/* Personal Information */}
        <section className="profile-information-card">
          <div className="profile-section-heading">
            

            <div>
              <h3>Personal Information</h3>
              <p>Your registered profile details</p>
            </div>
          </div>

          <div className="profile-information-grid">

            <div className="profile-information-item">
              <div>
                <label>Full Name</label>
                <p>{user.name || "Not provided"}</p>
              </div>
            </div>

            <div className="profile-information-item">
              <div>
                <label>Profession</label>
                <p className="profile-capitalize">
                  {profession}
                </p>
              </div>
            </div>

            <div className="profile-information-item">
              <div>
                <label>Contact Number</label>
                <p>{user.contact || "Not provided"}</p>
              </div>
            </div>

            <div className="profile-information-item">
              <div>
                <label>Service Location</label>
                <p>{user.address || "Not provided"}</p>
              </div>
            </div>

            <div className="profile-information-item profile-description-item">
              <div>
                <label>Description</label>
                <p>{user.description || "No description added yet."}</p>
              </div>
            </div>

          </div>

          <div className="profile-information-footer">
            <span>✦</span>
            Keep your profile information up to date.
          </div>
        </section>
        {/* Delete Account Section */}
        <section className="delete-account-section">
        <div>
            <h3>Delete My Account</h3>
            <p>
            Permanently delete your account and associated profile information.
            This action cannot be undone.
            </p>
        </div>

<button
  type="button"
  className="delete-account-btn"
  onClick={() => {
    setDeleteError("");
    setShowDeletePopup(true);
  }}
  title="Delete My Account"
  aria-label="Delete My Account"
>
  <span className="delete-account-icon">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="m19 6-1 14H6L5 6" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  </span>
</button>
        </section>
      </main>
      {showEditProfile && (
        <div className="profile-modal-overlay">
            <div className="profile-edit-modal">

            <div className="profile-modal-header">
                <h2>Edit Profile</h2>

                <button
                type="button"
                className="modal-close-btn"
                onClick={onCancelEdit}
                >
                ×
                </button>
            </div>

            <div className="profile-form-group">
                <label>Name <span className="required-star">*</span></label>

                <input
                type="text"
                name="name"
                value={editProfile.name}
                onChange={handleProfileChange}
                placeholder="Enter your name"
                maxLength={50}
                />

                {profileNameError && (
                <small className="popup-error-message">
                    {profileNameError}
                </small>
                )}
            </div>

            <div className="profile-form-group">
                <label>Profession <span className="required-star">*</span></label>

                <Select
                options={professionGroups.map((group) => ({
                    label: group.label,
                    options: group.options.map(([value, label]) => ({
                    value,
                    label,
                    })),
                }))}
                value={
                    professionGroups
                    .flatMap((group) =>
                        group.options.map(([value, label]) => ({
                        value,
                        label,
                        }))
                    )
                    .find((option) => option.value === editProfile.profession) || null
                }
                onChange={(selectedOption) =>
                    setEditProfile((prev) => ({
                    ...prev,
                    profession: selectedOption?.value || "",
                    }))
                }
                placeholder="Search or select your profession..."
                isSearchable
                isClearable
                className="profession-select"
                classNamePrefix="profession-select"
                />
            </div>

            <div className="profile-form-group">
                <label>Description</label>

                <textarea
                name="description"
                value={editProfile.description}
                onChange={handleProfileChange}
                placeholder="Enter description (optional)"
                maxLength={300}
                rows={3}
                />

                <small className="character-count">
                {editProfile.description.length}/300 characters
                </small>
            </div>

            <div className="profile-form-group">
                <label>Contact <span className="required-star">*</span></label>

                <input
                type="tel"
                name="contact"
                value={editProfile.contact}
                onChange={handleProfileChange}
                placeholder="Enter 10-digit mobile number"
                inputMode="numeric"
                pattern="[6-9][0-9]{9}"
                maxLength={10}
                />

                {profileContactError && (
                <small className="popup-error-message">
                    {profileContactError}
                </small>
                )}
            </div>

            <div className="profile-form-group">
                <label>Service Location <span className="required-star">*</span></label>

                <div ref={editProfileLocationRef}></div>

                {editProfile.address && (
                <small className="selected-location">
                    Selected: {editProfile.address}
                </small>
                )}
            </div>

            {profileError && (
                <p className="popup-error-message" role="alert">
                {profileError}
                </p>
            )}

            <div className="profile-modal-actions">
                <button
                type="button"
                className="cancel-profile-btn"
                onClick={onCancelEdit}
                >
                Cancel
                </button>

                <button
                type="button"
                className="save-profile-btn save-btn"
                onClick={handleSaveProfile}
                >
                Save Changes
                </button>
            </div>

            </div>
        </div>
        )}
        {/* Delete Account Confirmation Popup */}
{/* Delete Account Confirmation Popup */}
{showDeletePopup && (
  <div className="delete-account-overlay">
    <div
      className="delete-account-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-title"
    >
      <div className="delete-confirm-icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="m19 6-1 14H6L5 6" />
          <path d="M10 11v5M14 11v5" />
        </svg>
      </div>

      <h2 id="delete-account-title">Delete Account?</h2>

      <p>
        Are you sure you want to delete your account?
        All your account information may be permanently deleted.
        This action cannot be undone.
      </p>

      {deleteError && (
        <p className="popup-error-message" role="alert">
          {deleteError}
        </p>
      )}

      <div className="delete-account-actions">
        <button
          type="button"
          className="delete-cancel-btn"
          onClick={() => {
            setShowDeletePopup(false);
            setDeleteError("");
          }}
          disabled={isDeleting}
        >
          Cancel
        </button>

        <button
          type="button"
          className="delete-confirm-btn"
          onClick={handleConfirmDelete}
          disabled={isDeleting}
        >
          {isDeleting ? "Deleting..." : "Yes, Delete Account"}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

export default ProfilePage;
