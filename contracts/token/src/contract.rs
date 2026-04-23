use crate::admin::{read_administrator, write_administrator};
use crate::allowance::{read_allowance, spend_allowance, write_allowance};
use crate::balance::{read_balance, receive_balance, spend_balance};
use crate::metadata::{read_decimal, read_name, read_symbol, write_metadata};
#[cfg(test)]
use crate::storage_types::{AllowanceDataKey, AllowanceValue, DataKey};
use crate::storage_types::{INSTANCE_BUMP_AMOUNT, INSTANCE_LIFETIME_THRESHOLD};
use soroban_sdk::{
    contract, contractimpl, token::TokenInterface, Address, Env, String,
};

fn check_nonnegative_amount(amount: i128) {
    if amount < 0 {
        panic!("negative amount is not allowed: {}", amount)
    }
}

#[contract]
pub struct Token;

#[contractimpl]
impl Token {
    pub fn __constructor(e: Env, admin: Address, decimal: u32, name: String, symbol: String) {
        if decimal > 18 {
            panic!("Decimal must not be greater than 18");
        }
        write_administrator(&e, &admin);
        write_metadata(&e, decimal, name, symbol);
    }

    pub fn mint(e: Env, to: Address, amount: i128) {
        check_nonnegative_amount(amount);
        let admin = read_administrator(&e);
        admin.require_auth();

        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        receive_balance(&e, to.clone(), amount);
        e.events().publish(
            (soroban_sdk::symbol_short!("mint"), to),
            amount,
        );
    }

    pub fn set_admin(e: Env, new_admin: Address) {
        let admin = read_administrator(&e);
        admin.require_auth();

        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        write_administrator(&e, &new_admin);
        e.events().publish(
            (soroban_sdk::symbol_short!("set_admin"), admin),
            new_admin,
        );
    }

    pub fn allowance(e: Env, from: Address, spender: Address) -> i128 {
        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
        read_allowance(&e, from, spender).amount
    }

    pub fn approve(e: Env, from: Address, spender: Address, amount: i128, expiration_ledger: u32) {
        from.require_auth();
        check_nonnegative_amount(amount);
        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
        write_allowance(&e, from.clone(), spender.clone(), amount, expiration_ledger);
        e.events().publish(
            (soroban_sdk::symbol_short!("approve"), from, spender),
            (amount, expiration_ledger),
        );
    }

    pub fn balance(e: Env, id: Address) -> i128 {
        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
        read_balance(&e, id)
    }

    pub fn transfer(e: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();
        check_nonnegative_amount(amount);
        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
        spend_balance(&e, from.clone(), amount);
        receive_balance(&e, to.clone(), amount);
        e.events().publish(
            (soroban_sdk::symbol_short!("transfer"), from, to),
            amount,
        );
    }

    pub fn transfer_from(e: Env, spender: Address, from: Address, to: Address, amount: i128) {
        spender.require_auth();
        check_nonnegative_amount(amount);
        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
        spend_allowance(&e, from.clone(), spender, amount);
        spend_balance(&e, from.clone(), amount);
        receive_balance(&e, to.clone(), amount);
        e.events().publish(
            (soroban_sdk::symbol_short!("transfer"), from, to),
            amount,
        );
    }

    pub fn burn(e: Env, from: Address, amount: i128) {
        from.require_auth();
        check_nonnegative_amount(amount);
        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
        spend_balance(&e, from.clone(), amount);
        e.events().publish(
            (soroban_sdk::symbol_short!("burn"), from),
            amount,
        );
    }

    pub fn burn_from(e: Env, spender: Address, from: Address, amount: i128) {
        spender.require_auth();
        check_nonnegative_amount(amount);
        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
        spend_allowance(&e, from.clone(), spender, amount);
        spend_balance(&e, from.clone(), amount);
        e.events().publish(
            (soroban_sdk::symbol_short!("burn"), from),
            amount,
        );
    }

    pub fn decimals(e: Env) -> u32 {
        read_decimal(&e)
    }

    pub fn name(e: Env) -> String {
        read_name(&e)
    }

    pub fn symbol(e: Env) -> String {
        read_symbol(&e)
    }
}

#[cfg(test)]
impl Token {
    pub fn get_allowance(e: Env, from: Address, spender: Address) -> Option<AllowanceValue> {
        let key = DataKey::Allowance(AllowanceDataKey { from, spender });
        e.storage().temporary().get::<_, AllowanceValue>(&key)
    }
}

impl TokenInterface for Token {
    fn allowance(e: Env, from: Address, spender: Address) -> i128 {
        Token::allowance(e, from, spender)
    }

    fn approve(e: Env, from: Address, spender: Address, amount: i128, expiration_ledger: u32) {
        Token::approve(e, from, spender, amount, expiration_ledger)
    }

    fn balance(e: Env, id: Address) -> i128 {
        Token::balance(e, id)
    }

    fn transfer(e: Env, from: Address, to: Address, amount: i128) {
        Token::transfer(e, from, to, amount)
    }

    fn transfer_from(e: Env, spender: Address, from: Address, to: Address, amount: i128) {
        Token::transfer_from(e, spender, from, to, amount)
    }

    fn burn(e: Env, from: Address, amount: i128) {
        Token::burn(e, from, amount)
    }

    fn burn_from(e: Env, spender: Address, from: Address, amount: i128) {
        Token::burn_from(e, spender, from, amount)
    }

    fn decimals(e: Env) -> u32 {
        Token::decimals(e)
    }

    fn name(e: Env) -> String {
        Token::name(e)
    }

    fn symbol(e: Env) -> String {
        Token::symbol(e)
    }
}
