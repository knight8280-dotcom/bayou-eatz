# Auto-posting to Facebook and Instagram

This connects the **Publish** button on `/post.html` to the Bayou Eatz
Facebook page and Instagram account, so one post lands on the website and
both socials at once.

## Read this before you start

**It takes about an hour, and most of that is Meta's developer console.**
There is no shortcut — Facebook requires an app, an app requires a business
account, and a token has to be exchanged for a longer-lived one. It is not
difficult, but it is tedious, and Meta moves things around.

**Everything below is optional.** Without it, publishing still updates the
website instantly and still writes you the caption to paste. The socials
step just saves the paste.

Two hard rules from Meta, not from us:

- **Instagram cannot post text.** Every Instagram post must have a photo or
  video. Updates without a photo go to the website and Facebook, and skip
  Instagram. Nothing is broken when that happens.
- **Instagram must be a Business or Creator account** linked to the Facebook
  page. A personal Instagram account cannot be posted to by any API.

---

## What you'll end up with

Three values, saved inside the Apps Script (never in the website):

| Value | What it is |
|---|---|
| `FB_PAGE_ID` | The numeric ID of the Bayou Eatz Facebook page |
| `FB_PAGE_TOKEN` | A long-lived **page** access token |
| `IG_USER_ID` | The Instagram business account ID (skip if not using Instagram) |

---

## Step 1 — Instagram: make it a business account

Skip if you're only connecting Facebook.

1. Instagram app → **Settings → Account type and tools → Switch to
   professional account** → choose **Business**.
2. Still in there, link it to the **Bayou Eatz Facebook page**.

## Step 2 — Make a Meta app

1. Go to **developers.facebook.com** → log in as the account that manages the
   Bayou Eatz page → **My Apps → Create App**.
2. Use case: **Other** → type: **Business** → name it something like
   "Bayou Eatz Website".
3. In the app dashboard, add the product **Facebook Login for Business**.

You do **not** need to submit the app for review. Review is only required
when other people's accounts use your app. Joe's app posting to Joe's own
page, with Joe as the app's admin, works in development mode.

## Step 3 — Get a token

1. Go to **developers.facebook.com/tools/explorer** (Graph API Explorer).
2. Top right: pick your app.
3. **Permissions** — add these:
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_posts`
   - `instagram_basic` *(only if using Instagram)*
   - `instagram_content_publish` *(only if using Instagram)*
   - `business_management`
4. Click **Generate Access Token** and approve the popup. Make sure the
   Bayou Eatz page is ticked.
5. You now have a **short-lived user token**. Copy it somewhere.

## Step 4 — Find the page ID and a page token

Still in the Graph API Explorer, run:

```
me/accounts
```

The response lists the pages you manage. Find Bayou Eatz and note two things:

- `id` → this is your **FB_PAGE_ID**
- `access_token` → this is a **page token**, which is what you want

## Step 5 — Make the page token long-lived

A fresh page token expires in about an hour. Exchange it so it doesn't.

In the browser, replace the three bracketed parts and open this address:

```
https://graph.facebook.com/v21.0/oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id=[YOUR APP ID]
  &client_secret=[YOUR APP SECRET]
  &fb_exchange_token=[THE SHORT-LIVED USER TOKEN FROM STEP 3]
```

(App ID and secret are in the app dashboard under **App settings → Basic**.)

That returns a **long-lived user token**. Put *that* back into the Graph API
Explorer and run `me/accounts` again — the page token you get this time
**does not expire** as long as Joe stays an admin of the page and doesn't
change his Facebook password.

That page token is your **FB_PAGE_TOKEN**.

> Treat it like a password. Anyone holding it can post as the page. It goes
> in the Apps Script and nowhere else — never in the website repo, which is
> public.

## Step 6 — Instagram account ID

Skip if you're only connecting Facebook. In the Graph API Explorer, run:

```
[FB_PAGE_ID]?fields=instagram_business_account
```

The `id` that comes back is your **IG_USER_ID**.

## Step 7 — Save them into the script

1. Open the schedule sheet → **Extensions → Apps Script**.
2. Find `saveCredentials()` near the top and fill in the three values.
3. **Run → saveCredentials**. Approve the permissions prompt.
4. **Delete the values out of the function** and save the file again, so
   they aren't sitting in the editor where a shared screen could show them.
   They're stored safely in Script Properties now.

## Step 8 — Check it before trusting it

**Run → testConnections**, then **View → Logs**. You want:

```
Facebook: OK — connected to "Bayou Eatz"
Instagram: OK — connected to @bayoueatzz
```

Anything else, and the log says what Meta objected to.

---

## Using it

Nothing changes in how Joe posts. He writes the update on `/post.html` and
taps **Publish**. The site updates, and Facebook and Instagram get the same
words. The **Shared** column in the Posts tab records what went where:

| Shared | Meaning |
|---|---|
| `FB ✓ · IG ✓` | Both posted |
| `FB ✓ · IG –` | Facebook posted; Instagram skipped, no photo |
| `FB ✗ · IG ✗` | Something failed — check the Apps Script logs |
| `site only` | Socials aren't connected; the website updated |

## When it stops working

Long-lived page tokens survive indefinitely, but they are invalidated if:

- Joe changes his Facebook password
- He's removed as an admin of the page
- He revokes the app under **Facebook → Settings → Business Integrations**

The symptom is `FB ✗` in the Shared column. The cure is Steps 3–7 again,
about ten minutes once you've done it before.

**Nothing else breaks when the token dies.** The website keeps updating and
the caption is still written for you to paste. Only the automatic share
stops.
