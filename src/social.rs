//! Social features module
use near_sdk::borsh::{BorshDeserialize, BorshSerialize};
use near_sdk::collections::UnorderedSet;
use near_sdk::{env, AccountId};

pub struct SocialConnections {
    pub followers: UnorderedSet<String>,
}

impl SocialConnections {
    pub fn new(account_id: &str) -> Self {
        Self {
            followers: UnorderedSet::new(account_id.as_bytes()),
        }
    }
    
    pub fn follow(&mut self, follower_id: &str) {
        self.followers.insert(follower_id);
    }
    
    pub fn unfollow(&mut self, follower_id: &str) {
        self.followers.remove(follower_id);
    }
    
    pub fn get_followers(&self) -> Vec<String> {
        self.followers.iter().collect()
    }
}