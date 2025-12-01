//! Status history module
use near_sdk::borsh::{BorshDeserialize, BorshSerialize};
use near_sdk::{env, AccountId};
use serde::{Deserialize, Serialize};

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct StatusRecord {
    pub message: String,
    pub timestamp: u64,
    pub expires_at: Option<u64>,
}

impl StatusRecord {
    pub fn new(message: String, expires_at: Option<u64>) -> Self {
        Self {
            message,
            timestamp: env::block_timestamp(),
            expires_at,
        }
    }
    
    pub fn is_expired(&self) -> bool {
        if let Some(expiry) = self.expires_at {
            env::block_timestamp() > expiry
        } else {
            false
        }
    }
}