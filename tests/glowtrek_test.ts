import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
  name: "Test profile creation and retrieval",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const name = "Mountain Explorer";
    const privacyLevel = 1;
    
    let block = chain.mineBlock([
      Tx.contractCall('glowtrek', 'create-profile',
        [types.ascii(name), types.uint(privacyLevel)],
        deployer.address
      )
    ]);
    
    block.receipts[0].result.expectOk();
    
    let response = chain.callReadOnlyFn(
      'glowtrek',
      'get-profile',
      [types.principal(deployer.address)],
      deployer.address
    );
    
    const profile = response.result.expectOk().expectTuple();
    assertEquals(profile.name, types.ascii(name));
    assertEquals(profile['privacy-level'], types.uint(privacyLevel));
  }
});

Clarinet.test({
  name: "Test activity logging and retrieval",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    
    // Create profile first
    chain.mineBlock([
      Tx.contractCall('glowtrek', 'create-profile',
        [types.ascii("Hiker"), types.uint(1)],
        deployer.address
      )
    ]);
    
    // Log activity
    let block = chain.mineBlock([
      Tx.contractCall('glowtrek', 'log-activity',
        [
          types.ascii("hiking"),
          types.int(123456),
          types.int(789012),
          types.uint(1634567890),
          types.uint(7200)
        ],
        deployer.address
      )
    ]);
    
    const activityId = block.receipts[0].result.expectOk();
    
    // Get activity
    let response = chain.callReadOnlyFn(
      'glowtrek',
      'get-activity',
      [activityId],
      deployer.address
    );
    
    const activity = response.result.expectOk().expectTuple();
    assertEquals(activity['activity-type'], types.ascii("hiking"));
    assertEquals(activity.lat, types.int(123456));
    assertEquals(activity.long, types.int(789012));
  }
});

Clarinet.test({
  name: "Test location sharing functionality",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    
    // Share location
    let block = chain.mineBlock([
      Tx.contractCall('glowtrek', 'share-location',
        [types.principal(wallet1.address)],
        deployer.address
      )
    ]);
    
    block.receipts[0].result.expectOk();
    
    // Check viewing permission
    let response = chain.callReadOnlyFn(
      'glowtrek',
      'can-view-location',
      [
        types.principal(deployer.address),
        types.principal(wallet1.address)
      ],
      deployer.address
    );
    
    response.result.expectOk().expectBool(true);
    
    // Revoke sharing
    block = chain.mineBlock([
      Tx.contractCall('glowtrek', 'revoke-location-sharing',
        [types.principal(wallet1.address)],
        deployer.address
      )
    ]);
    
    block.receipts[0].result.expectOk();
    
    // Verify revocation
    response = chain.callReadOnlyFn(
      'glowtrek',
      'can-view-location',
      [
        types.principal(deployer.address),
        types.principal(wallet1.address)
      ],
      deployer.address
    );
    
    response.result.expectOk().expectBool(false);
  }
});
