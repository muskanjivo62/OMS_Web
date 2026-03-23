import { useState, useEffect } from "react";
import { userService } from "../services/userService";
import type { User, Option, CreateUserData } from "../services/userService";
import "../styles/App_User.css";

export default function App_User() {

  const [users, setUsers] = useState<User[]>([]);
  const [mainGroup, setMainGroup] = useState<Option[]>([]);
  const [state, setState] = useState<Option[]>([]);
  const [role, setRole] = useState<Option[]>([]);
  const [company, setCompany] = useState<Option[]>([]);
  const [formData, setFormData] = useState<CreateUserData>({
    name: "",
    username: "",
    password: "",
    email: "",
    phone: "",
    mainGroup: 0,
    state: 0,
    role: 0,
    company: 0,
  });
  
  const [showForm, setShowForm] = useState(false);
  const [showUsers, setShowUsers] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    fetchUsers();
    fetchMainGroup();
    fetchState();
    fetchRole();
    fetchCompany();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await userService.getUsers();
      console.log("Users Data:", data);

      setUsers(data.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchMainGroup = async () => {
    try {
      let data2 = await userService.getMainGroup();
      console.log("Users Data:", JSON.stringify(data2));
      setMainGroup(data2);
    } catch (error) {
      console.log("Error fetching main group:", error);
    }
  };

  const fetchState = async () => {
    try {
      let data3 = await userService.getState();
      console.log("Users Data:", JSON.stringify(data3));
      setState(data3);
    } catch (error) {
      console.log("Error fetching State:", error);
    }
  };

  const fetchRole = async () => {
    try {
      let data4 = await userService.getRole();
      console.log("Users Data:", JSON.stringify(data4));
      setRole(data4);
    } catch (error) {
      console.log("Error fetching User Role:", error);
    }
  };

  const fetchCompany = async () => {
    try {
      let data5 = await userService.getCompany();
      console.log("Users Data:", JSON.stringify(data5));
      setCompany(data5);
    } catch (error) {
      console.log("Error fetching Company:", error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: ["mainGroup", "state", "role", "company"].includes(name)
        ? Number(value)
        : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {

      const result = await userService.createUser(formData);

      if (result.success) {
        alert("User Added Successfully ✅");

        setFormData({
          name: "",
          username: "",
          password: "",
          email: "",
          phone: "",
          mainGroup: 0,
          state: 0,
          role: 0,
          company: 0,
        });

        fetchUsers();
        setShowForm(false);
        setShowUsers(true);
      } else {
        alert("Error: " + result.message);
      }
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };

  return (
    <div className="au-page">
      {/* ── PAGE HEADER ── */}
      <div className="au-header">
        <div>
          <h1 className="au-title">
            {showForm ? "" : ""}
          </h1>
        </div>
        <button
          className="au-toggle-btn"
          onClick={() => {
            setShowForm(!showForm);
            setShowUsers(showForm);
          }}>
          <span>{showForm ? "← Back to Users" : "+ Add User"}</span>
        </button>
      </div>

      {/* ── USERS TABLE ── */}
      {showUsers && (() => {
        const totalPages = Math.ceil(users.length / PAGE_SIZE);
        const paged = users.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
        return (
          <>
            <div className="au-table-card">
              <div className="au-table-header">
                <div>
                  <p className="au-table-title">All Users</p>
                  <p className="au-table-sub">{users.length} total record{users.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <table className="au-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.length > 0 ? (
                    paged.map((user) => (
                      <tr key={user.id}>
                        <td className="au-muted">{user.id}</td>
                        <td className="au-name">{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.role_name}</td>
                        <td>
                          <span className={user.is_active ? "au-active" : "au-inactive"}>
                            {user.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="au-empty">No users found</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="au-pagination">
                <span className="au-page-info">
                  {users.length === 0 ? "0 records" : `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, users.length)} of ${users.length}`}
                </span>
                <div className="au-page-btns">
                  <button
                    className="au-page-btn"
                    onClick={() => setCurrentPage(p => p - 1)}
                    disabled={currentPage === 1}
                  >‹</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      className={`au-page-btn${page === currentPage ? " au-page-active" : ""}`}
                      onClick={() => setCurrentPage(page)}
                    >{page}</button>
                  ))}
                  <button
                    className="au-page-btn"
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage === totalPages}
                  >›</button>
                </div>
              </div>
            </div>
          </>
        );
      })()}
      
      {/* ── ADD USER FORM ── */}
      {showForm && (
        <div className="au-form-card">
          <div className="au-form-header">
            <div className="au-form-header-icon">👤</div>
            <div>
              <p className="au-form-header-title">Create New User</p>
              <p className="au-form-header-sub">Fill in the details below to add a new user account.</p>
            </div>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="au-form-body">
              <p className="au-section-label">Personal Information</p>
              <div className="au-form-grid">
              <div className="au-field">
                <label className="au-label">Full Name</label>
                <div className="au-input-wrap">
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="au-field">
                <label className="au-label">Email Address</label>
                <div className="au-input-wrap">
                  <input
                    type="email"
                    name="email"
                    placeholder="abc@gmail.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="au-field">
                <label className="au-label">Contact No.</label>
                <div className="au-input-wrap">
                  <input
                    type="tel"
                    name="phone"
                    maxLength={10}
                    placeholder="10-digit number"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              </div>

              <p className="au-section-label" style={{marginTop:"24px"}}>Account Credentials</p>
              <div className="au-form-grid">
              <div className="au-field">
                <label className="au-label">Username</label>
                <div className="au-input-wrap">
                  <input
                    type="text"
                    name="username"
                    placeholder="Enter username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="au-field">
                <label className="au-label">Password</label>
                <div className="au-input-wrap">
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              </div>

              <p className="au-section-label" style={{marginTop:"24px"}}>Organization</p>
              <div className="au-form-grid">
              <div className="au-field">
                <label className="au-label">Main Group</label>
                <div className="au-input-wrap">
                  <select
                    name="mainGroup"
                    value={formData.mainGroup}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Main Group</option>
                    {mainGroup.map((g) => (
                      <option key={g.id} value={Number(g.id)}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="au-field">
                <label className="au-label">State</label>
                <div className="au-input-wrap">
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select State</option>
                    {state.map((s) => (
                      <option key={s.id} value={Number(s.id)}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="au-field">
                <label className="au-label">User Role</label>
                <div className="au-input-wrap">
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Role</option>
                    {role.map((r) => (
                      <option key={r.id} value={Number(r.id)}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="au-field au-full">
                <label className="au-label">Company</label>
                <div className="au-input-wrap">
                  <select
                    name="company"
                    value={formData.company ?? 0}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Company</option>
                    {company.map((c) => (
                      <option key={c.id} value={Number(c.id)}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            </div>{/* end au-form-body */}

            <div className="au-form-footer">
              <span className="au-form-footer-note">All fields marked are required.</span>
              <button type="submit" className="au-submit">
                <span>Create User</span>
                <svg
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  style={{ width: "13px", height: "13px" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
      
    </div>
  );
  
}
