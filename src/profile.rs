//! User profile module
use near_sdk::borsh::{BorshDeserialize, BorshSerialize};
use serde::{Deserialize, Serialize};

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct UserProfile {
    pub name: String,
    pub bio: String,
    pub is_public: bool,
}

impl Default for UserProfile {
    fn default() -> Self {
        Self {
            name: String::new(),
            bio: String::new(),
            is_public: true,
        }
    }
}