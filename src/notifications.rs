//! Notifications module
use near_sdk::borsh::{BorshDeserialize, BorshSerialize};
use near_sdk::collections::Vector;

pub struct NotificationManager {
    pub notifications: Vector<String>,
}

impl NotificationManager {
    pub fn new(account_id: &str) -> Self {
        Self {
            notifications: Vector::new(account_id.as_bytes()),
        }
    }
    
    pub fn add_notification(&mut self, message: String) {
        self.notifications.push(&message);
    }
    
    pub fn get_notifications(&self, count: usize) -> Vec<String> {
        let len = self.notifications.len();
        let start_index = if len > count as u64 { len - count as u64 } else { 0 };
        (start_index..len)
            .map(|i| self.notifications.get(i).unwrap())
            .collect()
    }
    
    pub fn clear_notifications(&mut self) {
        // In a real implementation, we would clear the vector
        // For now, we'll just document this placeholder
    }
}