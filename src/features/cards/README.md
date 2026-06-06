# Cards

Add new dashboard cards here.

1. Create `src/features/cards/<name>/<Name>Card.tsx`.
2. Put card-specific state/data logic beside it, usually `use<Name>Card.ts`.
3. Wrap UI with `DashboardCard`.
4. Add the card to `cardRegistry` in `registry.ts`.

Card sizes:

- `sm`: 1 column
- `md`: 2 columns
- `lg`: 2 columns, 3 on xl screens
- `wide`: full row
