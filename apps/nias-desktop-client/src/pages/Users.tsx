import { useEffect, useState } from 'react';
import type { system } from '@nias/shared';

export default function UsersPage() {
  const [activeUsers, setActiveUsers] = useState<system.User[]>([]);
  const [deletedUsers, setDeletedUsers] = useState<system.User[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchActiveUsers = async () => {
      try {
        setIsBusy(true);
        const activeResponse = await window.electronAPI.userListActive();
        if (activeResponse.success) {
          setActiveUsers(activeResponse.data || []);
        } else {
          console.error('Failed to fetch active users:', activeResponse.message);
        }
      } catch (error) {
        console.error('Error fetching active users:', error);
      } finally {
        setIsBusy(false);
      }
    };

    const fetchDeletedUsers = async () => {
      try {
        setIsBusy(true);
        const deletedResponse = await window.electronAPI.userListDeleted();
        if (deletedResponse.success) {
          setDeletedUsers(deletedResponse.data || []);
        } else {
          console.error('Failed to fetch deleted users:', deletedResponse.message);
        }
      } catch (error) {
        console.error('Error fetching deleted users:', error);
      } finally {
        setIsBusy(false);
      }
    };

    fetchActiveUsers();
    fetchDeletedUsers();
  }, []);

  if (isBusy) {
    return (
      <section id="usersScreen" className="card panel app-screen">
        <h2>Users</h2>
        <p className="muted">Loading users...</p>
      </section>
    );
  }


  return (
    <section id="usersScreen" className="card panel app-screen">
      <h2>Users</h2>
      <p className="muted">
        Manage users you are allowed to control, and review archived or inactive records when
        permitted.
      </p>
      <button className="primary" onClick={() => setShowModal(true)}>
        Create New User
      </button>
      <div className="spacer" />
      <div className="divider" />
      <div className="spacer" />
      <div className="user-lists">
        <div className="user-list">
          {activeUsers.length > 0 && <h3>Active Users</h3>}
          {activeUsers.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Display Name</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.displayName}</td>
                    <td>{user.email}</td>
                    <td>
                      <button onClick={() => console.log(`Edit user ${user.id}`)}>Edit</button>
                      <button onClick={() => console.log(`Delete user ${user.id}`)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">No active users found.</p>
          )}
        </div>
        <div className="user-list">
          {deletedUsers.length > 0 && <h3>Deleted Users</h3>}
          {deletedUsers.length > 0 ? (
            <ul>
              {deletedUsers.map((user) => (
                <li key={user.id}>
                  <strong>{user.displayName}</strong> ({user.email})
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
      {showModal && (
        <CreateUserModal
          handleClose={() => setShowModal(false)}
        />
      )}
    </section>
  );
}