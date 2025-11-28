# Group Expense Test Case: "Orders Group"

## Setup
**Group Name:** Orders Group  
**Members:**
1. Alice
2. Bob
3. Charlie
4. Diana

## Expenses

### Expense 1: Pizza Order
- **Amount:** ₱550.00
- **Paid by:** Alice (₱550.00)
- **Split between:** Alice, Bob, Charlie, Diana (equal)
- **Calculation:**
  - Each person's share: ₱550 / 4 = ₱137.50
  - Alice paid: ₱550.00, owes: ₱137.50 → Net: +₱412.50
  - Bob paid: ₱0.00, owes: ₱137.50 → Net: -₱137.50
  - Charlie paid: ₱0.00, owes: ₱137.50 → Net: -₱137.50
  - Diana paid: ₱0.00, owes: ₱137.50 → Net: -₱137.50

### Expense 2: Groceries
- **Amount:** ₱1,200.00
- **Paid by:** Bob (₱1,200.00)
- **Split between:** Bob, Charlie, Diana (equal - Alice not included)
- **Calculation:**
  - Each person's share: ₱1,200 / 3 = ₱400.00
  - Bob paid: ₱1,200.00, owes: ₱400.00 → Net change: +₱800.00
  - Charlie paid: ₱0.00, owes: ₱400.00 → Net change: -₱400.00
  - Diana paid: ₱0.00, owes: ₱400.00 → Net change: -₱400.00
  - Alice: No change (not in split)

### Expense 3: Coffee & Snacks
- **Amount:** ₱450.00
- **Paid by:** Charlie (₱300.00), Diana (₱150.00)
- **Split between:** All 4 members (equal)
- **Calculation:**
  - Each person's share: ₱450 / 4 = ₱112.50
  - Total paid: ₱300 + ₱150 = ₱450.00
  - Alice paid: ₱0.00, owes: ₱112.50 → Net change: -₱112.50
  - Bob paid: ₱0.00, owes: ₱112.50 → Net change: -₱112.50
  - Charlie paid: ₱300.00, owes: ₱112.50 → Net change: +₱187.50
  - Diana paid: ₱150.00, owes: ₱112.50 → Net change: +₱37.50

## Final Net Balances

### Alice
- Expense 1: +₱412.50
- Expense 2: ₱0.00
- Expense 3: -₱112.50
- **Total Net: +₱300.00** (owed money)

### Bob
- Expense 1: -₱137.50
- Expense 2: +₱800.00
- Expense 3: -₱112.50
- **Total Net: +₱550.00** (owed money)

### Charlie
- Expense 1: -₱137.50
- Expense 2: -₱400.00
- Expense 3: +₱187.50
- **Total Net: -₱350.00** (owes money)

### Diana
- Expense 1: -₱137.50
- Expense 2: -₱400.00
- Expense 3: +₱37.50
- **Total Net: -₱500.00** (owes money)

## Settlement Suggestions

The algorithm should suggest minimal transfers (greedy approach):

1. **Diana → Bob:** ₱362.50 (Diana's debt to Bob)
   - After: Diana still owes ₱137.50 total, Bob is owed ₱187.50

2. **Diana → Alice:** ₱100.00 (Diana's remaining debt to Alice)
   - After: Diana still owes ₱37.50 total

3. **Diana → Charlie:** ₱37.50 (Diana's remaining debt to Charlie)
   - After: Diana settled

4. **Charlie → Bob:** ₱325.00 (Charlie's debt to Bob)
   - After: Charlie still owes ₱25.00 total, Bob is owed ₱0.00 (settled)

5. **Charlie → Alice:** ₱62.50 (Charlie's debt to Alice)
   - But Charlie only owes ₱25.00 remaining, so: **Charlie → Alice:** ₱25.00
   - After: Charlie settled, Alice still owed ₱37.50

6. **Bob → Alice:** ₱137.50 (Bob's debt to Alice, but Bob is owed more, so this is net)
   - Actually, Bob owes Alice ₱137.50, but is owed ₱687.50 total, so net is +₱550.00
   - The algorithm should handle this: **Bob → Alice:** ₱137.50
   - After: Bob settled, Alice still owed ₱0.00

**Wait, let me recalculate the settlement suggestions properly:**

Creditors (owed money):
- Bob: +₱550.00
- Alice: +₱300.00

Debtors (owe money):
- Diana: -₱500.00
- Charlie: -₱350.00

Greedy algorithm:
1. Diana (-₱500) → Bob (+₱550): Transfer ₱500.00
   - After: Diana: 0, Bob: +₱50.00

2. Charlie (-₱350) → Bob (+₱50): Transfer ₱50.00
   - After: Charlie: -₱300.00, Bob: 0

3. Charlie (-₱300) → Alice (+₱300): Transfer ₱300.00
   - After: Both settled

**Total transfers:** 3 payments

## Breakdown by Member

### Alice (Net: +₱300.00 - Owed Money)
- **Owes Alice:**
  - Bob: ₱0.00 (Bob doesn't owe Alice directly from pairwise calculation)
  - Charlie: ₱0.00
  - Diana: ₱0.00
- **Note:** Alice is owed from the group net, but pairwise debts show:
  - From Expense 1: Bob owes Alice ₱137.50, Charlie owes Alice ₱137.50, Diana owes Alice ₱137.50
  - From Expense 3: Alice owes Charlie ₱112.50 (Charlie paid more than his share)
  - **Pairwise totals:**
    - Bob → Alice: ₱137.50
    - Charlie → Alice: ₱137.50 - ₱112.50 = ₱25.00
    - Diana → Alice: ₱137.50
    - **Total: ₱300.00** ✓

### Bob (Net: +₱550.00 - Owed Money)
- **Owes Bob:**
  - From Expense 2: Charlie owes Bob ₱400.00, Diana owes Bob ₱400.00
  - From Expense 3: Alice owes Bob ₱112.50, Charlie owes Bob ₱112.50, Diana owes Bob ₱112.50
  - But Bob also owes Alice ₱137.50 from Expense 1
  - **Pairwise totals:**
    - Alice → Bob: ₱0.00 (Bob owes Alice more, so net is Alice's favor)
    - Charlie → Bob: ₱400.00 + ₱112.50 = ₱512.50
    - Diana → Bob: ₱400.00 + ₱112.50 = ₱512.50
    - But wait, we need to account for Bob's debt to Alice...
    - Actually, pairwise: Bob owes Alice ₱137.50, so:
      - Net from others to Bob: ₱512.50 + ₱512.50 = ₱1,025.00
      - Minus Bob's debt to Alice: ₱1,025.00 - ₱137.50 = ₱887.50
    - **Wait, let me recalculate properly...**

Let me recalculate the pairwise debts more carefully:

**Expense 1 (₱550, split 4 ways, Alice paid all):**
- Bob owes Alice: ₱137.50
- Charlie owes Alice: ₱137.50
- Diana owes Alice: ₱137.50

**Expense 2 (₱1,200, split 3 ways - Bob, Charlie, Diana, Bob paid all):**
- Charlie owes Bob: ₱400.00
- Diana owes Bob: ₱400.00

**Expense 3 (₱450, split 4 ways, Charlie paid ₱300, Diana paid ₱150):**
- Each share: ₱112.50
- Alice owes: ₱112.50 total
  - To Charlie: (₱112.50 / ₱450) × ₱300 = ₱75.00
  - To Diana: (₱112.50 / ₱450) × ₱150 = ₱37.50
- Bob owes: ₱112.50 total
  - To Charlie: (₱112.50 / ₱450) × ₱300 = ₱75.00
  - To Diana: (₱112.50 / ₱450) × ₱150 = ₱37.50
- Charlie paid ₱300, owes ₱112.50 → net +₱187.50
  - Receives from Alice: ₱75.00
  - Receives from Bob: ₱75.00
  - Receives from Diana: ₱37.50 (Diana's share of what Charlie paid)
- Diana paid ₱150, owes ₱112.50 → net +₱37.50
  - Receives from Alice: ₱37.50
  - Receives from Bob: ₱37.50
  - Receives from Charlie: ₱0.00 (Charlie doesn't owe Diana)

**Final Pairwise Debts:**

**Alice:**
- Bob → Alice: ₱137.50
- Charlie → Alice: ₱137.50 - ₱75.00 = ₱62.50
- Diana → Alice: ₱137.50 - ₱37.50 = ₱100.00
- **Total owed to Alice: ₱300.00** ✓

**Bob:**
- Alice → Bob: ₱0.00 (Bob owes Alice more, so net is in Alice's favor)
- Charlie → Bob: ₱400.00 + ₱75.00 = ₱475.00
- Diana → Bob: ₱400.00 + ₱37.50 = ₱437.50
- But Bob owes Alice ₱137.50, so:
  - Net from Charlie and Diana: ₱475.00 + ₱437.50 = ₱912.50
  - Minus what Bob owes Alice: ₱912.50 - ₱137.50 = ₱775.00
- **Wait, this doesn't match the net of ₱550.00...**

Let me recalculate Bob's net more carefully:
- Bob paid Expense 2: +₱1,200.00
- Bob's share of Expense 1: -₱137.50
- Bob's share of Expense 2: -₱400.00
- Bob's share of Expense 3: -₱112.50
- Bob paid Expense 3: ₱0.00
- **Net: +₱1,200.00 - ₱137.50 - ₱400.00 - ₱112.50 = +₱550.00** ✓

For pairwise, Bob receives:
- From Charlie (Expense 2): ₱400.00
- From Diana (Expense 2): ₱400.00
- From Charlie (Expense 3): ₱75.00
- From Diana (Expense 3): ₱37.50
- Total receives: ₱912.50

Bob pays:
- To Alice (Expense 1): ₱137.50
- To Charlie (Expense 3): ₱0.00 (Bob didn't pay for Expense 3)
- To Diana (Expense 3): ₱0.00
- Total pays: ₱137.50

**Bob's net from pairwise: ₱912.50 - ₱137.50 = ₱775.00**

This doesn't match! The issue is that in Expense 3, Bob owes his share but the payment goes to the payers proportionally. Let me recalculate Expense 3 pairwise:

**Expense 3: ₱450 total, Charlie paid ₱300 (66.67%), Diana paid ₱150 (33.33%)**
- Each person owes ₱112.50
- Alice owes ₱112.50:
  - To Charlie: ₱112.50 × (₱300/₱450) = ₱75.00
  - To Diana: ₱112.50 × (₱150/₱450) = ₱37.50
- Bob owes ₱112.50:
  - To Charlie: ₱112.50 × (₱300/₱450) = ₱75.00
  - To Diana: ₱112.50 × (₱150/₱450) = ₱37.50
- Charlie paid ₱300, owes ₱112.50, so receives: ₱187.50
  - From Alice: ₱75.00
  - From Bob: ₱75.00
  - From Diana: ₱37.50
- Diana paid ₱150, owes ₱112.50, so receives: ₱37.50
  - From Alice: ₱37.50
  - From Bob: ₱37.50
  - From Charlie: ₱0.00 (Charlie doesn't owe Diana, he's a payer)

So Bob's pairwise:
- Receives from Charlie: ₱400.00 (Expense 2) + ₱0.00 (Expense 3, Bob doesn't receive, he pays) = Wait, no
- Actually, Bob pays to Charlie in Expense 3: ₱75.00
- So Bob receives from Charlie: ₱400.00 - ₱75.00 = ₱325.00
- Bob receives from Diana: ₱400.00 (Expense 2) - ₱37.50 (Expense 3) = ₱362.50
- Bob pays to Alice: ₱137.50
- **Bob's net: ₱325.00 + ₱362.50 - ₱137.50 = ₱550.00** ✓

**Charlie:**
- Pays to Alice: ₱137.50 (Expense 1) - ₱75.00 (Expense 3, receives from Alice) = ₱62.50
- Pays to Bob: ₱400.00 (Expense 2) + ₱75.00 (Expense 3) = ₱475.00
- Receives from Diana: ₱37.50 (Expense 3)
- **Charlie's net: -₱62.50 - ₱475.00 + ₱37.50 = -₱500.00**

Wait, that's wrong. Let me recalculate Charlie:
- Charlie paid Expense 3: +₱300.00
- Charlie's share Expense 1: -₱137.50
- Charlie's share Expense 2: -₱400.00
- Charlie's share Expense 3: -₱112.50
- **Net: +₱300.00 - ₱137.50 - ₱400.00 - ₱112.50 = -₱350.00** ✓

For pairwise, Charlie:
- Pays to Alice: ₱137.50 - ₱75.00 = ₱62.50
- Pays to Bob: ₱400.00 + ₱75.00 = ₱475.00
- Receives from Diana: ₱37.50
- **Net: -₱62.50 - ₱475.00 + ₱37.50 = -₱500.00** ❌

I think the issue is in how I'm calculating the pairwise. Let me use the actual algorithm logic:

**Expense 3 pairwise calculation:**
- Total paid: ₱450 (Charlie: ₱300, Diana: ₱150)
- Total split: ₱450 (Alice: ₱112.50, Bob: ₱112.50, Charlie: ₱112.50, Diana: ₱112.50)

For each splitter, they owe their share proportionally to payers:
- Alice owes ₱112.50:
  - To Charlie: (₱112.50 / ₱450) × ₱300 = ₱75.00
  - To Diana: (₱112.50 / ₱450) × ₱150 = ₱37.50
- Bob owes ₱112.50:
  - To Charlie: (₱112.50 / ₱450) × ₱300 = ₱75.00
  - To Diana: (₱112.50 / ₱450) × ₱150 = ₱37.50
- Charlie owes ₱112.50:
  - To Charlie: ₱0.00 (doesn't owe himself)
  - To Diana: (₱112.50 / ₱450) × ₱150 = ₱37.50
- Diana owes ₱112.50:
  - To Charlie: (₱112.50 / ₱450) × ₱300 = ₱75.00
  - To Diana: ₱0.00 (doesn't owe herself)

**Cumulative Pairwise Debts:**

**Alice:**
- Bob → Alice: ₱137.50 (Expense 1)
- Charlie → Alice: ₱137.50 (Expense 1) - ₱75.00 (Expense 3, Alice owes Charlie) = ₱62.50
- Diana → Alice: ₱137.50 (Expense 1) - ₱37.50 (Expense 3, Alice owes Diana) = ₱100.00
- **Total: ₱300.00** ✓

**Bob:**
- Alice → Bob: ₱0.00 (Bob owes Alice, so net is in Alice's favor)
- Charlie → Bob: ₱400.00 (Expense 2) + ₱75.00 (Expense 3) = ₱475.00
- Diana → Bob: ₱400.00 (Expense 2) + ₱37.50 (Expense 3) = ₱437.50
- Bob → Alice: -₱137.50 (Bob owes this)
- **Net receives: ₱475.00 + ₱437.50 - ₱137.50 = ₱775.00** ❌

I see the issue - when calculating pairwise, we need to account for both directions. Let me think about this differently:

Bob's net should be: what he's owed minus what he owes
- Bob is owed: ₱475.00 (from Charlie) + ₱437.50 (from Diana) = ₱912.50
- Bob owes: ₱137.50 (to Alice)
- But Bob's actual net is ₱550.00, which means the pairwise calculation might be showing what others owe Bob, but we need to show the net.

Actually, I think the breakdown should show:
- If Bob has a positive net, show who owes Bob (and how much)
- The pairwise debts show the gross amounts, but the net is what matters

Let me simplify and provide the correct expected values based on the net calculation:

## Expected Results in App

### Main Page - Member Balances (sorted by net, highest first):
1. **Bob: +₱550.00** (owed money)
2. **Alice: +₱300.00** (owed money)
3. **Charlie: -₱350.00** (owes money)
4. **Diana: -₱500.00** (owes money)

### Settlement Suggestions:
1. **Diana → Bob:** ₱500.00 (Diana's full debt)
2. **Charlie → Bob:** ₱50.00 (remaining after Diana pays Bob)
3. **Charlie → Alice:** ₱300.00 (remaining Charlie debt to Alice)

OR (greedy algorithm might optimize differently):
1. **Diana → Bob:** ₱500.00
2. **Charlie → Alice:** ₱300.00
3. **Charlie → Bob:** ₱50.00

### Breakdown by Member:

**Alice (Net: +₱300.00):**
- Bob owes Alice: ₱137.50
- Charlie owes Alice: ₱62.50
- Diana owes Alice: ₱100.00
- **Total to receive: ₱300.00**

**Bob (Net: +₱550.00):**
- Charlie owes Bob: ₱475.00
- Diana owes Bob: ₱437.50
- Bob owes Alice: ₱137.50 (shown as "you owe Alice")
- **Net: Receives ₱775.00, owes ₱137.50 = +₱550.00 net**

**Charlie (Net: -₱350.00):**
- Charlie owes Alice: ₱62.50
- Charlie owes Bob: ₱475.00
- Diana owes Charlie: ₱37.50
- **Net: Owes ₱537.50, receives ₱37.50 = -₱500.00** ❌

Wait, I'm still getting wrong numbers. Let me recalculate Charlie's pairwise more carefully by going through each expense:

**Charlie's pairwise debts:**
- Expense 1: Charlie owes Alice ₱137.50
- Expense 2: Charlie owes Bob ₱400.00
- Expense 3: 
  - Charlie paid ₱300.00
  - Charlie's share: ₱112.50
  - So Charlie is owed: ₱300.00 - ₱112.50 = ₱187.50
  - This comes from: Alice ₱75.00, Bob ₱75.00, Diana ₱37.50
  - But Charlie also owes his share proportionally... wait, no
  - Actually, Charlie paid, so others owe him. But Charlie also has a share, so:
    - Charlie receives from others for his payment: ₱187.50
    - But Charlie doesn't owe himself, so his net from Expense 3 is +₱187.50
  - In pairwise terms:
    - Alice → Charlie: +₱75.00 (Alice owes Charlie)
    - Bob → Charlie: +₱75.00 (Bob owes Charlie)
    - Diana → Charlie: +₱37.50 (Diana owes Charlie)
    - Charlie → Alice: -₱0.00 (Charlie doesn't owe Alice in this expense)
    - Charlie → Bob: -₱0.00
    - Charlie → Diana: -₱0.00

So Charlie's cumulative:
- To Alice: ₱137.50 (Expense 1) - ₱75.00 (Expense 3, receives from Alice) = ₱62.50
- To Bob: ₱400.00 (Expense 2) - ₱75.00 (Expense 3, receives from Bob) = ₱325.00
- From Diana: -₱37.50 (Expense 3, receives from Diana, so this reduces what he owes)
- **Charlie's net pairwise: -₱62.50 - ₱325.00 + ₱37.50 = -₱350.00** ✓

**Diana's pairwise:**
- To Alice: ₱137.50 (Expense 1) - ₱37.50 (Expense 3, receives from Alice) = ₱100.00
- To Bob: ₱400.00 (Expense 2) - ₱37.50 (Expense 3, receives from Bob) = ₱362.50
- To Charlie: -₱37.50 (Expense 3, pays to Charlie)
- **Diana's net: -₱100.00 - ₱362.50 - ₱37.50 = -₱500.00** ✓

**Bob's pairwise (final check):**
- To Alice: -₱137.50 (owes Alice)
- From Charlie: +₱400.00 (Expense 2) - ₱75.00 (Expense 3, pays to Charlie) = +₱325.00
- From Diana: +₱400.00 (Expense 2) - ₱37.50 (Expense 3, pays to Diana) = +₱362.50
- **Bob's net: -₱137.50 + ₱325.00 + ₱362.50 = +₱550.00** ✓

Perfect! Now the breakdowns:

### Final Breakdown by Member:

**Alice (Net: +₱300.00):**
- Bob owes Alice: ₱137.50
- Charlie owes Alice: ₱62.50
- Diana owes Alice: ₱100.00
- **Total to receive: ₱300.00**

**Bob (Net: +₱550.00):**
- Charlie owes Bob: ₱325.00
- Diana owes Bob: ₱362.50
- You owe Alice: ₱137.50
- **Net: +₱550.00**

**Charlie (Net: -₱350.00):**
- You owe Alice: ₱62.50
- You owe Bob: ₱325.00
- Diana owes Charlie: ₱37.50
- **Net: -₱350.00**

**Diana (Net: -₱500.00):**
- You owe Alice: ₱100.00
- You owe Bob: ₱362.50
- You owe Charlie: ₱37.50
- **Net: -₱500.00**

