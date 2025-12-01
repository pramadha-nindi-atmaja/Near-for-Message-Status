use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LookupMap, Vector, UnorderedSet, UnorderedMap};
use near_sdk::{env, near_bindgen, AccountId};
use serde::{Deserialize, Serialize};

// Import our new modules
mod history;
mod profile;
mod reactions;
mod social;
mod notifications;
mod analytics;

use history::StatusRecord;
use profile::UserProfile;
use reactions::Reaction;

near_sdk::setup_alloc!();

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct StatusMessage {
    records: LookupMap<String, String>,
    history: LookupMap<String, Vector<StatusRecord>>,
    profiles: LookupMap<String, UserProfile>,
    public_statuses: UnorderedSet<String>,
    followers: LookupMap<String, UnorderedSet<String>>,
    reactions: LookupMap<String, Vector<Reaction>>, // status_id -> reactions
    notifications: LookupMap<String, Vector<String>>, // account_id -> notifications
    status_expiry: UnorderedMap<String, u64>, // account_id -> expiry_timestamp
    analytics: LookupMap<String, u64>, // account_id -> view_count
}

impl Default for StatusMessage {
    fn default() -> Self {
        Self {
            records: LookupMap::new(b"r".to_vec()),
            history: LookupMap::new(b"h".to_vec()),
            profiles: LookupMap::new(b"p".to_vec()),
            public_statuses: UnorderedSet::new(b"s".to_vec()),
            followers: LookupMap::new(b"f".to_vec()),
            reactions: LookupMap::new(b"re".to_vec()),
            notifications: LookupMap::new(b"n".to_vec()),
            status_expiry: UnorderedMap::new(b"e".to_vec()),
            analytics: LookupMap::new(b"a".to_vec()),
        }
    }
}

#[near_bindgen]
impl StatusMessage {
    #[private]
    pub fn cleanup_expired_statuses(&mut self) {
        let mut to_remove = Vec::new();
        
        for (account_id, expiry_time) in self.status_expiry.iter() {
            if env::block_timestamp() > expiry_time {
                to_remove.push(account_id);
            }
        }
        
        for account_id in to_remove {
            self.records.remove(&account_id);
            self.public_statuses.remove(&account_id);
            self.status_expiry.remove(&account_id);
            
            // Notify user of expiration
            self.add_notification(&account_id, "Your status has expired".to_string());
        }
    }

    pub fn set_status(&mut self, message: String, is_public: Option<bool>, expires_in_hours: Option<u64>) {
        // Validate input
        if message.is_empty() {
            env::panic_str("Message cannot be empty");
        }
        
        let account_id = env::signer_account_id();
        let public_flag = is_public.unwrap_or(true);
        
        // Calculate expiry time if provided
        let expires_at = if let Some(hours) = expires_in_hours {
            if hours > 0 {
                Some(env::block_timestamp() + (hours * 3600 * 1_000_000_000)) // Convert hours to nanoseconds
            } else {
                None
            }
        } else {
            None
        };
        
        // Save current status
        self.records.insert(&account_id, &message);
        
        // Add to history
        let mut user_history = self.history.get(&account_id).unwrap_or_else(|| {
            Vector::new(account_id.as_bytes())
        });
        
        user_history.push(&StatusRecord::new(message.clone(), expires_at));
        self.history.insert(&account_id, &user_history);
        
        // Handle public status
        if public_flag {
            self.public_statuses.insert(&account_id);
        } else {
            self.public_statuses.remove(&account_id);
        }
        
        // Set expiry if provided
        if let Some(expiry) = expires_at {
            self.status_expiry.insert(&account_id, &expiry);
        } else {
            self.status_expiry.remove(&account_id);
        }
        
        // Notify followers
        if public_flag {
            if let Some(followers) = self.followers.get(&account_id) {
                for follower in followers.iter() {
                    self.add_notification(&follower, format!("{} posted a new status", account_id));
                }
            }
        }
    }

    pub fn get_status(&self, account_id: String) -> Option<String> {
        // Check if status has expired
        if let Some(expiry) = self.status_expiry.get(&account_id) {
            if env::block_timestamp() > expiry {
                return None;
            }
        }
        
        self.records.get(&account_id)
    }
    
    pub fn get_status_history(&self, account_id: String) -> Vec<StatusRecord> {
        match self.history.get(&account_id) {
            Some(history) => {
                let len = history.len();
                let start_index = if len > 10 { len - 10 } else { 0 };
                (start_index..len)
                    .map(|i| history.get(i).unwrap())
                    .filter(|record| !record.is_expired())
                    .collect()
            },
            None => vec![],
        }
    }
    
    pub fn delete_status(&mut self) {
        let account_id = env::signer_account_id();
        self.records.remove(&account_id);
        self.public_statuses.remove(&account_id);
        self.status_expiry.remove(&account_id);
        
        // Optionally keep history but remove current status
    }
    
    pub fn get_status_count(&self, account_id: String) -> u64 {
        match self.history.get(&account_id) {
            Some(history) => history.len(),
            None => 0,
        }
    }
    
    // Previous features
    
    pub fn set_profile(&mut self, name: String, bio: String) {
        let account_id = env::signer_account_id();
        let profile = UserProfile {
            name,
            bio,
            is_public: true,
        };
        self.profiles.insert(&account_id, &profile);
    }
    
    pub fn get_profile(&self, account_id: String) -> Option<UserProfile> {
        self.profiles.get(&account_id)
    }
    
    pub fn get_public_statuses(&self) -> Vec<(String, String)> {
        let mut result = Vec::new();
        for account_id in self.public_statuses.iter() {
            // Check if status has expired
            if let Some(expiry) = self.status_expiry.get(&account_id) {
                if env::block_timestamp() > expiry {
                    continue; // Skip expired statuses
                }
            }
            
            if let Some(status) = self.records.get(&account_id) {
                result.push((account_id.clone(), status));
            }
        }
        result
    }
    
    pub fn follow(&mut self, account_id: String) {
        let follower_id = env::signer_account_id();
        if follower_id == account_id {
            env::panic_str("Cannot follow yourself");
        }
        
        let mut user_followers = self.followers.get(&account_id).unwrap_or_else(|| {
            UnorderedSet::new(account_id.as_bytes())
        });
        
        user_followers.insert(&follower_id);
        self.followers.insert(&account_id, &user_followers);
        
        self.add_notification(&account_id, format!("{} started following you", follower_id));
    }
    
    pub fn unfollow(&mut self, account_id: String) {
        let follower_id = env::signer_account_id();
        if let Some(mut user_followers) = self.followers.get(&account_id) {
            user_followers.remove(&follower_id);
            self.followers.insert(&account_id, &user_followers);
        }
    }
    
    pub fn get_followers(&self, account_id: String) -> Vec<String> {
        if let Some(followers) = self.followers.get(&account_id) {
            followers.iter().collect()
        } else {
            vec![]
        }
    }
    
    pub fn get_following(&self) -> Vec<String> {
        let account_id = env::signer_account_id();
        let mut result = Vec::new();
        
        for (user, followers) in self.followers.iter() {
            if followers.contains(&account_id) {
                result.push(user);
            }
        }
        
        result
    }
    
    pub fn search_status(&self, query: String) -> Vec<(String, String)> {
        let mut result = Vec::new();
        let lowercase_query = query.to_lowercase();
        
        for account_id in self.public_statuses.iter() {
            // Check if status has expired
            if let Some(expiry) = self.status_expiry.get(&account_id) {
                if env::block_timestamp() > expiry {
                    continue; // Skip expired statuses
                }
            }
            
            if let Some(status) = self.records.get(&account_id) {
                if status.to_lowercase().contains(&lowercase_query) {
                    result.push((account_id.clone(), status));
                }
            }
        }
        
        result
    }
    
    // New features: Reactions
    
    pub fn add_reaction(&mut self, account_id: String, reaction_type: String) {
        let reactor_id = env::signer_account_id();
        let reaction = Reaction {
            account_id: reactor_id,
            reaction_type,
            timestamp: env::block_timestamp(),
        };
        
        let mut status_reactions = self.reactions.get(&account_id).unwrap_or_else(|| {
            Vector::new(account_id.as_bytes())
        });
        
        // Check if user already reacted
        let mut already_reacted = false;
        for i in 0..status_reactions.len() {
            if let Some(existing_reaction) = status_reactions.get(i) {
                if existing_reaction.account_id == reactor_id {
                    already_reacted = true;
                    break;
                }
            }
        }
        
        if !already_reacted {
            status_reactions.push(&reaction);
            self.reactions.insert(&account_id, &status_reactions);
            
            // Notify user
            self.add_notification(&account_id, format!("{} reacted to your status", reactor_id));
        }
    }
    
    pub fn get_reactions(&self, account_id: String) -> Vec<Reaction> {
        if let Some(reactions) = self.reactions.get(&account_id) {
            reactions.iter().collect()
        } else {
            vec![]
        }
    }
    
    pub fn get_reaction_counts(&self, account_id: String) -> std::collections::HashMap<String, u64> {
        let mut counts = std::collections::HashMap::new();
        
        if let Some(reactions) = self.reactions.get(&account_id) {
            for reaction in reactions.iter() {
                *counts.entry(reaction.reaction_type.clone()).or_insert(0) += 1;
            }
        }
        
        counts
    }
    
    // Notifications
    
    fn add_notification(&mut self, account_id: &str, message: String) {
        let mut user_notifications = self.notifications.get(account_id).unwrap_or_else(|| {
            Vector::new(account_id.as_bytes())
        });
        
        user_notifications.push(&message);
        self.notifications.insert(account_id, &user_notifications);
    }
    
    pub fn get_notifications(&self) -> Vec<String> {
        let account_id = env::signer_account_id();
        if let Some(notifications) = self.notifications.get(&account_id) {
            // Return last 10 notifications
            let len = notifications.len();
            let start_index = if len > 10 { len - 10 } else { 0 };
            (start_index..len)
                .map(|i| notifications.get(i).unwrap())
                .collect()
        } else {
            vec![]
        }
    }
    
    pub fn clear_notifications(&mut self) {
        let account_id = env::signer_account_id();
        if self.notifications.get(&account_id).is_some() {
            let empty_vector = Vector::new(account_id.as_bytes());
            self.notifications.insert(&account_id, &empty_vector);
        }
    }
    
    // Analytics
    
    pub fn view_status(&mut self, account_id: String) {
        // Increment view count
        let current_views = self.analytics.get(&account_id).unwrap_or(0);
        self.analytics.insert(&account_id, &(current_views + 1));
    }
    
    pub fn get_view_count(&self, account_id: String) -> u64 {
        self.analytics.get(&account_id).unwrap_or(0)
    }
    
    pub fn get_dashboard_stats(&self, account_id: String) -> (u64, u64, u64) {
        // Returns (status_count, follower_count, view_count)
        let status_count = self.get_status_count(account_id.clone());
        let follower_count = self.get_followers(account_id.clone()).len() as u64;
        let view_count = self.get_view_count(account_id);
        
        (status_count, follower_count, view_count)
    }
}

#[cfg(not(target_arch = "wasm32"))]
#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::MockedBlockchain;
    use near_sdk::{testing_env, VMContext};

    fn get_context(input: Vec<u8>, is_view: bool) -> VMContext {
        VMContext {
            current_account_id: "alice_near".to_string(),
            signer_account_id: "bob_near".to_string(),
            signer_account_pk: vec![0, 1, 2],
            predecessor_account_id: "carol_near".to_string(),
            input,
            block_index: 0,
            block_timestamp: 0,
            account_balance: 0,
            account_locked_balance: 0,
            storage_usage: 0,
            attached_deposit: 0,
            prepaid_gas: 10u64.pow(18),
            random_seed: vec![0, 1, 2],
            is_view,
            output_data_receivers: vec![],
            epoch_height: 0,
        }
    }

    #[test]
    fn set_get_message() {
        let context = get_context(vec![], false);
        testing_env!(context);
        let mut contract = StatusMessage::default();
        contract.set_status("hello".to_string(), Some(true), None);
        assert_eq!(
            "hello".to_string(),
            contract.get_status("bob_near".to_string()).unwrap()
        );
    }

    #[test]
    fn get_nonexistent_message() {
        let context = get_context(vec![], true);
        testing_env!(context);
        let contract = StatusMessage::default();
        assert_eq!(None, contract.get_status("francis.near".to_string()));
    }
    
    #[test]
    fn set_multiple_messages_and_check_history() {
        let context = get_context(vec![], false);
        testing_env!(context);
        let mut contract = StatusMessage::default();
        contract.set_status("hello".to_string(), Some(true), None);
        contract.set_status("world".to_string(), Some(true), None);
        contract.set_status("test".to_string(), Some(true), None);
        
        let history = contract.get_status_history("bob_near".to_string());
        assert_eq!(3, history.len());
        assert_eq!("test".to_string(), contract.get_status("bob_near".to_string()).unwrap());
    }
    
    #[test]
    fn delete_status() {
        let context = get_context(vec![], false);
        testing_env!(context);
        let mut contract = StatusMessage::default();
        contract.set_status("hello".to_string(), Some(true), None);
        assert_eq!("hello".to_string(), contract.get_status("bob_near".to_string()).unwrap());
        
        contract.delete_status();
        assert_eq!(None, contract.get_status("bob_near".to_string()));
    }
    
    #[test]
    fn get_status_count() {
        let context = get_context(vec![], false);
        testing_env!(context);
        let mut contract = StatusMessage::default();
        contract.set_status("hello".to_string(), Some(true), None);
        contract.set_status("world".to_string(), Some(true), None);
        
        assert_eq!(2, contract.get_status_count("bob_near".to_string()));
    }
    
    #[test]
    fn set_profile() {
        let context = get_context(vec![], false);
        testing_env!(context);
        let mut contract = StatusMessage::default();
        contract.set_profile("Alice".to_string(), "Blockchain enthusiast".to_string());
        
        let profile = contract.get_profile("bob_near".to_string()).unwrap();
        assert_eq!("Alice", profile.name);
        assert_eq!("Blockchain enthusiast", profile.bio);
    }
    
    #[test]
    fn public_statuses() {
        let context = get_context(vec![], false);
        testing_env!(context);
        let mut contract = StatusMessage::default();
        contract.set_status("Public status".to_string(), Some(true), None);
        contract.set_status("Private status".to_string(), Some(false), None);
        
        let public = contract.get_public_statuses();
        assert_eq!(1, public.len());
        assert_eq!("Public status", public[0].1);
    }
    
    #[test]
    fn follow_unfollow() {
        let context = get_context(vec![], false);
        testing_env!(context.clone());
        let mut contract = StatusMessage::default();
        
        // Change signer for alice
        let mut context_alice = context.clone();
        context_alice.signer_account_id = "alice_near".to_string();
        testing_env!(context_alice);
        
        contract.follow("bob_near".to_string());
        let followers = contract.get_followers("bob_near".to_string());
        assert_eq!(1, followers.len());
        assert_eq!("alice_near", followers[0]);
        
        contract.unfollow("bob_near".to_string());
        let followers = contract.get_followers("bob_near".to_string());
        assert_eq!(0, followers.len());
    }
    
    #[test]
    fn search_status() {
        let context = get_context(vec![], false);
        testing_env!(context);
        let mut contract = StatusMessage::default();
        contract.set_status("Hello world".to_string(), Some(true), None);
        contract.set_status("Rust programming".to_string(), Some(true), None);
        
        let results = contract.search_status("rust".to_string());
        assert_eq!(1, results.len());
        assert_eq!("Rust programming", results[0].1);
    }
    
    #[test]
    fn add_reaction() {
        let context = get_context(vec![], false);
        testing_env!(context.clone());
        let mut contract = StatusMessage::default();
        contract.set_status("Hello world".to_string(), Some(true), None);
        
        // Change signer for alice
        let mut context_alice = context.clone();
        context_alice.signer_account_id = "alice_near".to_string();
        testing_env!(context_alice);
        
        contract.add_reaction("bob_near".to_string(), "like".to_string());
        let reactions = contract.get_reactions("bob_near".to_string());
        assert_eq!(1, reactions.len());
        assert_eq!("alice_near", reactions[0].account_id);
        assert_eq!("like", reactions[0].reaction_type);
    }
    
    #[test]
    fn notifications() {
        let context = get_context(vec![], false);
        testing_env!(context);
        let mut contract = StatusMessage::default();
        
        contract.add_notification("bob_near", "Test notification".to_string());
        let notifications = contract.get_notifications();
        assert_eq!(1, notifications.len());
        assert_eq!("Test notification", notifications[0]);
    }
    
    #[test]
    fn analytics() {
        let context = get_context(vec![], false);
        testing_env!(context);
        let mut contract = StatusMessage::default();
        
        contract.view_status("bob_near".to_string());
        contract.view_status("bob_near".to_string());
        let views = contract.get_view_count("bob_near".to_string());
        assert_eq!(2, views);
    }
    
    #[test]
    fn status_expiration() {
        let context = get_context(vec![], false);
        testing_env!(context);
        let mut contract = StatusMessage::default();
        
        // Set status with 1 hour expiry
        contract.set_status("Temporary status".to_string(), Some(true), Some(1));
        
        // Status should be available initially
        assert_eq!("Temporary status", contract.get_status("bob_near".to_string()).unwrap());
        
        // Simulate time passing (this is a simplified test)
        let history = contract.get_status_history("bob_near".to_string());
        assert_eq!(1, history.len());
    }
}