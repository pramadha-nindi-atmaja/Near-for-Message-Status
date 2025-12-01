//! Status reactions module
use near_sdk::borsh::{BorshDeserialize, BorshSerialize};
use serde::{Deserialize, Serialize};

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct Reaction {
    pub account_id: String,
    pub reaction_type: String, // "like", "love", "laugh", etc.
    pub timestamp: u64,
}