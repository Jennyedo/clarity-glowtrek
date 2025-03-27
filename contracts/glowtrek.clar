;; GlowTrek Contract

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-not-found (err u100))
(define-constant err-unauthorized (err u101))
(define-constant err-invalid-data (err u102))

;; Data structures
(define-map profiles
  principal
  {
    name: (string-ascii 64),
    privacy-level: uint,
    created-at: uint
  }
)

(define-map activities
  uint  ;; activity-id
  {
    owner: principal,
    activity-type: (string-ascii 32),
    lat: int,
    long: int,
    timestamp: uint,
    duration: uint
  }
)

(define-map location-sharing
  { sharer: principal, viewer: principal }
  { active: bool, expires-at: uint }
)

(define-data-var activity-counter uint u0)

;; Profile Management
(define-public (create-profile (name (string-ascii 64)) (privacy-level uint))
  (begin
    (asserts! (is-none (map-get? profiles tx-sender)) (err u103))
    (ok (map-set profiles tx-sender 
      {
        name: name,
        privacy-level: privacy-level,
        created-at: block-height
      }
    ))
  )
)

(define-read-only (get-profile (user principal))
  (ok (unwrap! (map-get? profiles user) err-not-found))
)

;; Activity Logging
(define-public (log-activity (activity-type (string-ascii 32)) (lat int) (long int) (timestamp uint) (duration uint))
  (let 
    (
      (activity-id (+ (var-get activity-counter) u1))
    )
    (asserts! (is-some (map-get? profiles tx-sender)) err-unauthorized)
    (map-set activities activity-id
      {
        owner: tx-sender,
        activity-type: activity-type,
        lat: lat,
        long: long,
        timestamp: timestamp,
        duration: duration
      }
    )
    (var-set activity-counter activity-id)
    (ok activity-id)
  )
)

(define-read-only (get-activity (activity-id uint))
  (ok (unwrap! (map-get? activities activity-id) err-not-found))
)

;; Location Sharing
(define-public (share-location (viewer principal))
  (let
    (
      (expires-at (+ block-height u144))  ;; 24 hours in blocks
    )
    (ok (map-set location-sharing {sharer: tx-sender, viewer: viewer}
      {
        active: true,
        expires-at: expires-at
      }
    ))
  )
)

(define-public (revoke-location-sharing (viewer principal))
  (ok (map-delete location-sharing {sharer: tx-sender, viewer: viewer}))
)

(define-read-only (can-view-location (sharer principal) (viewer principal))
  (let
    (
      (sharing-data (map-get? location-sharing {sharer: sharer, viewer: viewer}))
    )
    (if (is-some sharing-data)
      (let
        (
          (data (unwrap-panic sharing-data))
        )
        (ok (and (get active data) (<= block-height (get expires-at data))))
      )
      (ok false)
    )
  )
)
