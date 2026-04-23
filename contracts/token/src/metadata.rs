use soroban_sdk::{Env, String};

use crate::storage_types::DataKey;

pub fn read_decimal(e: &Env) -> u32 {
    e.storage().instance().get(&DataKey::Decimal).unwrap()
}

pub fn read_name(e: &Env) -> String {
    e.storage().instance().get(&DataKey::Name).unwrap()
}

pub fn read_symbol(e: &Env) -> String {
    e.storage().instance().get(&DataKey::Symbol).unwrap()
}

pub fn write_metadata(e: &Env, decimal: u32, name: String, symbol: String) {
    e.storage().instance().set(&DataKey::Decimal, &decimal);
    e.storage().instance().set(&DataKey::Name, &name);
    e.storage().instance().set(&DataKey::Symbol, &symbol);
}