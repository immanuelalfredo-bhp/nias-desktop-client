interface UserRow {
  id: string;
  username: string;
  displayName: string;
  role: string;
  canModify: boolean;
  canAssignProjects: boolean;
  canSetInactive: boolean;
}

const activeUsers: UserRow[] = [
  {
    id: '1',
    username: 'admin',
    displayName: 'System Admin',
    role: 'Admin',
    canModify: true,
    canAssignProjects: true,
    canSetInactive: false,
  },
  {
    id: '2',
    username: 'procurement',
    displayName: 'Procurement Team',
    role: 'Procurement',
    canModify: true,
    canAssignProjects: true,
    canSetInactive: true,
  },
];

const inactiveUsers: UserRow[] = [
  {
    id: '3',
    username: 'legacy-user',
    displayName: 'Legacy Account',
    role: 'Viewer',
    canModify: false,
    canAssignProjects: false,
    canSetInactive: false,
  },
];

export default function UsersPage() {
  return (
    <section id="usersScreen" className="card panel app-screen">
      <h2>Users</h2>
      <p className="muted">
        Manage users you are allowed to control, and review archived or inactive records when
        permitted.
      </p>

      <section id="userManagementSection">
        <div className="actions" style={{ marginTop: 0, marginBottom: '10px' }}>
          <button id="createUserBtn" className="primary" type="button">
            Create User
          </button>
        </div>

        <div className="grid user-filter-grid">
          <div className="wide-col">
            <label htmlFor="userSearch">Search Users</label>
            <input
              id="userSearch"
              placeholder="Search username or display name"
              autoComplete="off"
            />
          </div>
          <div className="narrow-col">
            <label htmlFor="userRoleFilter">Filter By Role</label>
            <select id="userRoleFilter" defaultValue="">
              <option value="">All roles</option>
              <option value="admin">Admin</option>
              <option value="procurement">Procurement</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Display Name</th>
              <th>Role</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="usersTableBody">
            {activeUsers.map((user) => {
              const actions: string[] = [];
              if (user.canModify) {
                actions.push('Modify');
              }
              if (user.canAssignProjects) {
                actions.push('Assign Projects');
              }
              if (user.canSetInactive) {
                actions.push('Set Inactive');
              }

              return (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.displayName}</td>
                  <td>{user.role}</td>
                  <td>
                    <div className="inline-actions">
                      {actions.length > 0 ? (
                        actions.map((action) => (
                          <button key={`${user.id}-${action}`} className="secondary" type="button">
                            {action}
                          </button>
                        ))
                      ) : (
                        <span className="muted">Read-only</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section id="inactiveUsersPanel" className="panel" style={{ marginTop: '18px' }}>
        <h2>Inactive Users</h2>
        <p className="muted">Visible according to your inactive-user privileges.</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Display Name</th>
                <th>Role</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="inactiveUsersTableBody">
              {inactiveUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.displayName}</td>
                  <td>{user.role}</td>
                  <td>
                    <div className="inline-actions">
                      <button className="secondary" type="button">
                        Restore
                      </button>
                      <button className="danger" type="button">
                        Permanently Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
