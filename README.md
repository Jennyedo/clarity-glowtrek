# GlowTrek
A decentralized outdoor adventure tracker with real-time location sharing and activity logging built on Stacks blockchain.

## Features
- Create and manage adventure profiles
- Log activities with location data 
- Share real-time location with selected users
- View activity history and statistics
- Privacy controls for location sharing

## Setup and Installation
1. Clone the repository
2. Install Clarinet
3. Run `clarinet check` to verify contracts
4. Run `clarinet test` to run test suite

## Usage Examples
```clarity
;; Create a new adventure profile
(contract-call? .glowtrek create-profile "Mountain Explorer" u1)

;; Log an activity
(contract-call? .glowtrek log-activity 
  {
    activity-type: "hiking",
    location: {lat: 123456, long: 789012},
    timestamp: u1634567890,
    duration: u7200
  }
)

;; Share location with user
(contract-call? .glowtrek share-location 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
```

## Dependencies
- Clarity language
- Clarinet for testing and deployment
