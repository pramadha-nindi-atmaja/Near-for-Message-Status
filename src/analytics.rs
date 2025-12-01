//! Analytics module
use near_sdk::borsh::{BorshDeserialize, BorshSerialize};

pub struct AnalyticsManager {
    pub view_count: u64,
}

impl AnalyticsManager {
    pub fn new() -> Self {
        Self {
            view_count: 0,
        }
    }
    
    pub fn increment_view(&mut self) {
        self.view_count += 1;
    }
    
    pub fn get_view_count(&self) -> u64 {
        self.view_count
    }
}