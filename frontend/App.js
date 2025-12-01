import "regenerator-runtime/runtime";
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Big from "big.js";
import Form from "./components/Form";
import ProfileForm from "./components/ProfileForm";
import StatusFeed from "./components/StatusFeed";
import NotificationsPanel from "./components/NotificationsPanel";
import Dashboard from "./components/Dashboard";

const BOATLOAD_OF_GAS = Big(3)
  .times(10 ** 13)
  .toFixed();

const App = ({ contract, currentUser, nearConfig, wallet }) => {
  const [status, setStatus] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [publicStatuses, setPublicStatuses] = useState([]);
  const [profile, setProfile] = useState({ name: '', bio: '' });
  const [isPublic, setIsPublic] = useState(true);
  const [expiresInHours, setExpiresInHours] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({ statusCount: 0, followerCount: 0, viewCount: 0 });
  const [activeTab, setActiveTab] = useState('profile'); // profile, public, search, followers, notifications, dashboard
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStatus = async () => {
    if (!currentUser) return;
    try {
      const status = await contract.get_status({
        account_id: currentUser.accountId,
      });
      setStatus(status);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch status:', err);
      setError('Failed to load status. Please try again.');
    }
  };

  const fetchStatusHistory = async () => {
    if (!currentUser) return;
    try {
      const history = await contract.get_status_history({
        account_id: currentUser.accountId,
      });
      setStatusHistory(history || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch status history:', err);
      setError('Failed to load status history. Please try again.');
    }
  };

  const fetchPublicStatuses = async () => {
    try {
      const statuses = await contract.get_public_statuses();
      setPublicStatuses(statuses || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch public statuses:', err);
      setError('Failed to load public statuses. Please try again.');
    }
  };

  const fetchProfile = async () => {
    if (!currentUser) return;
    try {
      const userProfile = await contract.get_profile({
        account_id: currentUser.accountId,
      });
      if (userProfile) {
        setProfile({
          name: userProfile.name || '',
          bio: userProfile.bio || ''
        });
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError('Failed to load profile. Please try again.');
    }
  };

  const fetchFollowers = async () => {
    if (!currentUser) return;
    try {
      const userFollowers = await contract.get_followers({
        account_id: currentUser.accountId,
      });
      setFollowers(userFollowers || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch followers:', err);
      setError('Failed to load followers. Please try again.');
    }
  };

  const fetchFollowing = async () => {
    if (!currentUser) return;
    try {
      const userFollowing = await contract.get_following();
      setFollowing(userFollowing || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch following:', err);
      setError('Failed to load following. Please try again.');
    }
  };

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const userNotifications = await contract.get_notifications();
      setNotifications(userNotifications || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Failed to load notifications. Please try again.');
    }
  };

  const fetchDashboardStats = async () => {
    if (!currentUser) return;
    try {
      const stats = await contract.get_dashboard_stats({
        account_id: currentUser.accountId,
      });
      setDashboardStats({
        statusCount: stats[0],
        followerCount: stats[1],
        viewCount: stats[2]
      });
      setError(null);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      setError('Failed to load dashboard stats. Please try again.');
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchStatusHistory();
    fetchPublicStatuses();
    fetchProfile();
    fetchFollowers();
    fetchFollowing();
    fetchNotifications();
    fetchDashboardStats();
  }, [currentUser]);

  const onSubmit = async ({ message }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await contract.set_status(
        {
          message,
          is_public: isPublic,
          expires_in_hours: expiresInHours > 0 ? expiresInHours : null
        },
        BOATLOAD_OF_GAS
      );
      
      await fetchStatus();
      await fetchStatusHistory();
      await fetchPublicStatuses();
      await fetchDashboardStats();
    } catch (err) {
      console.error('Failed to update status:', err);
      setError('Failed to update status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onDeleteStatus = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await contract.delete_status({}, BOATLOAD_OF_GAS);
      
      await fetchStatus();
      await fetchStatusHistory();
      await fetchPublicStatuses();
      await fetchDashboardStats();
    } catch (err) {
      console.error('Failed to delete status:', err);
      setError('Failed to delete status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onSaveProfile = async (profileData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await contract.set_profile(
        {
          name: profileData.name,
          bio: profileData.bio
        },
        BOATLOAD_OF_GAS
      );
      
      setError(null);
    } catch (err) {
      console.error('Failed to save profile:', err);
      setError('Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onFollow = async (accountId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await contract.follow(
        {
          account_id: accountId
        },
        BOATLOAD_OF_GAS
      );
      
      await fetchFollowers();
      await fetchFollowing();
    } catch (err) {
      console.error('Failed to follow user:', err);
      setError('Failed to follow user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onUnfollow = async (accountId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await contract.unfollow(
        {
          account_id: accountId
        },
        BOATLOAD_OF_GAS
      );
      
      await fetchFollowers();
      await fetchFollowing();
    } catch (err) {
      console.error('Failed to unfollow user:', err);
      setError('Failed to unfollow user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await contract.search_status({
        query: searchQuery
      });
      setSearchResults(results || []);
      setError(null);
    } catch (err) {
      console.error('Failed to search statuses:', err);
      setError('Failed to search statuses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onAddReaction = async (accountId, reactionType) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await contract.add_reaction(
        {
          account_id: accountId,
          reaction_type: reactionType
        },
        BOATLOAD_OF_GAS
      );
      
      // Refresh public statuses to show updated reactions
      await fetchPublicStatuses();
    } catch (err) {
      console.error('Failed to add reaction:', err);
      setError('Failed to add reaction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onClearNotifications = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await contract.clear_notifications({}, BOATLOAD_OF_GAS);
      await fetchNotifications();
    } catch (err) {
      console.error('Failed to clear notifications:', err);
      setError('Failed to clear notifications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onViewStatus = async (accountId) => {
    try {
      await contract.view_status(
        {
          account_id: accountId
        },
        BOATLOAD_OF_GAS
      );
    } catch (err) {
      console.error('Failed to record view:', err);
    }
  };

  const handleExpirationChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setExpiresInHours(value >= 0 ? value : 0);
  };

  const signIn = () => {
    wallet.requestSignIn(nearConfig.contractName, "NEAR Status Message");
  };

  const signOut = () => {
    wallet.signOut();
    window.location.replace(window.location.origin + window.location.pathname);
  };

  return (
    <main>
      <header>
        <h1>NEAR Status Message</h1>

        {currentUser ? (
          <p>
            Currently signed in as: <code>{currentUser.accountId}</code>
          </p>
        ) : (
          <p>Update or add a status message! Please login to continue.</p>
        )}

        {currentUser ? (
          <button onClick={signOut}>Log out</button>
        ) : (
          <button onClick={signIn}>Log in</button>
        )}
      </header>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {currentUser && (
        <div className="tabs">
          <button 
            className={activeTab === 'profile' ? 'active' : ''}
            onClick={() => setActiveTab('profile')}
          >
            My Profile
          </button>
          <button 
            className={activeTab === 'public' ? 'active' : ''}
            onClick={() => setActiveTab('public')}
          >
            Public Feed
          </button>
          <button 
            className={activeTab === 'search' ? 'active' : ''}
            onClick={() => setActiveTab('search')}
          >
            Search
          </button>
          <button 
            className={activeTab === 'followers' ? 'active' : ''}
            onClick={() => setActiveTab('followers')}
          >
            Followers ({followers.length})
          </button>
          <button 
            className={activeTab === 'following' ? 'active' : ''}
            onClick={() => setActiveTab('following')}
          >
            Following ({following.length})
          </button>
          <button 
            className={activeTab === 'notifications' ? 'active' : ''}
            onClick={() => {
              setActiveTab('notifications');
              fetchNotifications(); // Refresh notifications when switching to tab
            }}
          >
            Notifications ({notifications.length})
          </button>
          <button 
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => {
              setActiveTab('dashboard');
              fetchDashboardStats(); // Refresh stats when switching to tab
            }}
          >
            Dashboard
          </button>
        </div>
      )}

      {activeTab === 'profile' && currentUser && (
        <>
          <ProfileForm 
            profile={profile}
            onSave={onSaveProfile}
            isLoading={isLoading}
          />

          <Form 
            onSubmit={onSubmit} 
            currentUser={currentUser} 
            maxLength={1000}
            disabled={isLoading}
            isPublic={isPublic}
            onPrivacyChange={setIsPublic}
            expiresInHours={expiresInHours}
            onExpirationChange={handleExpirationChange}
          />

          <div className="status-options">
            <div className="option-group">
              <label>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
                Make status public
              </label>
            </div>
            <div className="option-group">
              <label htmlFor="expiration">Auto-expire in hours (0 = never):</label>
              <input
                type="number"
                id="expiration"
                min="0"
                value={expiresInHours}
                onChange={handleExpirationChange}
              />
            </div>
          </div>

          {isLoading ? (
            <p>Updating status...</p>
          ) : status ? (
            <>
              <div className="current-status">
                <h3>Your current status:</h3>
                <p>
                  <code>{status}</code>
                </p>
                <p className="status-privacy">
                  Status is {isPublic ? 'public' : 'private'}
                  {expiresInHours > 0 && ` (expires in ${expiresInHours} hours)`}
                </p>
                <button onClick={onDeleteStatus} disabled={isLoading}>
                  Delete Status
                </button>
              </div>
            </>
          ) : (
            <p>No status message yet!</p>
          )}

          {statusHistory.length > 0 && (
            <div className="status-history">
              <h3>Status History (Last 10)</h3>
              <ul>
                {statusHistory.map((record, index) => (
                  <li key={index}>
                    <strong>{record.message}</strong>
                    <br />
                    <small>
                      Posted: {new Date(record.timestamp / 1000000).toLocaleString()}
                      {record.expires_at && (
                        <span>
                          <br />
                          Expires: {new Date(record.expires_at / 1000000).toLocaleString()}
                        </span>
                      )}
                    </small>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {activeTab === 'public' && (
        <StatusFeed 
          statuses={publicStatuses}
          onFollow={onFollow}
          onAddReaction={onAddReaction}
          onViewStatus={onViewStatus}
          currentUser={currentUser}
          isLoading={isLoading}
        />
      )}

      {activeTab === 'search' && (
        <div className="search-section">
          <h2>Search Public Statuses</h2>
          <form onSubmit={onSearch} className="search-form">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for keywords in statuses..."
            />
            <button type="submit" disabled={isLoading}>
              Search
            </button>
          </form>
          
          {searchResults.length > 0 && (
            <div className="search-results">
              <h3>Search Results</h3>
              <ul>
                {searchResults.map(([accountId, message], index) => (
                  <li key={index} className="feed-item">
                    <div className="feed-header">
                      <strong>{accountId}</strong>
                    </div>
                    <p>{message}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {activeTab === 'followers' && (
        <div className="followers-section">
          <h2>Your Followers</h2>
          {followers.length > 0 ? (
            <ul>
              {followers.map((followerId, index) => (
                <li key={index} className="follower-item">
                  <span>{followerId}</span>
                  <button 
                    onClick={() => onUnfollow(followerId)}
                    disabled={isLoading}
                  >
                    Unfollow
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>You have no followers yet.</p>
          )}
        </div>
      )}

      {activeTab === 'following' && (
        <div className="following-section">
          <h2>Following</h2>
          {following.length > 0 ? (
            <ul>
              {following.map((followingId, index) => (
                <li key={index} className="follower-item">
                  <span>{followingId}</span>
                  <button 
                    onClick={() => onUnfollow(followingId)}
                    disabled={isLoading}
                  >
                    Unfollow
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>You are not following anyone yet.</p>
          )}
        </div>
      )}

      {activeTab === 'notifications' && (
        <NotificationsPanel 
          notifications={notifications}
          onClear={onClearNotifications}
          isLoading={isLoading}
        />
      )}

      {activeTab === 'dashboard' && (
        <Dashboard stats={dashboardStats} />
      )}
    </main>
  );
};

App.propTypes = {
  contract: PropTypes.shape({
    set_status: PropTypes.func.isRequired,
    get_status: PropTypes.func.isRequired,
    get_status_history: PropTypes.func.isRequired,
    delete_status: PropTypes.func.isRequired,
    set_profile: PropTypes.func.isRequired,
    get_profile: PropTypes.func.isRequired,
    get_public_statuses: PropTypes.func.isRequired,
    follow: PropTypes.func.isRequired,
    unfollow: PropTypes.func.isRequired,
    get_followers: PropTypes.func.isRequired,
    get_following: PropTypes.func.isRequired,
    search_status: PropTypes.func.isRequired,
    add_reaction: PropTypes.func.isRequired,
    get_notifications: PropTypes.func.isRequired,
    clear_notifications: PropTypes.func.isRequired,
    view_status: PropTypes.func.isRequired,
    get_view_count: PropTypes.func.isRequired,
    get_dashboard_stats: PropTypes.func.isRequired,
  }).isRequired,
  currentUser: PropTypes.shape({
    accountId: PropTypes.string.isRequired,
    balance: PropTypes.string.isRequired,
  }),
  nearConfig: PropTypes.shape({
    contractName: PropTypes.string.isRequired,
  }).isRequired,
  wallet: PropTypes.shape({
    requestSignIn: PropTypes.func.isRequired,
    signOut: PropTypes.func.isRequired,
  }).isRequired,
};

export default App;