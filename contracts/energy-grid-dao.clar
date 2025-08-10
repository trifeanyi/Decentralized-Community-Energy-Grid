;; EnergyGridDAO Contract
;; Clarity v2
;; Implements decentralized governance for energy grid management

(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-INVALID-PROPOSAL u101)
(define-constant ERR-ALREADY-VOTED u102)
(define-constant ERR-PROPOSAL-EXPIRED u103)
(define-constant ERR-PAUSED u104)
(define-constant ERR-ZERO-ADDRESS u105)
(define-constant VOTING-PERIOD u1440) ;; ~1 day in blocks
(define-constant MIN-QUORUM u1000000) ;; 1M ENERGY tokens for quorum

;; Contract state
(define-data-var admin principal tx-sender)
(define-data-var paused bool false)
(define-data-var proposal-count uint u0)

;; Token contract reference
(define-constant TOKEN-CONTRACT 'SP000000000000000000002Q6VF78.energy-token)

;; Proposal data structure
(define-map proposals
  { proposal-id: uint }
  { description: (string-ascii 256), proposer: principal, votes: uint, end-block: uint, executed: bool }
)
(define-map votes { proposal-id: uint, voter: principal } bool)

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

;; Create a proposal
(define-public (create-proposal (description (string-ascii 256)))
  (begin
    (ensure-not-paused)
    (let ((proposal-id (+ (var-get proposal-count) u1)))
      (map-set proposals
        { proposal-id: proposal-id }
        { description: description, proposer: tx-sender, votes: u0, end-block: (+ block-height VOTING-PERIOD), executed: false }
      )
      (var-set proposal-count proposal-id)
      (ok proposal-id)
    )
  )
)

;; Vote on a proposal
(define-public (vote (proposal-id uint))
  (let ((proposal (unwrap! (map-get? proposals { proposal-id: proposal-id }) (err ERR-INVALID-PROPOSAL))))
    (ensure-not-paused)
    (asserts! (<= block-height (get end-block proposal)) (err ERR-PROPOSAL-EXPIRED))
    (asserts! (not (default-to false (map-get? votes { proposal-id: proposal-id, voter: tx-sender }))) (err ERR-ALREADY-VOTED))
    (let ((voter-balance (unwrap! (contract-call? TOKEN-CONTRACT get-balance tx-sender) (err ERR-NOT-AUTHORIZED))))
      (map-set votes { proposal-id: proposal-id, voter: tx-sender } true)
      (map-set proposals
        { proposal-id: proposal-id }
        (merge proposal { votes: (+ (get votes proposal) voter-balance) })
      )
      (ok true)
    )
  )
)

;; Execute a proposal
(define-public (execute-proposal (proposal-id uint))
  (let ((proposal (unwrap! (map-get? proposals { proposal-id: proposal-id }) (err ERR-INVALID-PROPOSAL))))
    (ensure-not-paused)
    (asserts! (> block-height (get end-block proposal)) (err ERR-PROPOSAL-EXPIRED))
    (asserts! (not (get executed proposal)) (err ERR-INVALID-PROPOSAL))
    (asserts! (>= (get votes proposal) MIN-QUORUM) (err ERR-INVALID-PROPOSAL))
    (map-set proposals
      { proposal-id: proposal-id }
      (merge proposal { executed: true })
    )
    (ok true)
  )
)

;; Read-only: get proposal details
(define-read-only (get-proposal (proposal-id uint))
  (ok (unwrap! (map-get? proposals { proposal-id: proposal-id }) (err ERR-INVALID-PROPOSAL)))
)

;; Read-only: get proposal count
(define-read-only (get-proposal-count)
  (ok (var-get proposal-count))
)

;; Read-only: get admin
(define-read-only (get-admin)
  (ok (var-get admin))
)

;; Read-only: check if paused
(define-read-only (is-paused)
  (ok (var-get paused))
)