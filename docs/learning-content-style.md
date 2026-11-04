# Learning content presentation

MBA OS uses a restrained editorial treatment for teaching material. The default text stays neutral; only the important phrase or learning intervention receives an accent.

## Inline emphasis

Use `content-highlight` for a key term inside an explanation:

```tsx
<p>
  Remember that <strong className="content-highlight">successive percentage changes</strong>
  are applied to the changing value, not always to the original amount.
</p>
```

## Reusable callouts

Import `LearningCallout` from `@/components/learning/learning-callout`.

```tsx
<LearningCallout kind="note">
  A weighted average depends on the size of each group.
</LearningCallout>

<LearningCallout kind="trap">
  Do not add successive percentage changes directly when the base changes.
</LearningCallout>

<LearningCallout kind="shortcut">
  When the ratio is fixed, assign a common multiplier before substituting values.
</LearningCallout>

<LearningCallout kind="formula">
  Final value = Initial value × (1 + r/100)
</LearningCallout>

<LearningCallout kind="remember">
  Check whether the question asks for the original value or the changed value.
</LearningCallout>
```

## Editorial rules

- Use one callout only when it adds a distinct learning point; do not wrap every paragraph.
- Use the trap style for a genuine misconception, not merely a difficult question.
- Use shortcut for a valid method with its conditions stated.
- Keep formula callouts mathematically precise and define symbols nearby.
- Never style an unverified answer as an authoritative fact.
- Keep the terracotta accent for important emphasis; reserve green, ochre and slate for the other callout categories.
