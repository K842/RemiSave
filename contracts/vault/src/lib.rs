#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, contracterror,
    token, Address, Env, Symbol,
};

#[contracttype]
pub enum DataKey {
    Admin,
    TokenId,
    TotalAssets,
    TotalShares,
    UserShares(Address),
    RateBps,
    LastHarvest,
    Initialized,
    Paused,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum VaultError {
    AlreadyInitialized = 1,
    NotInitialized     = 2,
    NotAdmin           = 3,
    ZeroAmount         = 4,
    InsufficientShares = 5,
    Paused             = 6,
    MathOverflow       = 7,
}

const SCALE: i128 = 1_000_000;
const SECONDS_PER_YEAR: u64 = 31_536_000;

// TTL constants for persistent storage (user shares)
const DAY_IN_LEDGERS: u32 = 17280;
const BALANCE_BUMP_AMOUNT: u32 = 30 * DAY_IN_LEDGERS;
const BALANCE_LIFETIME_THRESHOLD: u32 = BALANCE_BUMP_AMOUNT - DAY_IN_LEDGERS;

fn price_per_share(total_assets: i128, total_shares: i128) -> i128 {
    if total_shares == 0 {
        return SCALE;
    }
    total_assets
        .checked_mul(SCALE)
        .expect("overflow in price calc")
        .checked_div(total_shares)
        .expect("div by zero")
}

fn require_initialized(e: &Env) -> Result<(), VaultError> {
    if !e.storage().instance().has(&DataKey::Initialized) {
        return Err(VaultError::NotInitialized);
    }
    Ok(())
}

fn require_not_paused(e: &Env) -> Result<(), VaultError> {
    let paused: bool = e.storage().instance()
        .get(&DataKey::Paused)
        .unwrap_or(false);
    if paused {
        return Err(VaultError::Paused);
    }
    Ok(())
}

fn require_admin(e: &Env) -> Result<Address, VaultError> {
    let admin: Address = e.storage().instance()
        .get(&DataKey::Admin)
        .ok_or(VaultError::NotInitialized)?;
    admin.require_auth();
    Ok(admin)
}

// Read user shares and extend TTL
fn read_user_shares(e: &Env, user: &Address) -> i128 {
    let key = DataKey::UserShares(user.clone());
    if let Some(shares) = e.storage().persistent().get::<DataKey, i128>(&key) {
        e.storage().persistent().extend_ttl(
            &key,
            BALANCE_LIFETIME_THRESHOLD,
            BALANCE_BUMP_AMOUNT,
        );
        shares
    } else {
        0
    }
}

// Write user shares and extend TTL
fn write_user_shares(e: &Env, user: &Address, shares: i128) {
    let key = DataKey::UserShares(user.clone());
    e.storage().persistent().set(&key, &shares);
    e.storage().persistent().extend_ttl(
        &key,
        BALANCE_LIFETIME_THRESHOLD,
        BALANCE_BUMP_AMOUNT,
    );
}

#[contract]
pub struct RemiVault;

#[contractimpl]
impl RemiVault {

    pub fn initialize(
        e: Env,
        admin: Address,
        token_id: Address,
        rate_bps: u32,
    ) -> Result<(), VaultError> {
        if e.storage().instance().has(&DataKey::Initialized) {
            return Err(VaultError::AlreadyInitialized);
        }
        e.storage().instance().set(&DataKey::Admin, &admin);
        e.storage().instance().set(&DataKey::TokenId, &token_id);
        e.storage().instance().set(&DataKey::RateBps, &rate_bps);
        e.storage().instance().set(&DataKey::TotalAssets, &0_i128);
        e.storage().instance().set(&DataKey::TotalShares, &0_i128);
        e.storage().instance().set(&DataKey::LastHarvest, &e.ledger().timestamp());
        e.storage().instance().set(&DataKey::Initialized, &true);
        e.storage().instance().set(&DataKey::Paused, &false);
        Ok(())
    }

    pub fn deposit(e: Env, user: Address, amount: i128) -> Result<i128, VaultError> {
        require_initialized(&e)?;
        require_not_paused(&e)?;
        user.require_auth();

        if amount <= 0 {
            return Err(VaultError::ZeroAmount);
        }

        let token_id: Address = e.storage().instance()
            .get(&DataKey::TokenId).unwrap();
        let token_client = token::Client::new(&e, &token_id);
        token_client.transfer(&user, &e.current_contract_address(), &amount);

        let total_assets: i128 = e.storage().instance()
            .get(&DataKey::TotalAssets).unwrap_or(0);
        let total_shares: i128 = e.storage().instance()
            .get(&DataKey::TotalShares).unwrap_or(0);

        let price = price_per_share(total_assets, total_shares);
        let shares_to_mint = amount
            .checked_mul(SCALE)
            .ok_or(VaultError::MathOverflow)?
            .checked_div(price)
            .ok_or(VaultError::MathOverflow)?;

        let new_total_assets = total_assets
            .checked_add(amount)
            .ok_or(VaultError::MathOverflow)?;
        let new_total_shares = total_shares
            .checked_add(shares_to_mint)
            .ok_or(VaultError::MathOverflow)?;

        e.storage().instance().set(&DataKey::TotalAssets, &new_total_assets);
        e.storage().instance().set(&DataKey::TotalShares, &new_total_shares);

        // FIX: use read/write helpers that extend TTL
        let user_shares = read_user_shares(&e, &user);
        write_user_shares(&e, &user, user_shares + shares_to_mint);

        e.events().publish(
            (Symbol::new(&e, "deposit"),),
            (user, amount, shares_to_mint),
        );

        Ok(shares_to_mint)
    }

    pub fn withdraw(e: Env, user: Address, shares: i128) -> Result<i128, VaultError> {
        require_initialized(&e)?;
        require_not_paused(&e)?;
        user.require_auth();

        if shares <= 0 {
            return Err(VaultError::ZeroAmount);
        }

        let user_shares = read_user_shares(&e, &user);
        if shares > user_shares {
            return Err(VaultError::InsufficientShares);
        }

        let total_assets: i128 = e.storage().instance()
            .get(&DataKey::TotalAssets).unwrap_or(0);
        let total_shares: i128 = e.storage().instance()
            .get(&DataKey::TotalShares).unwrap_or(0);

        let price = price_per_share(total_assets, total_shares);
        let amount_out = shares
            .checked_mul(price)
            .ok_or(VaultError::MathOverflow)?
            .checked_div(SCALE)
            .ok_or(VaultError::MathOverflow)?;

        e.storage().instance().set(
            &DataKey::TotalAssets,
            &(total_assets - amount_out),
        );
        e.storage().instance().set(
            &DataKey::TotalShares,
            &(total_shares - shares),
        );

        // FIX: use write helper that extends TTL
        write_user_shares(&e, &user, user_shares - shares);

        let token_id: Address = e.storage().instance()
            .get(&DataKey::TokenId).unwrap();
        let token_client = token::Client::new(&e, &token_id);
        token_client.transfer(&e.current_contract_address(), &user, &amount_out);

        e.events().publish(
            (Symbol::new(&e, "withdraw"),),
            (user, shares, amount_out),
        );

        Ok(amount_out)
    }

    pub fn harvest(e: Env) -> Result<i128, VaultError> {
        require_initialized(&e)?;
        require_admin(&e)?;

        let total_assets: i128 = e.storage().instance()
            .get(&DataKey::TotalAssets).unwrap_or(0);

        if total_assets == 0 {
            return Ok(0);
        }

        let rate_bps: u32 = e.storage().instance()
            .get(&DataKey::RateBps).unwrap();
        let last_harvest: u64 = e.storage().instance()
            .get(&DataKey::LastHarvest).unwrap();
        let now = e.ledger().timestamp();
        let elapsed = now.saturating_sub(last_harvest);

        if elapsed == 0 {
            return Ok(0);
        }

        let yield_numerator = (total_assets as i128)
            .checked_mul(rate_bps as i128)
            .ok_or(VaultError::MathOverflow)?
            .checked_mul(elapsed as i128)
            .ok_or(VaultError::MathOverflow)?;

        let yield_denominator = (10_000_i128)
            .checked_mul(SECONDS_PER_YEAR as i128)
            .ok_or(VaultError::MathOverflow)?;

        let yield_amount = yield_numerator
            .checked_div(yield_denominator)
            .ok_or(VaultError::MathOverflow)?;

        let new_total_assets = total_assets
            .checked_add(yield_amount)
            .ok_or(VaultError::MathOverflow)?;

        e.storage().instance().set(&DataKey::TotalAssets, &new_total_assets);
        e.storage().instance().set(&DataKey::LastHarvest, &now);

        let total_shares: i128 = e.storage().instance()
            .get(&DataKey::TotalShares).unwrap_or(0);
        let new_price = price_per_share(new_total_assets, total_shares);

        e.events().publish(
            (Symbol::new(&e, "harvest"),),
            (yield_amount, new_price),
        );

        Ok(yield_amount)
    }

    // ── View functions ────────────────────────────────────────────────────────

    pub fn get_price_per_share(e: Env) -> i128 {
        let total_assets: i128 = e.storage().instance()
            .get(&DataKey::TotalAssets).unwrap_or(0);
        let total_shares: i128 = e.storage().instance()
            .get(&DataKey::TotalShares).unwrap_or(0);
        price_per_share(total_assets, total_shares)
    }

    pub fn get_user_value(e: Env, user: Address) -> i128 {
        let shares = read_user_shares(&e, &user);
        let total_assets: i128 = e.storage().instance()
            .get(&DataKey::TotalAssets).unwrap_or(0);
        let total_shares: i128 = e.storage().instance()
            .get(&DataKey::TotalShares).unwrap_or(0);
        let price = price_per_share(total_assets, total_shares);
        shares.checked_mul(price).unwrap_or(0) / SCALE
    }

    pub fn get_user_shares(e: Env, user: Address) -> i128 {
        read_user_shares(&e, &user)
    }

    pub fn get_tvl(e: Env) -> i128 {
        e.storage().instance()
            .get(&DataKey::TotalAssets).unwrap_or(0)
    }

    pub fn get_total_shares(e: Env) -> i128 {
        e.storage().instance()
            .get(&DataKey::TotalShares).unwrap_or(0)
    }

    pub fn get_rate(e: Env) -> u32 {
        e.storage().instance()
            .get(&DataKey::RateBps).unwrap_or(0)
    }

    pub fn get_admin(e: Env) -> Option<Address> {
        e.storage().instance().get(&DataKey::Admin)
    }

    // ── Admin functions ───────────────────────────────────────────────────────

    pub fn set_paused(e: Env, paused: bool) -> Result<(), VaultError> {
        require_admin(&e)?;
        e.storage().instance().set(&DataKey::Paused, &paused);
        Ok(())
    }

    pub fn set_rate(e: Env, rate_bps: u32) -> Result<(), VaultError> {
        require_admin(&e)?;
        e.storage().instance().set(&DataKey::RateBps, &rate_bps);
        Ok(())
    }
}