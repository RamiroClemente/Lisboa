# Mixed Media Lab — Lisboa

FINAL CLEAN PACKAGE FOR GITHUB PAGES

Upload these files to the ROOT of the `Lisboa` repository:

- index.html
- .nojekyll
- README.md

IMPORTANT:
There should be only ONE HTML file in the repository root:
`index.html`

If you currently see `index (1).html`, delete it after confirming the new `index.html`
has been uploaded successfully.

Live page:
https://ramiroclemente.github.io/Lisboa/

Newsletter confirmation redirect:
https://ramiroclemente.github.io/Lisboa/?newsletter=1

Behavior:
- Normal visit → newsletter popup after 5 seconds if not subscribed.
- `?newsletter=1` → popup opens immediately and shows:
  PT: "Reserva confirmada!"
  EN: "Booking confirmed!"
- RC10! is the discount code.
- Portuguese is the default language; English is available in the language switch.
- All page images are embedded inside index.html; no assets folder is required.

Active links:
- Booking: https://calendly.com/ramiroclemente/lisboa
- Instagram: https://www.instagram.com/ramiroclemente/
- Facebook: https://www.facebook.com/ramiroclementeart/

Note:
The newsletter/contact forms still need a real provider endpoint if you want submitted
emails/messages to be transmitted and stored outside the browser.
