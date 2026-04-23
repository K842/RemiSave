.PHONY: build test deploy-token deploy-vault init-vault mint-test smoke-test full-reset

include .env
export

ADMIN_KEY := admin
TOKEN_WASM := target/wasm32v1-none/release/remisave_token.wasm
VAULT_WASM := target/wasm32v1-none/release/remisave_vault.wasm

build:
	stellar contract build

test:
	cargo test -p remisave-vault --features soroban-sdk/testutils -- --nocapture

deploy-token:
	$(eval TOKEN_ID := $(shell stellar contract deploy \
		--wasm $(TOKEN_WASM) \
		--source $(ADMIN_KEY) \
		--network testnet \
		-- \
		--admin $(shell stellar keys address $(ADMIN_KEY)) \
		--decimal 7 \
		--name "RemiUSDC" \
		--symbol "rUSDC"))
	@echo "Token deployed: $(TOKEN_ID)"
	@echo "TOKEN_ID=$(TOKEN_ID)" > .env.new
	@echo "VAULT_ID=$(VAULT_ID)" >> .env.new
	@echo "ADMIN_ADDRESS=$(shell stellar keys address $(ADMIN_KEY))" >> .env.new
	@echo "USER_A_ADDRESS=$(USER_A_ADDRESS)" >> .env.new
	@echo "USER_B_ADDRESS=$(USER_B_ADDRESS)" >> .env.new
	@echo "NETWORK=testnet" >> .env.new
	@mv .env.new .env

deploy-vault:
	$(eval VAULT_ID := $(shell stellar contract deploy \
		--wasm $(VAULT_WASM) \
		--source $(ADMIN_KEY) \
		--network testnet))
	@echo "Vault deployed: $(VAULT_ID)"
	@echo "TOKEN_ID=$(TOKEN_ID)" > .env.new
	@echo "VAULT_ID=$(VAULT_ID)" >> .env.new
	@echo "ADMIN_ADDRESS=$(shell stellar keys address $(ADMIN_KEY))" >> .env.new
	@echo "USER_A_ADDRESS=$(USER_A_ADDRESS)" >> .env.new
	@echo "USER_B_ADDRESS=$(USER_B_ADDRESS)" >> .env.new
	@echo "NETWORK=testnet" >> .env.new
	@mv .env.new .env

init-vault:
	stellar contract invoke --id $(VAULT_ID) --source admin --network testnet \
		-- initialize \
		--admin $(ADMIN_ADDRESS) --token-id $(TOKEN_ID) --rate-bps 800

mint-test:
	stellar contract invoke --id $(TOKEN_ID) --source admin --network testnet \
		-- mint --to $(USER_A_ADDRESS) --amount 10000000000
	stellar contract invoke --id $(TOKEN_ID) --source admin --network testnet \
		-- mint --to $(USER_B_ADDRESS) --amount 10000000000

full-reset: build deploy-token deploy-vault init-vault mint-test
	@echo ".env updated, both contracts live on testnet"