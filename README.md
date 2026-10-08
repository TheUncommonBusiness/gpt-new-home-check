# Where should your Custom GPT go?

A five-question check that narrows seven options for moving a Custom GPT. It uses only what each vendor's own public pages said on October 8, 2026.

This is an exploratory snapshot. It is not definitive, not legal or compliance advice, and nothing in it was confirmed with a vendor. Check each vendor's current pages and contract yourself and ask in writing before you move anything.

## How it decides

- A gate removes an option only when its own pages fail to confirm the thing you asked for. A missing fact never counts as a yes, and it is never shown as a no. It shows as a question mark.
- Status marks: a check is confirmed on the vendor's pages, a tilde is partly stated or the vendor's pages disagree, a question mark is not found.
- Options that pass are ordered by lowest listed starting price, not by quality.
- If nothing passes, the result says so and lists the questions to send each closest vendor.
- It runs in the browser. No accounts, analytics or form submission. Answers clear on refresh.

## Files

- `finder.js`: the data (seven options, eight fields each, with a source page per cell) and the gate logic.
- `template.html` and `build.cjs`: build `embed.html` (the 708 by 400 Notion frame) and `index.html` (the full page).
- `test-paths.cjs`: runs all 72 answer paths and checks the data. Run it before every change.
- `check-render.cjs`: checks the embed at six sizes and 14 states for clipping and scrolling. Needs `npm i puppeteer-core` and Google Chrome.

## Rebuild

```bash
node test-paths.cjs
node build.cjs "<path to TUB_Logo_RGB__Horizontal_Stone.png>"
node check-render.cjs "file://$PWD/embed.html"
```

## Updating the facts

Change the cell in `finder.js`, keep its source link, and change the checked date in `finder.js` and the footer text in `template.html` and `build.cjs`. If a page now says something different, change the status mark too. Never fill a cell from memory, a forum, an interview or a search snippet.
