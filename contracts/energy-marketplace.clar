;; EnergyMarketplace Contract
;; Clarity v2
;; Manages peer-to-peer energy trading with offer creation and purchase functionality

(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-INSUFFICIENT-ENERGY u101)
(define-constant ERR-INSUFFICIENT-BALANCE u102)
(define-constant ERR-OFFER-INACTIVE u103)
(define-constant ERR-ZERO-AMOUNT u104)
(define-constant ERR-PAUSED u105)
(define-constant ERR-ZERO-ADDRESS u106)
(define-constant ERR-INVALID-OFFER u107)

;; Contract state
(define-data-var admin principal tx-sender)
(define-data-var paused bool false)
(define-data-var offer-count uint u0)

;; Offer data structure
(define-map energy-offers
  { offer-id: uint }
  { seller: principal, amount: uint, price-per-kwh: uint, active: bool }
)

;; Token contract reference (for ENERGY token transfers)
(define-constant TOKEN-CONTRACT 'SP000000000000000000002Q6VF78.energy-token)

;; Private helper: is-admin
(define-private (is-admin)
  (is-eq tx-sender (var-get admin))
)

;; Private helper: ensure not paused
(define-private (ensure-not-paused)
  (asserts! (not (var-get paused)) (err ERR-PAUSED))
)

;; Transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (asserts! (not (is-eq new-admin 'SP000000000000000000002Q6VF78)) (err ERR-ZERO-ADDRESS))
    (var-set admin new-admin)
    (ok true)
  )
)

;; Pause/unpause the contract
(define-public (set-paused (pause bool))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (var-set paused pause)
    (ok pause)
  )
)

;; Create an energy offer
(define-public (create-offer (amount uint) (price-per-kwh uint))
  (begin
    (ensure-not-paused)
    (asserts! (> amount u0) (err ERR-ZERO-AMOUNT))
    (asserts! (> price-per-kwh u0) (err ERR-ZERO-AMOUNT))
    (let ((offer-id (+ (var-get offer-count) u1)))
      (map-set energy-offers
        { offer-id: offer-id }
        { seller: tx-sender, amount: amount, price-per-kwh: price-per-kwh, active: true }
      )
      (var-set offer-count offer-id)
      (ok offer-id)
    )
  )
)

;; Cancel an energy offer
(define-public (cancel-offer (offer-id uint))
  (let ((offer (unwrap! (map-get? energy-offers { offer-id: offer-id }) (err ERR-INVALID-OFFER))))
    (asserts! (is-eq tx-sender (get seller offer)) (err ERR-NOT-AUTHORIZED))
    (asserts! (get active offer) (err ERR-OFFER-INACTIVE))
    (map-set energy-offers
      { offer-id: offer-id }
      (merge offer { active: false })
    )
    (ok true)
  )
)

;; Purchase energy from an offer
(define-public (buy-energy (offer-id uint) (amount uint))
  (let ((offer (unwrap! (map-get? energy-offers { offer-id: offer-id }) (err ERR-INVALID-OFFER))))
    (ensure-not-paused)
    (asserts! (get active offer) (err ERR-OFFER-INACTIVE))
    (asserts! (>= (get amount offer) amount) (err ERR-INSUFFICIENT-ENERGY))
    (asserts! (> amount u0) (err ERR-ZERO-AMOUNT))
    (let ((total-cost (* amount (get price-per-kwh offer))))
      (try! (contract-call? TOKEN-CONTRACT transfer total-cost tx-sender (get seller offer)))
      (map-set energy-offers
        { offer-id: offer-id }
        (merge offer { amount: (- (get amount offer) amount), active: (if (is-eq (- (get amount offer) amount) u0) false true) })
      )
      (ok true)
    )
  )
)

;; Read-only: get offer details
(define-read-only (get-offer (offer-id uint))
  (ok (unwrap! (map-get? energy-offers { offer-id: offer-id }) (err ERR-INVALID-OFFER)))
)

;; Read-only: get offer count
(define-read-only (get-offer-count)
  (ok (var-get offer-count))
)

;; Read-only: get admin
(define-read-only (get-admin)
  (ok (var-get admin))
)

;; Read-only: check if paused
(define-read-only (is-paused)
  (ok (var-get paused))
)