;; EnergyMetering Contract
;; Clarity v2
;; Tracks energy production and consumption with IoT integration

(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-ZERO-AMOUNT u101)
(define-constant ERR-PAUSED u102)
(define-constant ERR-ZERO-ADDRESS u103)
(define-constant ERR-INVALID-REPORTER u104)

;; Contract state
(define-data-var admin principal tx-sender)
(define-data-var paused bool false)
(define-data-var authorized-reporters (list 100 principal) (list tx-sender))

;; Energy data
(define-map energy-records
  { user: principal, timestamp: uint }
  { produced: uint, consumed: uint }
)
(define-map total-energy principal { produced: uint, consumed: uint })

;; Private helper: is-admin
(define-private (is-admin)
  (is-eq tx-sender (var-get admin))
)

;; Private helper: is-authorized-reporter
(define-private (is-authorized-reporter (reporter principal))
  (is-some (index-of (var-get authorized-reporters) reporter))
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

;; Add authorized reporter
(define-public (add-reporter (reporter principal))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (asserts! (not (is-eq reporter 'SP000000000000000000002Q6VF78)) (err ERR-ZERO-ADDRESS))
    (var-set authorized-reporters (unwrap! (as-max-len? (append (var-get authorized-reporters) reporter) u100) (err ERR-NOT-AUTHORIZED)))
    (ok true)
  )
)

;; Remove authorized reporter
(define-public (remove-reporter (reporter principal))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (let ((reporters (filter (lambda (r) (not (is-eq r reporter))) (var-get authorized-reporters))))
      (var-set authorized-reporters reporters)
      (ok true)
    )
  )
)

;; Report energy data
(define-public (report-energy (user principal) (produced uint) (consumed uint) (timestamp uint))
  (begin
    (ensure-not-paused)
    (asserts! (is-authorized-reporter tx-sender) (err ERR-INVALID-REPORTER))
    (asserts! (not (is-eq user 'SP000000000000000000002Q6VF78)) (err ERR-ZERO-ADDRESS))
    (asserts! (or (> produced u0) (> consumed u0)) (err ERR-ZERO-AMOUNT))
    (map-set energy-records
      { user: user, timestamp: timestamp }
      { produced: produced, consumed: consumed }
    )
    (let ((current (default-to { produced: u0, consumed: u0 } (map-get? total-energy user))))
      (map-set total-energy
        user
        { produced: (+ (get produced current) produced), consumed: (+ (get consumed current) consumed) }
      )
    )
    (ok true)
  )
)

;; Read-only: get energy record
(define-read-only (get-energy-record (user principal) (timestamp uint))
  (ok (default-to { produced: u0, consumed: u0 } (map-get? energy-records { user: user, timestamp: timestamp })))
)

;; Read-only: get total energy
(define-read-only (get-total-energy (user principal))
  (ok (default-to { produced: u0, consumed: u0 } (map-get? total-energy user)))
)

;; Read-only: get admin
(define-read-only (get-admin)
  (ok (var-get admin))
)

;; Read-only: check if paused
(define-read-only (is-paused)
  (ok (var-get paused))
)

;; Read-only: get authorized reporters
(define-read-only (get-authorized-reporters)
  (ok (var-get authorized-reporters))
)