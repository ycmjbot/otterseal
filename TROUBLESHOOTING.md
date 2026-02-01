# OtterSeal Troubleshooting

## Lexical Errors

### Error 173: Missing node dependency for transformer

**Error message:**
```
Uncaught Error: Minified Lexical error #173; visit https://lexical.dev/docs/error?code=173&v=<node_type>
```

**Full error:** `MarkdownShortcuts: missing dependency <node_type> for transformer. Ensure node dependency is included in editor initial config.`

**Cause:** You're using `MarkdownShortcutPlugin` with transformers that require nodes you haven't registered.

**How to diagnose:**
1. Look at the `v=` parameter in the error URL - it tells you which node is missing
2. Or look up the error code at: https://raw.githubusercontent.com/facebook/lexical/main/scripts/error-codes/codes.json

**Fix:** Add the missing node(s) to your editor config's `nodes` array.

**Common case - using default TRANSFORMERS:**

The default `TRANSFORMERS` from `@lexical/markdown` includes transformers for:
- Headings → `HeadingNode`
- Quotes → `QuoteNode`  
- Lists → `ListNode`, `ListItemNode`
- Code → `CodeNode`
- **Links → `LinkNode`, `AutoLinkNode`** ← Often forgotten!

```jsx
// Required imports
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode } from "@lexical/code";
import { LinkNode, AutoLinkNode } from "@lexical/link";  // Don't forget!

// Editor config
const config = {
  namespace: 'MyEditor',
  nodes: [
    HeadingNode, 
    QuoteNode, 
    ListNode, 
    ListItemNode, 
    CodeNode,
    LinkNode,      // Required for TRANSFORMERS
    AutoLinkNode   // Required for TRANSFORMERS
  ]
};
```

**Alternative:** If you don't need all transformers, import specific ones instead of using the default `TRANSFORMERS`:

```jsx
import { 
  HEADING, 
  QUOTE, 
  UNORDERED_LIST, 
  ORDERED_LIST,
  CODE 
} from '@lexical/markdown';

// Only include transformers for nodes you've registered
const myTransformers = [HEADING, QUOTE, UNORDERED_LIST, ORDERED_LIST, CODE];

<MarkdownShortcutPlugin transformers={myTransformers} />
```

---

## Deployment

### otterway-deploy reports failure but service is running

Sometimes `otterway-deploy` reports failure even when the build succeeds. Check actual status:

```bash
sudo systemctl status otterseal
otterway-status
```

If the service is running with an old image, restart it:
```bash
sudo systemctl restart otterseal
```
